import { IHttpMimeHandler } from './sow-http-mime';
import { IContext, AppHandler } from './sow-server';
export interface IController {
    readonly httpMimeHandler: IHttpMimeHandler;
    any(route: string, next: AppHandler): IController;
    get(route: string, next: AppHandler): IController;
    post(route: string, next: AppHandler): IController;
    processAny(ctx: IContext): void;
    reset(): void;
    remove(path: string): boolean;
    sort(): void;
}
export declare class Controller implements IController {
    private _httpMimeHandler;
    get httpMimeHandler(): IHttpMimeHandler;
    constructor();
    reset(): void;
    get(route: string, next: AppHandler): IController;
    post(route: string, next: AppHandler): IController;
    any(route: string, next: AppHandler): IController;
    private passDefaultDoc;
    private sendDefaultDoc;
    private processGet;
    private processPost;
    processAny(ctx: IContext): void;
    remove(path: string): boolean;
    sort(): void;
}
