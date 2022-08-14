// Copyright (c) 2022 Safe Online World Ltd.
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

// 12:47 PM 7/3/2020
// by rajib chy
import { IApplication } from './sow-server-core';
import { IController } from './sow-controller';
import { ISowServer } from './sow-server';
import { loadMimeType, IMimeType } from './sow-http-mime-types';
import { SandBox } from './sow-template';
type IViewRegister = (app: IApplication, controller: IController, server: ISowServer) => void;
interface ISowGlobalServer {
    /**
     * Register new `view` module
     * @param ev  Event name
     * @param next View register function
     */
    on(ev: "register-view", next: IViewRegister): void;
    emit(ev: "register-view", app: IApplication, controller: IController, server: ISowServer): void;
}
class SowGlobalServer implements ISowGlobalServer {
    private _evt: IViewRegister[];
    private _isInitilized: boolean;
    constructor() {
        this._evt = [];
        this._isInitilized = false;
    }
    public emit(ev: "register-view", app: IApplication, controller: IController, server: ISowServer): void {
        this._isInitilized = true;
        this._evt.forEach(handler => {
            return handler(app, controller, server);
        });
        this._evt.length = 0;
    }
    public on(ev: "register-view", next: (app: IApplication, controller: IController, server: ISowServer) => void): void {
        if (this._isInitilized) {
            throw new Error('After initialization "views", you could not register new view.');
        }
        this._evt.push(next);
    }
}
interface ISowGlobal {
    isInitilized: boolean;
    readonly HttpMime: IMimeType<string>;
    readonly server: ISowGlobalServer;
    readonly templateCtx: NodeJS.Dict<SandBox>;
}
class SowGlobal implements ISowGlobal {
    public isInitilized: boolean;
    private _server: ISowGlobalServer;
    private _HttpMime: IMimeType<string>;
    private _templateCtx: NodeJS.Dict<SandBox>;
    public get templateCtx() {
        return this._templateCtx;
    }
    public get server() {
        return this._server;
    }
    public get HttpMime() {
        return this._HttpMime;
    }
    constructor() {
        this._server = new SowGlobalServer();
        this.isInitilized = false;
        this._HttpMime = loadMimeType<string>();
        this._templateCtx = {};
    }
}
declare global {
    namespace NodeJS {
        interface Global {
            sow: ISowGlobal;
        }
        interface ProcessEnv {
            PORT?: string;
            SCRIPT?: "TS" | 'JS';
            IISNODE_VERSION?: string;
            APP_CONFIG_NAME?: string;
        }
        interface Process {
            /**
             * ```ts
             * If you build `cwserver` with `pkg`
             * please create folder to `project_root/lib/cwserver/`
             * copy `mime-types.json` and `schema.json` from node_module/cwserver
             * and please create folder to `project_root/lib/cwserver/dist/error_page`
             * copy all error page from node_module/cwserver/dist/error_page
             * ```
             * define {@see https://github.com/vercel/pkg }
             */
            pkg?: {
                mount: () => void;
                entrypoint: string;
                defaultEntrypoint: string;
                path: { resolve: () => void; }
            }
        }
    }
}
declare global {
    var sow: ISowGlobal;
    /** Import script/assets from local resource */
    function _importLocalAssets(path: string): any;
}
global.sow = new SowGlobal();
global._importLocalAssets = (path: string): any => {
    return require(path);
};