"use strict";
Object.defineProperty( exports, "__esModule", { value: true } );
exports.Streamer = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:19 PM 5/8/2020
const fs_1 = require( "fs" );
( function ( Streamer ) {
    function stream( ctx, absPath, mimeType, fstat ) {
        const total = fstat.size;
        let openenedFile = Object.create( null );
        if ( ctx.req.headers.range ) {
            const range = ctx.req.headers.range;
            const parts = range.replace( /bytes=/, "" ).split( "-" );
            const partialstart = parts[0];
            const partialend = parts[1];
            const start = parseInt( partialstart, 10 );
            const end = partialend ? parseInt( partialend, 10 ) : total - 1;
            const chunksize = ( end - start ) + 1;
            openenedFile = fs_1.createReadStream( absPath, {
                start, end
            } );
            ctx.res.writeHead( 206, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mimeType
            } );
            openenedFile.pipe( ctx.res );
        }
        else {
            openenedFile = fs_1.createReadStream( absPath );
            ctx.res.writeHead( 200, {
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
    Streamer.stream = stream;
} )( exports.Streamer || ( exports.Streamer = {} ) );
//# sourceMappingURL=sow-web-streamer.js.map