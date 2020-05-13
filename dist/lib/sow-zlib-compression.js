"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _zlib = __importStar(require("zlib"));
class Gzip {
    static fromString(str, next) {
        return _zlib.gzip(Buffer.from(str), next);
    }
    static buffer(buffer, next) {
        return _zlib.gzip(buffer, next);
    }
}
exports.Gzip = Gzip;
// tslint:disable-next-line: max-classes-per-file
class Compression {
    static isAcceptedEncoding(req, name) {
        const acceptEncoding = req.headers['accept-encoding'];
        if (!acceptEncoding)
            return false;
        return acceptEncoding.indexOf(name) > -1;
    }
}
exports.Compression = Compression;
