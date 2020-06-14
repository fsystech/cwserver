/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { IContext } from './sow-server';
export interface IHttpMimeHandler {
    render( ctx: IContext, maybeDir?: string, checkFile?: boolean ): void;
    getMimeType( extension: string ): string;
    isValidExtension( extension: string ): boolean;
}
export declare class HttpMimeHandler implements IHttpMimeHandler {
    constructor();
    getMimeType( extension: string ): string;
    isValidExtension( extension: string ): boolean;
    render( ctx: IContext, maybeDir?: string, checkFile?: boolean ): void;
}