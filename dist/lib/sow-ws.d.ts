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
    next: (session: ISession, socket: Socket) => void | boolean;
    client: (me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer) => {
        [x: string]: any;
    };
    getServerEvent(): {
        [x: string]: any;
    }[];
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
    getClient(token: string, group?: string): ISowSocketInfo[];
    getSocket(token: string): ISowSocketInfo | void;
    removeSocket(token: string): boolean;
    sendMsg(token: string, method: string, data?: any): boolean;
}
declare type IWsNext = (session: ISession, socket: Socket) => void | boolean;
declare type IWsClient = (me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer) => {
    [x: string]: any;
};
export declare class WsClientInfo implements IWsClientInfo {
    next: IWsNext;
    client: IWsClient;
    constructor(next: IWsNext, client: IWsClient);
    getServerEvent(): {
        [x: string]: any;
    }[];
}
export declare class SowSocketInfo implements ISowSocketInfo {
    token: string;
    loginId?: string;
    hash?: string;
    socketId: string;
    isOwner: boolean;
    isAuthenticated: boolean;
    isReconnectd: boolean;
    group?: string;
    constructor();
    getSocket(): Socket;
    sendMsg(method: string, data: any): any;
}
export declare class SowSocket implements ISowSocket {
    _server: ISowServer;
    _wsClientInfo: IWsClientInfo;
    implimented: boolean;
    socket: ISowSocketInfo[];
    connected: boolean;
    constructor(server: ISowServer, wsClientInfo: IWsClientInfo);
    isActiveSocket(token: string): boolean;
    getOwners(group?: string): ISowSocketInfo[];
    findByHash(hash: string): ISowSocketInfo[];
    findByLogin(loginId: string): ISowSocketInfo[];
    toList(sockets: ISowSocketInfo[]): {
        [x: string]: any;
    }[];
    getClientByExceptHash(exceptHash: string, group?: string): ISowSocketInfo[];
    getClientByExceptLogin(exceptLoginId: string, group?: string): ISowSocketInfo[];
    getClient(token: string, group?: string): ISowSocketInfo[];
    getSocket(token: string): ISowSocketInfo | void;
    removeSocket(token: string): boolean;
    sendMsg(token: string, method: string, data?: any): boolean;
    create(ioserver: ioServer): void;
}
/** If you want to use it you've to install socket.io */
export declare function socketInitilizer(server: ISowServer, wsClientInfo: IWsClientInfo): {
    isConnectd: boolean;
    wsEvent: {
        [x: string]: any;
    }[];
    create: (ioserver: ioServer) => void;
};
export {};
