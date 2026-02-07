import './app-global';
import { Server } from 'node:http';
import { type IRequestParam } from './app-router';
import { type IRequest } from './request';
import { type IResponse } from './response';
type onError = (req: IRequest, res: IResponse, err?: Error | number) => void;
export type NextFunction = (err?: any) => void;
export type HandlerFunc = (req: IRequest, res: IResponse, next: NextFunction, requestParam?: IRequestParam) => void;
export interface IApplication {
    readonly version: string;
    readonly httpServer: Server;
    readonly isRunning: boolean;
    clearHandler(): void;
    use(handler: HandlerFunc): IApplication;
    use(route: string, handler: HandlerFunc, isVirtual?: boolean): IApplication;
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApplication;
    shutdown(next: (err?: Error) => void): Promise<void> | void;
    shutdownAsync(): Promise<void>;
    on(ev: 'request-begain', handler: (req: IRequest) => void): IApplication;
    on(ev: 'response-end', handler: (req: IRequest, res: IResponse) => void): IApplication;
    on(ev: 'error', handler: onError): IApplication;
    on(ev: 'shutdown', handler: () => void): IApplication;
    listen(handle: any, listeningListener?: () => void): IApplication;
}
export declare const appVersion: string, readAppVersion: () => string;
export declare function App(): IApplication;
export {};
