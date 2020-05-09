import { IHttpMimeHandler } from './sow-http-mime';
import { ISowServer, IContext, AppHandler } from './sow-server';
export interface IController {
    httpMimeHandler: IHttpMimeHandler;
    any(route: string, next: (ctx: IContext) => any): IController;
    get(route: string, next: (ctx: IContext) => any): IController;
    post(route: string, next: (ctx: IContext) => any): IController;
    processAny(ctx: IContext): any;
}
export declare class Controller implements IController {
    private _server;
    httpMimeHandler: IHttpMimeHandler;
    constructor(server: ISowServer);
    get(route: string, next: AppHandler): IController;
    post(route: string, next: AppHandler): IController;
    any(route: string, next: AppHandler): IController;
    private processGet;
    private processPost;
    processAny(ctx: IContext): any;
}
