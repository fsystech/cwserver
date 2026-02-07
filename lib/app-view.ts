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

class AppViewRegister implements IAppViewRegister {
    private _isInit: boolean = false;
    private _evt: ViewRegisterFunc[] = [];
    private _isInitilized: boolean = false;

    public get isInitilized(): boolean {
        return this._isInitilized;
    }

    public set isInitilized(value: boolean) {
        this._isInitilized = value;
    }

    public init(app: IApplication, controller: IController, server: ICwServer): void {

        if (this._isInit || this._evt.length === 0) return;

        this._isInit = true;

        this._evt.forEach(handler => {
            return handler(app, controller, server);
        });

        this._evt.length = 0;
    }

    public add(next: ViewRegisterFunc): void {

        if (this._isInit) {
            throw new Error('After initialization "views", you could not register new view.');
        }

        this._evt.push(next);
    }
}


class AppViewStatic {
    private static _instance: AppViewRegister = null;
    public static getInstance(): AppViewRegister {
        if (this._instance === null) {
            this._instance = new AppViewRegister();
        }
        return this._instance;
    }
}

export const AppView = AppViewStatic.getInstance();

export function registerView(next: ViewRegisterFunc): void {
    AppView.add(next);
}