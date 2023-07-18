// Copyright (c) 2022 Safe Online World Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 9:19 PM 5/8/2020
// by rajib chy
import {
    Stats, ReadStream, createReadStream as fsCreateReadStream
} from 'node:fs';
import { pipeline } from 'node:stream';
import destroy = require('destroy');
import { IContext } from './server';
export class Streamer {
    public static stream(
        ctx: IContext, absPath: string,
        mimeType: string, fstat: Stats
    ): void {
        const total: number = fstat.size;
        let statusCode: number = 200;
        let openenedFile: ReadStream = Object.create(null);
        if (ctx.req.headers.range) {
            const range: string = ctx.req.headers.range;
            const parts: string[] = range.replace(/bytes=/, "").split("-");
            const partialstart: string = parts[0];
            const partialend: string = parts[1];
            const start: number = parseInt(partialstart, 10);
            const end: number = partialend ? parseInt(partialend, 10) : total - 1;
            const chunksize: number = (end - start) + 1;
            openenedFile = fsCreateReadStream(absPath, {
                start, end
            });
            statusCode = 206;
            ctx.res.status(statusCode, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mimeType
            });
        } else {
            openenedFile = fsCreateReadStream(absPath);
            ctx.res.status(statusCode, {
                'Content-Length': total,
                'Content-Type': mimeType
            });
        }
        return pipeline(openenedFile, ctx.res, (err: NodeJS.ErrnoException | null) => {
            destroy(openenedFile);
            ctx.next(statusCode, false);
        }), void 0;
    }
}