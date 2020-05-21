/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { IHttpMimeHandler } from './sow-http-mime';
import { IContext, AppHandler } from './sow-server';
export interface IController {
    httpMimeHandler: IHttpMimeHandler;
    any( route: string, next: AppHandler ): IController;
    get( route: string, next: AppHandler ): IController;
    post( route: string, next: AppHandler ): IController;
    processAny( ctx: IContext ): void;
}
export declare class Controller implements IController {
    httpMimeHandler: IHttpMimeHandler;
    constructor();
    get( route: string, next: AppHandler ): IController;
    post( route: string, next: AppHandler ): IController;
    any( route: string, next: AppHandler ): IController;
    private processGet;
    private processPost;
    processAny( ctx: IContext ): void;
}