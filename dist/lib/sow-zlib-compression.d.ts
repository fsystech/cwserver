/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
/// <reference types="node" />
import { IRequest } from './sow-server-core';
export declare class Gzip {
    static fromString( str: string, next: ( error: Error | null, result: Buffer ) => void ): void;
    static buffer( buffer: Buffer, next: ( error: Error | null, result: Buffer ) => void ): void;
}
export declare class Compression {
    static isAcceptedEncoding( req: IRequest, name: string ): boolean;
    static gzip: Gzip;
}