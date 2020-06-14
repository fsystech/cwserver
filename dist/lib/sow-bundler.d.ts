/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { IApplication } from './sow-server-core';
import { ISowServer } from './sow-server';
import { IController } from './sow-controller';
export declare const __moduleName: string;
export declare class Bundler {
    static Init(app: IApplication, controller: IController, server: ISowServer): void;
}