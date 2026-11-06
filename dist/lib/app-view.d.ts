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
    /**
     * Indicates whether the registered views have been initialized by the application.
     *
     * @returns True if views have been initialized, otherwise false.
     */
    get isInitilized(): boolean;
    /**
     * Sets the flag that records whether the registered views have been initialized.
     *
     * @param value New initialized state.
     */
    set isInitilized(value: boolean);
    /**
     * Runs every registered view handler in parallel with the application, controller and server, then
     * clears the handler list. Does nothing if already run or if no handlers are registered.
     *
     * @param app Application instance passed to each view handler.
     * @param controller Route controller passed to each view handler.
     * @param server Server instance passed to each view handler.
     * @returns A promise that resolves once all view handlers have completed; it rejects if any handler fails.
     */
    initAsync(app: IApplication, controller: IController, server: ICwServer): Promise<void>;
    /**
     * Queues a view registration handler to be run during initialization. Throws an Error if views have
     * already been initialized.
     *
     * @param next View registration function to queue.
     */
    add(next: ViewRegisterFunc): void;
}
export declare const AppView: AppViewRegister;
/**
 * Registers a view handler with the global view register so it is run when views are initialized.
 * Throws if registration happens after initialization.
 *
 * @param next View registration function receiving the app, controller and server.
 */
export declare function registerView(next: ViewRegisterFunc): void;
export {};
