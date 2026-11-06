// Copyright (c) 2022 FSys Tech Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 12:25 AM 11/12/2025
// by rajib chy
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

    initAsync(
        app: IApplication,
        controller: IController,
        server: ICwServer
    ): Promise<void>;
}

class AppViewRegister implements IAppViewRegister {
    private _isInit: boolean = false;
    private _evt: ViewRegisterFunc[] = [];
    private _isInitilized: boolean = false;

    /**
     * Indicates whether the registered views have been initialized by the application.
     *
     * @returns True if views have been initialized, otherwise false.
     */
    public get isInitilized(): boolean {
        return this._isInitilized;
    }

    /**
     * Sets the flag that records whether the registered views have been initialized.
     *
     * @param value New initialized state.
     */
    public set isInitilized(value: boolean) {
        this._isInitilized = value;
    }

    /**
     * Runs every registered view handler in parallel with the application, controller and server, then
     * clears the handler list. Does nothing if already run or if no handlers are registered.
     *
     * @param app Application instance passed to each view handler.
     * @param controller Route controller passed to each view handler.
     * @param server Server instance passed to each view handler.
     * @returns A promise that resolves once all view handlers have completed; it rejects if any handler fails.
     */
    public async initAsync(
        app: IApplication, controller: IController, server: ICwServer
    ): Promise<void> {

        if (this._isInit || this._evt.length === 0) return;

        this._isInit = true;

        await Promise.all(this._evt.map(
            handler => handler(app, controller, server))
        );

        this._evt.length = 0;
    }

    /**
     * Queues a view registration handler to be run during initialization. Throws an Error if views have
     * already been initialized.
     *
     * @param next View registration function to queue.
     */
    public add(next: ViewRegisterFunc): void {

        if (this._isInit) {
            throw new Error('After initialization "views", you could not register new view.');
        }

        this._evt.push(next);
    }
}

class AppViewStatic {
    private static _instance: AppViewRegister = null;
    /**
     * Returns the shared view register, creating it on first use (lazy singleton).
     *
     * @returns The singleton AppViewRegister.
     */
    public static getInstance(): AppViewRegister {
        if (this._instance === null) {
            this._instance = new AppViewRegister();
        }
        return this._instance;
    }
}

export const AppView = AppViewStatic.getInstance();

/**
 * Registers a view handler with the global view register so it is run when views are initialized.
 * Throws if registration happens after initialization.
 *
 * @param next View registration function receiving the app, controller and server.
 */
export function registerView(next: ViewRegisterFunc): void {
    AppView.add(next);
}