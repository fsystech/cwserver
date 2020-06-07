"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compression = exports.Gzip = void 0;
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
class Compression {
    static isAcceptedEncoding(req, name) {
        const acceptEncoding = req.headers['accept-encoding'];
        if (!acceptEncoding)
            return false;
        return acceptEncoding.indexOf(name) > -1;
    }
}
exports.Compression = Compression;
//# sourceMappingURL=sow-zlib-compression.js.map