"use strict";
// Copyright (c) 2022 FSys Tech Ltd.
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Util = void 0;
exports.assert = assert;
exports.getLibRoot = getLibRoot;
exports.getAppDir = getAppDir;
exports.generateRandomString = generateRandomString;
// 9:01 PM 5/2/2020
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const node_stream_1 = require("node:stream");
const destroy_1 = __importDefault(require("destroy"));
const _zlib = __importStar(require("node:zlib"));
const node_util_1 = require("node:util");
const fsw_1 = require("./fsw");
const pipelineAsync = (0, node_util_1.promisify)(node_stream_1.pipeline);
function _isPlainObject(obj) {
    if (obj === null || obj === undefined)
        return false;
    return typeof (obj) === 'object' && Object.prototype.toString.call(obj) === "[object Object]";
}
function _extend(destination, source) {
    if (!_isPlainObject(destination) || !_isPlainObject(source))
        throw new TypeError(`Invalid arguments defined. Arguments should be Object instance. destination type ${typeof (destination)} and source type ${typeof (source)}`);
    for (const property in source) {
        if (property === "__proto__" || property === "constructor")
            continue;
        if (!destination.hasOwnProperty(property)) {
            destination[property] = source[property];
        }
        else {
            destination[property] = source[property];
        }
    }
    return destination;
}
function _deepExtend(destination, source) {
    if (typeof (source) === "function")
        source = source();
    if (!_isPlainObject(destination) || !_isPlainObject(source))
        throw new TypeError(`Invalid arguments defined. Arguments should be Object instance. destination type ${typeof (destination)} and source type ${typeof (source)}`);
    for (const property in source) {
        if (property === "__proto__" || property === "constructor")
            continue;
        if (!destination.hasOwnProperty(property)) {
            destination[property] = void 0;
        }
        const s = source[property];
        const d = destination[property];
        if (_isPlainObject(d) && _isPlainObject(s)) {
            _deepExtend(d, s);
            continue;
        }
        destination[property] = source[property];
    }
    return destination;
}
function assert(condition, expr) {
    const condType = typeof (condition);
    if (condType === "string") {
        if (condition.length === 0)
            condition = false;
    }
    if (!condition)
        throw new Error(`Assertion failed: ${expr}`);
}
function getLibRoot() {
    return _path.resolve(__dirname, process.env.SCRIPT === "TS" ? '..' : '../..');
}
function getAppDir() {
    if (process.pkg) {
        return `${process.cwd()}/lib/cwserver/`;
    }
    return getLibRoot();
}
function generateRandomString(num) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0, n = charset.length; i < num; ++i) {
        result += charset.charAt(Math.floor(Math.random() * n));
    }
    return result;
}
class JSONW {
    static parse(text, reviver) {
        if (typeof (text) !== "string")
            return text;
        try {
            return JSON.parse(text, reviver);
        }
        catch (_a) {
            return undefined;
        }
    }
    static stringify(value, replacer, space) {
        return JSON.stringify(value, replacer, space);
    }
}
class Util {
    static guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    static extend(destination, source, deep) {
        if (deep === true)
            return _deepExtend(destination, source);
        return _extend(destination, source);
    }
    static clone(source) {
        return _extend({}, source);
    }
    /** Checks whether the specified value is an object. true if the value is an object; false otherwise. */
    static isPlainObject(obj) {
        return _isPlainObject(obj);
    }
    /** Checks whether the specified value is an array object. true if the value is an array object; false otherwise. */
    static isArrayLike(obj) {
        if (obj === null || obj === undefined)
            return false;
        const result = Object.prototype.toString.call(obj);
        return result === "[object NodeList]" || result === "[object Array]" ? true : false;
    }
    static isError(obj) {
        return obj === null || !obj ? false : Object.prototype.toString.call(obj) === "[object Error]";
    }
    static throwIfError(obj) {
        if (this.isError(obj))
            throw obj;
    }
    static createGzip(level) {
        return _zlib.createGzip({
            level: level !== null && level !== void 0 ? level : _zlib.constants.Z_BEST_COMPRESSION
        });
    }
    static compressAsync(absPath, cachePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const rstream = typeof absPath === "string"
                ? _fs.createReadStream(absPath)
                : node_stream_1.Readable.from(absPath);
            const gzip = Util.createGzip();
            const wstream = _fs.createWriteStream(cachePath);
            try {
                yield pipelineAsync(rstream, gzip, wstream);
            }
            finally {
                (0, destroy_1.default)(rstream);
                (0, destroy_1.default)(gzip);
                (0, destroy_1.default)(wstream);
            }
        });
    }
    static pipeOutputStreamAsync(absPath, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ctx.isDisposed)
                return;
            const statusCode = ctx.res.statusCode;
            const openenedFile = _fs.createReadStream(absPath);
            try {
                yield pipelineAsync(openenedFile, ctx.res);
                if (ctx.isDisposed)
                    return;
                ctx.next(statusCode);
            }
            catch (ex) {
                ctx.transferError(ex);
            }
            finally {
                (0, destroy_1.default)(openenedFile);
            }
        });
    }
    static sendResponseAsync(ctx, reqPath, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const e = yield (0, fsw_1.isExistsAsync)(reqPath);
            if (ctx.isDisposed)
                return;
            if (!e.exists) {
                return ctx.next(404, true);
            }
            ctx.res.status(200, {
                'Content-Type': contentType || 'text/html; charset=UTF-8'
            });
            return yield this.pipeOutputStreamAsync(e.url, ctx);
        });
    }
    static getExtension(reqPath) {
        const index = reqPath.lastIndexOf(".");
        if (index > 0) {
            return reqPath.substring(index + 1).toLowerCase();
        }
        return void 0;
    }
}
exports.Util = Util;
Util.JSON = JSONW;
//# sourceMappingURL=app-util.js.map