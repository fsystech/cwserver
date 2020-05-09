import { ISowServer } from './sow-server';
import { ISession } from './sow-static';
import { Socket } from 'socket.io';
export interface IWsClientInfo {
    next: (session: ISession, socket: Socket) => void | boolean;
    client: (me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer) => {
        [x: string]: any;
    };
    getServerEvent(): Array<{
        [x: string]: any;
    }>;
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
    getOwners(group?: string): Array<ISowSocketInfo>;
    findByHash(hash: string): Array<ISowSocketInfo>;
    findByLogin(loginId: string): Array<ISowSocketInfo>;
    toList(sockets: Array<ISowSocketInfo>): Array<{
        [x: string]: any;
    }>;
    getClientByExceptHash(exceptHash: string, group?: string): Array<ISowSocketInfo>;
    getClientByExceptLogin(exceptLoginId: string, group?: string): Array<ISowSocketInfo>;
    getClient(token: string, group?: string): Array<ISowSocketInfo>;
    getSocket(token: string): ISowSocketInfo | void;
    removeSocket(token: string): boolean;
    sendMsg(token: string, method: string, data?: any): boolean;
}
export declare class WsClientInfo implements IWsClientInfo {
    next: (session: ISession, socket: Socket) => void | boolean;
    client: (me: ISowSocketInfo, session: ISession, sowSocket: ISowSocket, server: ISowServer) => {
        [x: string]: any;
    };
    constructor();
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
    create(): void;
}
export declare function SoketInitilizer(server: ISowServer, wsClientInfo: IWsClientInfo): {
    isConnectd: boolean;
    wsEvent: Array<{
        [x: string]: any;
    }>;
    create: () => void;
};
