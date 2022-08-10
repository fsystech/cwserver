import { IHttpMimeHandler } from './sow-http-mime';
import { IContext, AppHandler } from './sow-server';
export interface IController {
    readonly httpMimeHandler: IHttpMimeHandler;
    any(route: string, next: AppHandler): IController;
    get(route: string, next: AppHandler): IController;
    post(route: string, next: AppHandler): IController;
    processAny(ctx: IContext): void;
    reset(): void;
    /** The given `arguments` will be skip */
    delete(...args: string[]): void;
    remove(path: string): boolean;
    sort(): void;
}
export declare class Controller implements IController {
    private _httpMimeHandler;
    private _fileInfo;
    private _hasDefaultExt;
    get httpMimeHandler(): IHttpMimeHandler;
    constructor(hasDefaultExt: boolean);
    reset(): void;
    delete(...args: string[]): void;
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
