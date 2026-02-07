import type { ICwServer } from './server';
import type { IApplication } from './server-core';
import type { IController } from './app-controller';
export type ViewRegisterFunc = (app: IApplication, controller: IController, server: ICwServer) => void;
export interface IAppViewRegister {
    /**
     * Register new `view` module
     * @param ev  Event name
     * @param next View register function
     */
    add(next: ViewRegisterFunc): void;
    init(app: IApplication, controller: IController, server: ICwServer): void;
}
declare class AppViewRegister implements IAppViewRegister {
    private _isInit;
    private _evt;
    private _isInitilized;
    get isInitilized(): boolean;
    set isInitilized(value: boolean);
    init(app: IApplication, controller: IController, server: ICwServer): void;
    add(next: ViewRegisterFunc): void;
}
export declare const AppView: AppViewRegister;
export declare function registerView(next: ViewRegisterFunc): void;
export {};
