import { IApplication } from './server-core';
import { ISowServer } from './server';
import { IController } from './app-controller';
export declare const __moduleName: string;
export declare class Bundler {
    static Init(app: IApplication, controller: IController, server: ISowServer): void;
}
