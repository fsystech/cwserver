/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
/// <reference types="node" />
import { Stats } from 'fs';
import { IContext } from './sow-server';
export declare namespace Streamer {
    function stream( ctx: IContext, absPath: string, mimeType: string, fstat: Stats ): any;
}