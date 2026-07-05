import type { ICwServer } from './server';
import type { IApplication } from './server-core';
import type { IController } from './app-controller';
export type ViewRegisterFunc = (app: IApplication, controller: IController, server: ICwServer) => Promise<void>;
export interface IAppViewRegister {
    /**
     * Register new `view` module
     * @param ev  Event name
     * @param next View register function
     */
    add(next: ViewRegisterFunc): void;
    initAsync(app: IApplication, controller: IController, server: ICwServer): Promise<void>;
}
declare class AppViewRegister implements IAppViewRegister {
    private _isInit;
    private _evt;
    private _isInitilized;
    get isInitilized(): boolean;
    set isInitilized(value: boolean);
    initAsync(app: IApplication, controller: IController, server: ICwServer): Promise<void>;
    add(next: ViewRegisterFunc): void;
}
export declare const AppView: AppViewRegister;
export declare function registerView(next: ViewRegisterFunc): void;
export {};
