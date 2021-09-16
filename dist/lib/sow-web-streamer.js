"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Streamer = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:19 PM 5/8/2020
const fs_1 = require("fs");
const stream_1 = require("stream");
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
            openenedFile = (0, fs_1.createReadStream)(absPath, {
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
            openenedFile = (0, fs_1.createReadStream)(absPath);
            ctx.res.status(statusCode, {
                'Content-Length': total,
                'Content-Type': mimeType
            });
        }
        return (0, stream_1.pipeline)(openenedFile, ctx.res, (err) => {
            destroy(openenedFile);
            ctx.next(statusCode, false);
        }), void 0;
    }
}
exports.Streamer = Streamer;
//# sourceMappingURL=sow-web-streamer.js.map