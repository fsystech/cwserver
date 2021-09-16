/// <reference types="node" />
import { IApplication } from './sow-server-core';
import { IController } from './sow-controller';
import { ISowServer } from './sow-server';
import { IMimeType } from './sow-http-mime-types';
import { SandBox } from './sow-template';
declare type IViewRegister = (app: IApplication, controller: IController, server: ISowServer) => void;
interface ISowGlobalServer {
    on(ev: "register-view", next: IViewRegister): void;
    emit(ev: "register-view", app: IApplication, controller: IController, server: ISowServer): void;
}
interface ISowGlobal {
    isInitilized: boolean;
    readonly HttpMime: IMimeType<string>;
    readonly server: ISowGlobalServer;
    readonly templateCtx: NodeJS.Dict<SandBox>;
}
declare global {
    namespace NodeJS {
        interface Global {
            sow: ISowGlobal;
        }
    }
}
declare global {
    var sow: ISowGlobal;
}
export {};
