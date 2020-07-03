/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 12:47 PM 7/3/2020
import { IApplication } from './sow-server-core';
import { IController } from './sow-controller';
import { ISowServer } from './sow-server';
import { loadMimeType, IMimeType } from './sow-http-mime-types';
import { SendBox } from './sow-template';
type IViewRegister = ( app: IApplication, controller: IController, server: ISowServer ) => void;
interface ISowGlobalServer {
    on( ev: "register-view", next: IViewRegister ): void;
    emit( ev: "register-view", app: IApplication, controller: IController, server: ISowServer ): void;
}
class SowGlobalServer implements ISowGlobalServer {
    private _evt: IViewRegister[];
    private _isInitilized: boolean;
    constructor() {
        this._evt = [];
        this._isInitilized = false;
    }
    public emit( ev: "register-view", app: IApplication, controller: IController, server: ISowServer ): void {
        this._evt.forEach( handler => {
            return handler( app, controller, server );
        } );
        this._evt.length = 0;
        this._isInitilized = true;
    }
    public on( ev: "register-view", next: ( app: IApplication, controller: IController, server: ISowServer ) => void ): void {
        if ( this._isInitilized ) {
            throw new Error( "After initilize view, you should not register new veiw." );
        }
        this._evt.push( next );
    }
}
interface ISowGlobal {
    isInitilized: boolean;
    readonly HttpMime: IMimeType<string>;
    readonly server: ISowGlobalServer;
    readonly templateCtx: NodeJS.Dict<SendBox>;
}
class SowGlobal implements ISowGlobal {
    public isInitilized: boolean;
    _server: ISowGlobalServer;
    _HttpMime: IMimeType<string>;
    _templateCtx: NodeJS.Dict<SendBox>;
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
    }
}
if ( !global.sow ) {
    global.sow = new SowGlobal();
}