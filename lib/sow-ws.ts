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
    close( ...args: any[]): void;
    use( fn: ( socket: Socket, fn: ( err?: any ) => void ) => void ): Namespace
    on( event: 'connect', listener: ( socket: Socket ) => void ): Namespace;
    on( event: 'connection', listener: ( socket: Socket ) => void ): this;
}
type ioServer = ( server: any, opt: { path?: string, pingTimeout?: number, cookie?: boolean } ) => Namespace;
/** [/socket.io blueprint] */
export interface IWsClientInfo {
    on( ev: 'getClient', handler: IWsClient ): void;
    on( ev: 'disConnected', handler: IEvtHandler ): void;
    on( ev: 'connected', handler: IEvtHandler ): void;
    on( ev: 'beforeInitiateConnection', handler: IWsNext ): void;
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
class WsClientInfo implements IWsClientInfo {
    beforeInitiateConnection: IWsNext = Object.create( null );
    client: IWsClient = Object.create( null );
    event: { [id: string]: any } = {};
    constructor(  ) {}
    getServerEvent(): { [x: string]: any; }[] {
        if ( !this.event["getClient"] )
            throw new Error( "`getClient` event did not registered..." );
        const obj = this.event["getClient"]();
        if ( obj instanceof Array ) return obj;
        return [];
    }
    on( ev: string, handler: any ): void {
        if ( ev === "getClient" ) {
            this.event[ev] = handler;
            return this.client = handler, void 0;
        }
        if ( ev === 'beforeInitiateConnection' ) {
            return this.beforeInitiateConnection = handler, void 0;
        }
        this.event[ev] = handler;
    }
    emit( ev: 'getClient', me: ISowSocketInfo, wsServer: ISowSocket ): void;
    emit( ev: 'disConnected', me: ISowSocketInfo, wsServer: ISowSocket ): void;
    emit( ev: 'connected', me: ISowSocketInfo, wsServer: ISowSocket ): void;
    emit( ev: 'beforeInitiateConnection', me: ISowSocketInfo, wsServer: ISowSocket ): void;
    emit( ev: string, me: ISowSocketInfo, wsServer: ISowSocket ): void {
        if ( !this.event[ev] ) return void 0;
        return this.event[ev]( me, wsServer );
    }
}
export function wsClient( ): IWsClientInfo {
    return new WsClientInfo( );
}
// tslint:disable-next-line: max-classes-per-file
class SowSocket implements ISowSocket {
    _server: ISowServer;
    _wsClients: WsClientInfo;
    implimented: boolean;
    socket: ISowSocketInfo[];
    connected: boolean;
    constructor( server: ISowServer, wsClientInfo: WsClientInfo ) {
        this.implimented = false; this.socket = [];
        this.connected = false;
        this._server = server; this._wsClients = wsClientInfo;
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
        this._server.on( "shutdown", () => {
            io.close();
        } );
        if ( !this._server.config.socketPath ) {
            this._server.config.socketPath = io._path;
        }
        io.use( ( socket: Socket, next: ( err?: any ) => void ) => {
            if ( !socket.request.session ) {
                socket.request.session = this._server.parseSession( socket.request.headers.cookie );
            }
            if ( !this._wsClients.beforeInitiateConnection( socket.request.session, socket ) ) return void 0;
            return next();
        } );
        return io.on( "connect", ( socket ) => {
            this.connected = socket.connected;
        } ).on( 'connection', ( socket ) => {
            if ( !socket.request.session ) {
                socket.request.session = this._server.parseSession( socket.handshake.headers.cookie );
            }
            if ( !this._wsClients.beforeInitiateConnection( socket.request.session, socket ) ) return void 0;
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
                return this._wsClients.emit( "disConnected", _me, this ), void 0;
            } );
            const client = this._wsClients.client( _me, socket.request.session, this, this._server );
            // tslint:disable-next-line: forin
            for ( const method in client ) {
                socket.on( method, client[method] );
            }
            return this._wsClients.emit( "connected", _me, this ), void 0;
        } ), void 0;
    }
}
/** If you want to use it you've to install socket.io */
export function socketInitilizer( server: ISowServer, wsClientInfo: WsClientInfo ): {
    isConnectd: boolean;
    wsEvent: { [x: string]: any; }[];
    create: ( ioserver: ioServer ) => void;
} {
    if ( typeof ( wsClientInfo.client ) !== "function" ) {
        throw new Error( "`getClient` event did not registered..." );
    }
    if ( typeof ( wsClientInfo.beforeInitiateConnection ) !== "function" ) {
        throw new Error( "`beforeInitiateConnection` event did not registered..." );
    }
    let _ws_event: { [x: string]: any; }[] | undefined = void 0;
    const _ws: SowSocket = new SowSocket( server, wsClientInfo );
    return {
        get isConnectd(): boolean {
            return _ws.implimented;
        },
        get wsEvent(): { [x: string]: any; }[] {
            return _ws_event ? _ws_event : ( _ws_event = wsClientInfo.getServerEvent(), _ws_event );
        },
        create( ioserver: ioServer ): void {
            if ( _ws.implimented ) return;
            return _ws.create( ioserver );
        }
    };
}