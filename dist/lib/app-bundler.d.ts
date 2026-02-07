import { IApplication } from './server-core';
import type { ICwServer } from './server';
import type { IController } from './app-controller';
export declare const __moduleName: string;
export declare class Bundler {
    static Init(app: IApplication, controller: IController, server: ICwServer): void;
}
