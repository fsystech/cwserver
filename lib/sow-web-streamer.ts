/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:19 PM 5/8/2020
import {
    Stats, ReadStream, createReadStream as fsCreateReadStream
} from 'fs';
import destroy = require( 'destroy' );
import { IContext } from './sow-server';
export class Streamer {
    public static stream(
        ctx: IContext, absPath: string,
        mimeType: string, fstat: Stats
    ): void {
        const total: number = fstat.size;
        let openenedFile: ReadStream = Object.create( null );
        if ( ctx.req.headers.range ) {
            const range: string = ctx.req.headers.range;
            const parts: string[] = range.replace( /bytes=/, "" ).split( "-" );
            const partialstart: string = parts[0];
            const partialend: string = parts[1];
            const start: number = parseInt( partialstart, 10 );
            const end: number = partialend ? parseInt( partialend, 10 ) : total - 1;
            const chunksize: number = ( end - start ) + 1;
            openenedFile = fsCreateReadStream( absPath, {
                start, end
            } );
            ctx.res.status( 206, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mimeType
            } );
            openenedFile.pipe( ctx.res );
        } else {
            openenedFile = fsCreateReadStream( absPath );
            ctx.res.status( 200, {
                'Content-Length': total,
                'Content-Type': mimeType
            } );
            openenedFile.pipe( ctx.res );
        }
        return ctx.res.on( 'close', () => {
            if ( openenedFile ) {
                openenedFile.unpipe( ctx.res );
                openenedFile.close();
            }
            ctx.next( 200 );
        } ), void 0;
    }
}