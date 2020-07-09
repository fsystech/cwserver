/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { Encryption } from './sow-encryption';
import { ISowServer } from './sow-server';
import { ISession } from './sow-static';
import { Util } from './sow-util';
import { EventEmitter } from 'events';
import { Server } from 'http';
/** [socket.io blueprint] */
export interface IOSocket extends EventEmitter {
    nsp: object;
    server: object;
    adapter: object;
    id: string;
    request: { session: ISession, headers: any };
    client: object;
    conn: object;
    rooms: { [id: string]: string };
    connected: boolean;
    disconnected: boolean;
    handshake: any;
    json: IOSocket;
    volatile: IOSocket;
    broadcast: IOSocket;
    to( room: string ): IOSocket;
    in( room: string ): IOSocket;
    use( fn: ( packet: any[], next: ( err?: any ) => void ) => void ): IOSocket;
    send( ...args: any[] ): IOSocket;
    write( ...args: any[] ): IOSocket;
    join( name: string | string[], fn?: ( err?: any ) => void ): IOSocket;
    leave( name: string, fn?: () => void ): IOSocket;
    leaveAll(): void;
    disconnect( close?: boolean ): IOSocket;
    listeners( event: string ): (()=>void)[];
    compress( compress: boolean ): IOSocket;
    error( err: any ): void;
}
interface Namespace {
    _path: string;
    close( ...args: any[]): void;
    use( fn: ( socket: IOSocket, fn: ( err?: any ) => void ) => void ): Namespace
    on( event: 'connect', listener: ( socket: IOSocket ) => void ): Namespace;
    on( event: 'connection', listener: ( socket: IOSocket ) => void ): this;
}
type ioServer = ( server: any, opt: { path?: string, pingTimeout?: number, cookie?: boolean } ) => Namespace;
/** [/socket.io blueprint] */
export interface IWsClientInfo {
    on( ev: 'getClient', handler: IWsClient ): void;
    on( ev: 'disConnected' | 'connected', handler: IEvtHandler ): void;
    on( ev: 'beforeInitiateConnection', handler: IWsNext ): void;
    emit( ev: 'disConnected' | 'connected' | 'beforeInitiateConnection', me: ISowSocketInfo, wsServer: ISowSocketServer ): void;
    getServerEvent(): { [x: string]: any; } | void;
    beforeInitiateConnection: IWsNext;
    client: IWsClient;
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
    roleId: string;
    getSocket(): IOSocket;
    sendMsg( method: string, data: any ): void;
}
export interface ISowSocketServer {
    isActiveSocket( token: string ): boolean;
    getOwners( group?: string ): ISowSocketInfo[];
    findByHash( hash: string ): ISowSocketInfo[];
    findByLogin( loginId: string ): ISowSocketInfo[];
    findeByRoleId( roleId: string ): ISowSocketInfo[];
    toList( sockets: ISowSocketInfo[] ): { [x: string]: any; }[];
    getClientByExceptHash( exceptHash: string, group?: string ): ISowSocketInfo[];
    getClientByExceptLogin( exceptLoginId: string, group?: string ): ISowSocketInfo[];
    getClientByExceptToken( token: string, group?: string ): ISowSocketInfo[];
    getSocket( token: string ): ISowSocketInfo | void;
    removeSocket( token: string ): boolean;
    sendMsg( token: string, method: string, data?: any ): boolean;
}
type IEvtHandler = ( me: ISowSocketInfo, wsServer: ISowSocketServer ) => void;
type IWsNext = ( session: ISession, socket: IOSocket ) => void | boolean;
type IWsClient = ( me: ISowSocketInfo, session: ISession, sowSocket: ISowSocketServer, server: ISowServer ) => { [x: string]: any; };
class WsClientInfo implements IWsClientInfo {
    beforeInitiateConnection: IWsNext = Object.create( null );
    client: IWsClient = Object.create( null );
    event: { [id: string]: any } = {};
    getServerEvent(): { [x: string]: any; } | void {
        const obj = this.event.getClient();
        if ( obj instanceof Object ) {
            return obj;
        }
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
        return void 0;
    }
    emit( ev: string, me: ISowSocketInfo, wsServer: ISowSocketServer ): void {
        if ( this.event[ev] ) {
            return this.event[ev]( me, wsServer );
        }
    }
}
export function wsClient( ): IWsClientInfo {
    return new WsClientInfo( );
}
class SowSocketServer implements ISowSocketServer {
    _server: ISowServer;
    _wsClients: IWsClientInfo;
    implimented: boolean;
    socket: ISowSocketInfo[];
    connected: boolean;
    constructor( server: ISowServer, wsClientInfo: IWsClientInfo ) {
        this.implimented = false; this.socket = [];
        this.connected = false;
        this._server = server; this._wsClients = wsClientInfo;
    }
    isActiveSocket( token: string ): boolean {
        return this.socket.some( soc => soc.token === token );
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
    findeByRoleId( roleId: string ): ISowSocketInfo[] {
        return this.socket.filter( soc => soc.roleId === roleId );
    }
    toList( sockets: ISowSocketInfo[] ): { [x: string]: any; }[] {
        const list: { [x: string]: any; }[] = [];
        if ( sockets.length === 0 ) return list;
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
        const index: number = this.socket.findIndex( ( soc: ISowSocketInfo ) => {
            return soc.token === token;
        } );
        if ( index < 0 ) return false;
        this.socket.splice( index, 1 );
        return true;
    }
    sendMsg( token: string, method: string, data?: any ): boolean {
        const soc: ISowSocketInfo | void = this.getSocket( token );
        if ( !soc ) return false;
        return soc.sendMsg( method, data ), true;
    }
    create( ioserver: ioServer, httpServer: Server ): boolean {
        if ( this.implimented ) return false;
        this.implimented = true;
        const io = ioserver( httpServer, {
            path: this._server.config.socketPath,
            pingTimeout: ( 1000 * 5 ),
            cookie: true
        } );
        this._server.on( "shutdown", (): void => {
            io.close();
        } );
        if ( !this._server.config.socketPath ) {
            this._server.config.socketPath = io._path;
        }
        io.use( ( socket: IOSocket, next: ( err?: any ) => void ): void => {
            socket.request.session = this._server.parseSession( socket.request.headers.cookie );
            if ( this._wsClients.beforeInitiateConnection( socket.request.session, socket ) ) {
                return next();
            }
        } );
        return io.on( "connect", ( socket: IOSocket ): void => {
            this.connected = socket.connected;
        } ).on( 'connection', ( socket: IOSocket ): void => {
            const _me: ISowSocketInfo = ( (): ISowSocketInfo => {

                const socketInfo: ISowSocketInfo = {
                    token: Util.guid(),
                    loginId: socket.request.session.loginId,
                    hash: void 0,
                    socketId: socket.id,
                    isAuthenticated: socket.request.session.isAuthenticated,
                    isOwner: false,
                    group: void 0,
                    isReconnectd: false,
                    roleId: "_INVALID_",
                    getSocket: (): IOSocket => { return socket; },
                    sendMsg: ( method: string, data: any ): void => {
                        return socket.emit( method, data ), void 0;
                    },
                };
                if ( socket.request.session.isAuthenticated ) {
                    socketInfo.hash = Encryption.toMd5( socket.request.session.loginId );
                    socketInfo.roleId = socket.request.session.roleId;
                }
                this.socket.push( socketInfo );
                return socketInfo;
            } )();
            socket.on( 'disconnect', ( ...args: any[] ): void => {
                if ( this.removeSocket( _me.token ) ) {
                    this._wsClients.emit( "disConnected", _me, this );
                }
                return void 0;
            } );
            const client = this._wsClients.client( _me, socket.request.session, this, this._server );
            for ( const method in client ) {
                socket.on( method, client[method] );
            }
            return this._wsClients.emit( "connected", _me, this ), void 0;
        } ), true;
    }
}
/**
 * If you want to use it you've to install socket.io
 * const ws = socketInitilizer( server, SocketClient() );
 * ws.create( require( "socket.io" ), app.httpServer );
 */
export function socketInitilizer( server: ISowServer, wsClientInfo: IWsClientInfo ): {
    readonly isConnectd: boolean;
    readonly wsEvent: { [x: string]: any; } | void;
    readonly create: ( ioserver: any, httpServer: Server ) => boolean;
    readonly wsServer: ISowSocketServer;
} {
    if ( typeof ( wsClientInfo.client ) !== "function" ) {
        throw new Error( "`getClient` event did not registered..." );
    }
    if ( typeof ( wsClientInfo.beforeInitiateConnection ) !== "function" ) {
        throw new Error( "`beforeInitiateConnection` event did not registered..." );
    }
    let _wsEvent: { [x: string]: any; } | void = void 0;
    const _ws: SowSocketServer = new SowSocketServer( server, wsClientInfo );
    return {
        get wsServer() {
            return _ws;
        },
        get isConnectd(): boolean {
            return _ws.implimented;
        },
        get wsEvent(): { [x: string]: any; } | void {
            return _wsEvent ? _wsEvent : ( _wsEvent = wsClientInfo.getServerEvent(), _wsEvent );
        },
        create( ioserver: any, httpServer: Server ): boolean {
            return _ws.create( ioserver, httpServer );
        }
    };
}