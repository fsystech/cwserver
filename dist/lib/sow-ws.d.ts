/// <reference types="node" />
import { ISowServer } from './sow-server';
import { ISession } from './sow-static';
/** [socket.io blueprint] */
interface Socket extends NodeJS.EventEmitter {
    nsp: object;
    server: object;
    adapter: object;
    id: string;
    request: {
        session?: ISession;
        headers: any;
    };
    client: object;
    conn: object;
    rooms: {
        [id: string]: string;
    };
    connected: boolean;
    disconnected: boolean;
    handshake: any;
    json: Socket;
    volatile: Socket;
    broadcast: Socket;
    to(room: string): Socket;
    in(room: string): Socket;
    use(fn: (packet: any[], next: (err?: any) => void) => void): Socket;
    send(...args: any[]): Socket;
    write(...args: any[]): Socket;
    join(name: string | string[], fn?: (err?: any) => void): Socket;
    leave(name: string, fn?: Function): Socket;
    leaveAll(): void;
    disconnect(close?: boolean): Socket;
    listeners(event: string): Function[];
    compress(compress: boolean): Socket;
    error(err: any): void;
}
interface Namespace {
    _path: string;
    close(...args: any[]): void;
    use(fn: (socket: Socket, fn: (err?: any) => void) => void): Namespace;
    on(event: 'connect', listener: (socket: Socket) => void): Namespace;
    on(event: 'connection', listener: (socket: Socket) => void): this;
}
declare type ioServer = (server: any, opt: {
    path?: string;
    pingTimeout?: number;
    cookie?: boolean;
}) => Namespace;
/** [/socket.io blueprint] */
export interface IWsClientInfo {
    on(ev: 'getClient', handler: IWsClient): void;
    on(ev: 'disConnected', handler: IEvtHandler): void;
    on(ev: 'connected', handler: IEvtHandler): void;
    on(ev: 'beforeInitiateConnection', handler: IWsNext): void;
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
    sendMsg(method: string, data: any): any;
}
export interface ISowSocket {
    isActiveSocket(token: string): boolean;
    getOwners(group?: string): ISowSocketInfo[];
    findByHash(hash: string): ISowSocketInfo[];
    findByLogin(loginId: string): ISowSocketInfo[];
    toList(sockets: ISowSocketInfo[]): {
        [x: string]: any;
    }[];
    getClientByExceptHash(exceptHash: string, group?: string): ISowSocketInfo[];
    getClientByExceptLogin(exceptLoginId: string, group?: string): ISowSocketInfo[];
    getClientByExceptToken(token: string, group?: string): ISowSocketInfo[];
    getSocket(token: string): ISowSocketInfo | void;
    removeSocket(token: string): boolean;
    sendMsg(token: string, method: string, data?: any): boolean;
}
declare type IEvtHandler = (me: ISowSocketInfo, wsServer: ISowSocket) => void;
declare type IWsNext = (session: ISession, socket: Socket) => void | boolean;
declare type IWsClient = (me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer) => {
    [x: string]: any;
};
declare class WsClientInfo implements IWsClientInfo {
    beforeInitiateConnection: IWsNext;
    client: IWsClient;
    event: {
        [id: string]: any;
    };
    constructor();
    getServerEvent(): {
        [x: string]: any;
    }[];
    on(ev: string, handler: any): void;
    emit(ev: 'getClient', me: ISowSocketInfo, wsServer: ISowSocket): void;
    emit(ev: 'disConnected', me: ISowSocketInfo, wsServer: ISowSocket): void;
    emit(ev: 'connected', me: ISowSocketInfo, wsServer: ISowSocket): void;
    emit(ev: 'beforeInitiateConnection', me: ISowSocketInfo, wsServer: ISowSocket): void;
}
export declare function wsClient(): IWsClientInfo;
/** If you want to use it you've to install socket.io */
export declare function socketInitilizer(server: ISowServer, wsClientInfo: WsClientInfo): {
    isConnectd: boolean;
    wsEvent: {
        [x: string]: any;
    }[];
    create: (ioserver: ioServer) => void;
};
export {};
