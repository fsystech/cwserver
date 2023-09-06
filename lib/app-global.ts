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

// 12:47 PM 7/3/2020
// by rajib chy
import { IApplication } from './server-core';
import { IController } from './app-controller';
import { ICwServer } from './server';
import { loadMimeType, IMimeType } from './http-mime-types';
import { SandBox } from './app-template';
type IViewRegister = (app: IApplication, controller: IController, server: ICwServer) => void;
interface ICwGlobalServer {
    /**
     * Register new `view` module
     * @param ev  Event name
     * @param next View register function
     */
    on(ev: "register-view", next: IViewRegister): void;
    emit(ev: "register-view", app: IApplication, controller: IController, server: ICwServer): void;
}
class CwGlobalServer implements ICwGlobalServer {
    private _evt: IViewRegister[];
    private _isInitilized: boolean;
    constructor() {
        this._evt = [];
        this._isInitilized = false;
    }
    public emit(ev: "register-view", app: IApplication, controller: IController, server: ICwServer): void {
        this._isInitilized = true;
        this._evt.forEach(handler => {
            return handler(app, controller, server);
        });
        this._evt.length = 0;
    }
    public on(ev: "register-view", next: (app: IApplication, controller: IController, server: ICwServer) => void): void {
        if (this._isInitilized) {
            throw new Error('After initialization "views", you could not register new view.');
        }
        this._evt.push(next);
    }
}
interface ICwGlobal {
    isInitilized: boolean;
    readonly HttpMime: IMimeType<string>;
    readonly server: ICwGlobalServer;
    readonly templateCtx: NodeJS.Dict<SandBox>;
}
class CwGlobal implements ICwGlobal {
    public isInitilized: boolean;
    private _server: ICwGlobalServer;
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
        this._server = new CwGlobalServer();
        this.isInitilized = false;
        this._HttpMime = loadMimeType<string>();
        this._templateCtx = {};
    }
}
declare global {
    namespace NodeJS {
        interface Global {
            cw: ICwGlobal;
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
    var cw: ICwGlobal;
    /**
     * `cwserver` import script/assets from local resource. If you like to use `pkg` ({@see https://github.com/vercel/pkg }) compiler, please override this method at root.
     */
    function _importLocalAssets(path: string): any;
}

if (!global.cw) {
    global.cw = new CwGlobal();
}
if (!global._importLocalAssets) {
    global._importLocalAssets = (path: string): any => require(path);
}