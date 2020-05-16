/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { Encryption } from './sow-encryption';
import { ISowServer } from './sow-server';
import { ISession } from './sow-static';
import { Util } from './sow-util';
/** [socket.io blueprint] */
interface Socket extends NodeJS.EventEmitter {
    nsp: object;
    server: object;
    adapter: object;
    id: string;
    request: { session?: ISession, headers: any };
    client: object;
    conn: object;
    rooms: { [id: string]: string };
    connected: boolean;
    disconnected: boolean;
    handshake: any;
    json: Socket;
    volatile: Socket;
    broadcast: Socket;
    to( room: string ): Socket;
    in( room: string ): Socket;
    use( fn: ( packet: any[], next: ( err?: any ) => void ) => void ): Socket;
    send( ...args: any[] ): Socket;
    write( ...args: any[] ): Socket;
    join( name: string | string[], fn?: ( err?: any ) => void ): Socket;
    leave( name: string, fn?: Function ): Socket;
    leaveAll(): void;
    disconnect( close?: boolean ): Socket;
    listeners( event: string ): Function[];
    compress( compress: boolean ): Socket;
    error( err: any ): void;
}
interface Namespace {
    _path: string;
    use( fn: ( socket: Socket, fn: ( err?: any ) => void ) => void ): Namespace
    on( event: 'connect', listener: ( socket: Socket ) => void ): Namespace;
    on( event: 'connection', listener: ( socket: Socket ) => void ): this;
}
type ioServer = ( server: any, opt: { path?: string, pingTimeout?: number, cookie?: boolean } ) => Namespace;
/** [/socket.io blueprint] */
export interface IWsClientInfo {
    next: ( session: ISession, socket: Socket ) => void | boolean;
    client: ( me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer ) => { [x: string]: any; };
    getServerEvent(): { [x: string]: any; }[];
    on( name: string, handler: IEvtHandler ): void;
    fire( name: string, me: ISowSocketInfo, wsServer: ISowSocket ): void;
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
    getOwners( group?: string ): ISowSocketInfo[];
    findByHash( hash: string ): ISowSocketInfo[];
    findByLogin( loginId: string ): ISowSocketInfo[];
    toList( sockets: ISowSocketInfo[] ): { [x: string]: any; }[];
    getClientByExceptHash( exceptHash: string, group?: string ): ISowSocketInfo[];
    getClientByExceptLogin( exceptLoginId: string, group?: string ): ISowSocketInfo[];
    getClientByExceptToken( token: string, group?: string ): ISowSocketInfo[];
    getSocket( token: string ): ISowSocketInfo | void;
    removeSocket( token: string ): boolean;
    sendMsg( token: string, method: string, data?: any ): boolean;
}
type IEvtHandler = ( me: ISowSocketInfo, wsServer: ISowSocket ) => void;
type IWsNext = ( session: ISession, socket: Socket ) => void | boolean;
type IWsClient = ( me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer ) => { [x: string]: any; };
export class WsClientInfo implements IWsClientInfo {
    next: IWsNext;
    client: IWsClient;
    event: { [id: string]: IEvtHandler } = {};
    constructor( next: IWsNext, client: IWsClient ) {
        this.client = client;
        this.next = next;
    }
    getServerEvent(): { [x: string]: any; }[] {
        throw new Error( "Method not implemented." );
    }
    on( name: string, handler: IEvtHandler ): void {
        this.event[name] = handler;
    }
    fire( name: string, me: ISowSocketInfo, wsServer: ISowSocket ): void {
        if ( !this.event[name] ) return void 0;
        return this.event[name]( me, wsServer );
    }
}
// tslint:disable-next-line: max-classes-per-file
class SowSocket implements ISowSocket {
    _server: ISowServer;
    _wsClientInfo: IWsClientInfo;
    implimented: boolean;
    socket: ISowSocketInfo[];
    connected: boolean;
    constructor( server: ISowServer, wsClientInfo: IWsClientInfo ) {
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
    getClientByExceptToken( token: string, group?: string ): ISowSocketInfo[] {
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
    create( ioserver: ioServer ): void {
        if ( this.implimented ) return void 0;
        this.implimented = true;
        const io = ioserver( this._server.getHttpServer(), {
            path: this._server.config.socketPath,
            pingTimeout: ( 1000 * 5 ),
            cookie: true
        } );
        if ( !this._server.config.socketPath ) {
            this._server.config.socketPath = io._path;
        }
        io.use( ( socket: Socket, next: ( err?: any ) => void ) => {
            if ( !socket.request.session ) {
                socket.request.session = this._server.parseSession( socket.request.headers.cookie );
            }
            if ( !this._wsClientInfo.next( socket.request.session, socket ) ) return void 0;
            return next();
        } );
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
            socket.on( 'disconnect', () => {
                if ( !this.removeSocket( _me.token ) ) return;
                this._wsClientInfo.fire( "onDisConnected", _me, this );
            } );
            const client = this._wsClientInfo.client( _me, socket.request.session, this, this._server );
            // tslint:disable-next-line: forin
            for ( const method in client ) {
                socket.on( method, client[method] );
            }
            this._wsClientInfo.fire( "onConnected", _me, this );
            return void 0;
        } ), void 0;
    }
}
/** If you want to use it you've to install socket.io */
export function socketInitilizer( server: ISowServer, wsClientInfo: IWsClientInfo ): {
    isConnectd: boolean;
    wsEvent: { [x: string]: any; }[];
    create: ( ioserver: ioServer ) => void;
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
        get wsEvent(): { [x: string]: any; }[] {
            return _ws_event;
        },
        create( ioserver: ioServer ): void {
            if ( _ws.implimented ) return;
            return _ws.create( ioserver );
        }
    };
}