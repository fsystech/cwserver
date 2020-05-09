/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { Encryption } from './sow-encryption';
import { ISowServer } from './sow-server';
import { ISession } from './sow-static';
import ioserver, { Socket } from 'socket.io';
import { Util } from './sow-util';
export interface IWsClientInfo {
    next: ( session: ISession, socket: Socket ) => void | boolean;
    client: ( me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer ) => { [x: string]: any; };
    getServerEvent(): Array<{ [x: string]: any; }>;
}
export interface ISowSocketInfo {
    token: string;
    loginId?: string;
    hash?: string;
    socketId: string;
    isOwner: boolean;
    isAuthenticated: boolean;
    isReconnectd: boolean;
    group?: string;
    getSocket(): Socket;
    sendMsg( method: string, data: any ): any;
}
export interface ISowSocket {
    isActiveSocket( token: string ): boolean;
    getOwners( group?: string ): Array<ISowSocketInfo>;
    findByHash( hash: string ): Array<ISowSocketInfo>;
    findByLogin( loginId: string ): Array<ISowSocketInfo>;
    toList( sockets: Array<ISowSocketInfo> ): Array<{ [x: string]: any; }>;
    getClientByExceptHash( exceptHash: string, group?: string ): Array<ISowSocketInfo>;
    getClientByExceptLogin( exceptLoginId: string, group?: string ): Array<ISowSocketInfo>;
    getClient( token: string, group?: string ): Array<ISowSocketInfo>;
    getSocket( token: string ): ISowSocketInfo | void;
    removeSocket( token: string ): boolean;
    sendMsg( token: string, method: string, data?: any ): boolean;
}
export class WsClientInfo implements IWsClientInfo {
    next: ( session: ISession, socket: Socket ) => void | boolean;
    client: ( me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer ) => { [x: string]: any; };
    constructor() {
        this.client = ( me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer ): { [x: string]: any; } => {
            throw new Error( "Method not implemented." );
        }
        this.next = ( session: ISession, socket: Socket ): void | boolean => {
            throw new Error( "Method not implemented." );
        }
    }
    getServerEvent(): { [x: string]: any; }[] {
        throw new Error("Method not implemented.");
    }
}
// tslint:disable-next-line: max-classes-per-file
export class SowSocketInfo implements ISowSocketInfo {
    token: string;
    loginId?: string;
    hash?: string;
    socketId: string;
    isOwner: boolean;
    isAuthenticated: boolean;
    isReconnectd: boolean;
    group?: string;
    constructor() {
        this.token = ""; this.socketId = "";
        this.isOwner = false; this.isAuthenticated = false;
        this.isReconnectd = false;
    }
    getSocket(): Socket {
        throw new Error( "Method not implemented." );
    }
    sendMsg( method: string, data: any ): any {
        throw new Error( "Method not implemented." );
    }
}
// tslint:disable-next-line: max-classes-per-file
export class SowSocket implements ISowSocket {
    _server: ISowServer;
    _wsClientInfo: IWsClientInfo;
    implimented: boolean;
    socket: ISowSocketInfo[];
    connected: boolean;
    constructor( server: ISowServer, wsClientInfo: IWsClientInfo ) {
        if ( !server.config.socketPath ) {
            throw new Error( "Socket Path should not left blank..." );
        }
        this.implimented = false; this.socket = [];
        this.connected = false;
        this._server = server; this._wsClientInfo = wsClientInfo;
    }
    isActiveSocket( token: string ): boolean {
        return this.socket.some( ( a ) => { return a.token === token; } );
    }
    getOwners( group?: string ): ISowSocketInfo[] {
        return group ? this.socket.filter( soc => soc.isOwner === true && soc.group === group ): this.socket.filter( soc => soc.isOwner === true );
    }
    findByHash( hash: string ): ISowSocketInfo[] {
        return this.socket.filter( soc => soc.hash === hash );
    }
    findByLogin( loginId: string ): ISowSocketInfo[] {
        return this.socket.filter( soc => soc.loginId === loginId );
    }
    toList( sockets: ISowSocketInfo[] ): { [x: string]: any; }[] {
        const list: { [x: string]: any; }[] = [];
        if ( !sockets ) return list;
        sockets.forEach( a => {
            list.push( {
                token: a.token, hash: a.hash, loginId: a.loginId
            } );
        } );
        return list;
    }
    getClientByExceptHash( exceptHash: string, group?: string ): ISowSocketInfo[] {
        return !group ? this.socket.filter(
            soc => soc.hash !== exceptHash
        ) : this.socket.filter(
            soc => soc.hash !== exceptHash && soc.group === group
        );
    }
    getClientByExceptLogin( exceptLoginId: string, group?: string ): ISowSocketInfo[] {
        return !group ? this.socket.filter(
            soc => soc.loginId !== exceptLoginId
        ) : this.socket.filter(
            soc => soc.loginId !== exceptLoginId && soc.group === group
        );
    }
    getClient( token: string, group?: string ): ISowSocketInfo[] {
        return !group ? this.socket.filter(
            soc => soc.token !== token
        ) : this.socket.filter(
            soc => soc.token !== token && soc.group === group
        );
    }
    getSocket( token: string ): ISowSocketInfo | void {
        return this.socket.find( soc => soc.token === token );
    }
    removeSocket( token: string ): boolean {
        let index = -1;
        this.socket.find( ( soc, i ) => {
            return ( soc.token === token ? ( index = i, true ) : false );
        } );
        if ( index < 0 ) return false;
        this.socket.splice( index, 1 );
        return true;
    }
    sendMsg( token: string, method: string, data?: any ): boolean {
        const soc = this.getSocket( token );
        if ( !soc ) return false;
        return soc.sendMsg( method, data ), true;
    }
    create(  ): void {
        if ( this.implimented ) return void 0;
        this.implimented = true;
        const io = ioserver( this._server.getHttpServer(), {
            path: this._server.config.socketPath,
            pingTimeout: ( 1000 * 5 ),
            cookie: true
        } );
        io.use( ( socket: Socket, next: ( err?: any ) => void ) => {
            if ( !socket.request.session ) {
                socket.request.session = this._server.parseSession( socket.request.headers.cookie );
            }
            if ( !this._wsClientInfo.next( socket.request.session, socket ) ) return void 0;
            return next();
        } );
        // _server.db.execute_io( "", "", "", () => { } );
        this._server.log.success( `Socket created...` );
        return io.on( "connect", ( socket ) => {
            this.connected = socket.connected;
        } ).on( 'connection', ( socket ) => {
            if ( !socket.request.session ) {
                socket.request.session = this._server.parseSession( socket.handshake.headers.cookie );
                if ( !this._wsClientInfo.next( socket.request.session, socket ) ) return void 0;
            }
            const _me: ISowSocketInfo = ( () => {
                const token = Util.guid();
                this.socket.push( {
                    token,
                    loginId: socket.request.session.loginId,
                    hash: socket.request.session.isAuthenticated ? Encryption.toMd5( socket.request.session.loginId ) : void 0,
                    socketId: socket.id,
                    isAuthenticated: socket.request.session.isAuthenticated,
                    isOwner: false,
                    group: void 0,
                    isReconnectd: false,
                    getSocket: (): Socket => { return socket; },
                    sendMsg: ( method: string, data: any ) => {
                        if ( !socket ) return this;
                        return socket.emit( method, data ), this;
                    },
                } );
                const socketInfo = this.getSocket( token );
                if ( !socketInfo )
                    throw new Error( "Should not here..." );
                return socketInfo;
            } )();
            this._server.log.success( `New Socket connected... Token# ${_me.token}` );
            socket.on( 'disconnect', () => {
                if ( !this.removeSocket( _me.token ) ) return;
                socket.broadcast.emit( "on-disconnect-user", {
                    token: _me.token, hash: _me.hash, loginId: _me.loginId
                } );
                this._server.log.info( `User disconnected==>${_me.token}` );
                return void 0;
            } );
            const client = this._wsClientInfo.client( _me, socket.request.session, this, this._server );
            // tslint:disable-next-line: forin
            for ( const method in client ) {
                socket.on( method, client[method] );
            }
            _me.sendMsg( _me.isReconnectd ? "on-re-connected" : "on-connected", {
                token: _me.token, hash: _me.hash, loginId: _me.loginId
            } );
            socket.broadcast.emit( "update-user-list", {
                users: [{
                    token: _me.token, hash: _me.hash, loginId: _me.loginId
                }]
            } );
            socket.emit( "update-user-list", {
                users: this.toList( this.getClient( _me.token ) )
            } );
            if ( _me.isReconnectd && _me.group ) {
                this._server.log.info( "Re-connected..." )
                this.getClient( _me.token, _me.group ).forEach( soc => {
                    soc.sendMsg( "on-re-connected-client", {
                        socket: _me.token
                    } );
                } )
            }
            return void 0;
        } ), void 0;
    }
}

export function SoketInitilizer( server: ISowServer, wsClientInfo: IWsClientInfo ): {
    isConnectd: boolean;
    wsEvent: Array<{ [x: string]: any; }>;
    create: () => void;
} {
    if ( typeof ( wsClientInfo.getServerEvent ) !== "function" ) {
        throw new Error( "Invalid IWsClientInfo..." );
    }
    if ( typeof ( wsClientInfo.next ) !== "function" ) {
        wsClientInfo.next = ( session: ISession, socket: Socket ): void | boolean => {
            return true;
        };
    }
    // tslint:disable-next-line: variable-name
    const _ws_event: { [x: string]: any; }[] = wsClientInfo.getServerEvent();
    const _ws: SowSocket = new SowSocket( server, wsClientInfo );
    return {
        get isConnectd(): boolean {
            return _ws.implimented;
        },
        get wsEvent(): Array<{ [x: string]: any; }> {
            return _ws_event;
        },
        create(): void {
            if ( _ws.implimented ) return;
            return _ws.create();
        }
    };
}