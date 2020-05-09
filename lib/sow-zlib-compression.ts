/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { IRequest } from './sow-server-core';
import * as _zlib from 'zlib';
export class Gzip {
    static fromString( str: string, next: ( error: Error | null, result: Buffer ) => void ): void {
        return _zlib.gzip( Buffer.from( str ), next );
    }
    static buffer( buffer: Buffer, next: ( error: Error | null, result: Buffer ) => void ): void {
        return _zlib.gzip( buffer, next );
    }
}
export class Compression {
    static isAcceptedEncoding( req: IRequest, name: string ): boolean {
        let acceptEncoding = req.headers['accept-encoding'];
        if ( !acceptEncoding ) return false;
        return acceptEncoding.indexOf( name ) > -1;
    }
    static gzip: Gzip;
}