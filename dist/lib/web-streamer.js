"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Streamer = void 0;
// 9:19 PM 5/8/2020
// by rajib chy
const node_fs_1 = require("node:fs");
const node_stream_1 = require("node:stream");
const destroy = require("destroy");
class Streamer {
    static stream(ctx, absPath, mimeType, fstat) {
        const total = fstat.size;
        let statusCode = 200;
        let openenedFile = Object.create(null);
        if (ctx.req.headers.range) {
            const range = ctx.req.headers.range;
            const parts = range.replace(/bytes=/, "").split("-");
            const partialstart = parts[0];
            const partialend = parts[1];
            const start = parseInt(partialstart, 10);
            const end = partialend ? parseInt(partialend, 10) : total - 1;
            const chunksize = (end - start) + 1;
            openenedFile = (0, node_fs_1.createReadStream)(absPath, {
                start, end
            });
            statusCode = 206;
            ctx.res.status(statusCode, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mimeType
            });
        }
        else {
            openenedFile = (0, node_fs_1.createReadStream)(absPath);
            ctx.res.status(statusCode, {
                'Content-Length': total,
                'Content-Type': mimeType
            });
        }
        return (0, node_stream_1.pipeline)(openenedFile, ctx.res, (err) => {
            destroy(openenedFile);
            ctx.next(statusCode, false);
        }), void 0;
    }
}
exports.Streamer = Streamer;
//# sourceMappingURL=web-streamer.js.map