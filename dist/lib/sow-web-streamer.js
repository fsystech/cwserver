"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
var Streamer;
(function (Streamer) {
    function stream(ctx, absPath, mimeType, fstat) {
        var _a;
        const total = fstat.size;
        let openenedFile = Object.create(null);
        if (ctx.req.headers.range) {
            const range = (_a = ctx.req.headers.range) === null || _a === void 0 ? void 0 : _a.toString();
            const parts = range.replace(/bytes=/, "").split("-");
            const partialstart = parts[0];
            const partialend = parts[1];
            const start = parseInt(partialstart, 10);
            const end = partialend ? parseInt(partialend, 10) : total - 1;
            const chunksize = (end - start) + 1;
            openenedFile = fs_1.createReadStream(absPath, {
                start, end
            });
            ctx.res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': mimeType
            });
            openenedFile.pipe(ctx.res);
        }
        else {
            openenedFile = fs_1.createReadStream(absPath);
            ctx.res.writeHead(200, {
                'Content-Length': total,
                'Content-Type': mimeType
            });
            openenedFile.pipe(ctx.res);
        }
        ctx.res.on('close', () => {
            if (openenedFile) {
                openenedFile.unpipe(ctx.res);
                openenedFile.close();
            }
            ctx.next(200);
        });
    }
    Streamer.stream = stream;
})(Streamer = exports.Streamer || (exports.Streamer = {}));
//# sourceMappingURL=sow-web-streamer.js.map