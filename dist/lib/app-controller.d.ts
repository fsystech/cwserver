import type { IHttpMimeHandler } from './http-mime';
import { AppHandler } from './server';
import type { IContext } from './context';
export interface IController {
    readonly httpMimeHandler: IHttpMimeHandler;
    any(route: string, next: AppHandler): IController;
    get(route: string, next: AppHandler): IController;
    post(route: string, next: AppHandler): IController;
    processAny(ctx: IContext): Promise<void>;
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
    private _routeTable;
    constructor(hasDefaultExt: boolean);
    reset(): void;
    private fireHandlerAsync;
    delete(...args: string[]): void;
    get(route: string, next: AppHandler): IController;
    post(route: string, next: AppHandler): IController;
    any(route: string, next: AppHandler): IController;
    private passDefaultDocAsync;
    private sendDefaultDocAsync;
    private processGetAsync;
    private processPostAsync;
    processAny(ctx: IContext): Promise<void>;
    remove(path: string): boolean;
    sort(): void;
}
