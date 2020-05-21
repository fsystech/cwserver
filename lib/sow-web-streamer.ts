/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:19 PM 5/8/2020
import { Stats, ReadStream, createReadStream as fsCreateReadStream } from 'fs';
import { IContext } from './sow-server';
// tslint:disable-next-line: no-namespace
export namespace Streamer {
    export function stream(
        ctx: IContext, absPath: string,
        mimeType: string, fstat: Stats
    ): any {
        const total = fstat.size;
        let openenedFile: ReadStream = Object.create( null );
        if ( ctx.req.headers.range ) {
            const range = ctx.req.headers.range?.toString();
            const parts = range.replace( /bytes=/, "" ).split( "-" );
            const partialstart = parts[0];
            const partialend = parts[1];
            const start = parseInt( partialstart, 10 );
            const end = partialend ? parseInt( partialend, 10 ) : total - 1;
            const chunksize = ( end - start ) + 1;
            openenedFile = fsCreateReadStream( absPath, {
                start, end
            } );
            ctx.res.writeHead( 206, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mimeType
            } );
            openenedFile.pipe( ctx.res );
        } else {
            openenedFile = fsCreateReadStream( absPath );
            ctx.res.writeHead( 200, {
                'Content-Length': total,
                'Content-Type': mimeType
            } );
            openenedFile.pipe( ctx.res );
        }
        ctx.res.on( 'close', () => {
            if ( openenedFile ) {
                openenedFile.unpipe( ctx.res );
                openenedFile.close();
            }
            ctx.next( 200 );
        } );
    }
}