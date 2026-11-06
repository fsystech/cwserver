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
const crypto = __importStar(require("node:crypto"));
const node_stream_1 = require("node:stream");
const destroy_1 = __importDefault(require("destroy"));
const _zlib = __importStar(require("node:zlib"));
const node_util_1 = require("node:util");
const fsw_1 = require("./fsw");
const pipelineAsync = (0, node_util_1.promisify)(node_stream_1.pipeline);
/**
 * Checks whether a value is a plain object (its Object.prototype.toString tag is [object Object]).
 *
 * @param obj Value to test.
 * @returns True for plain objects; false for null, undefined and other types.
 */
function _isPlainObject(obj) {
    if (obj === null || obj === undefined)
        return false;
    return typeof (obj) === 'object' && Object.prototype.toString.call(obj) === "[object Object]";
}
/**
 * Shallow-copies enumerable properties from source onto destination, overwriting existing ones and
 * skipping __proto__ and constructor. Throws TypeError unless both arguments are plain objects.
 *
 * @param destination Object that receives the properties.
 * @param source Object whose properties are copied.
 * @returns The modified destination object.
 */
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
/**
 * Recursively merges source into destination, merging nested plain objects and overwriting other
 * values. If source is a function it is invoked first; __proto__ and constructor keys are skipped.
 * Throws TypeError unless both are plain objects.
 *
 * @param destination Object that receives the merged properties.
 * @param source Plain object, or a function returning one, to merge in.
 * @returns The modified destination object.
 */
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
/**
 * Throws an Error when the condition is falsy or an empty string.
 *
 * @param condition Value that must be truthy (empty strings count as false).
 * @param expr Description included in the error message on failure.
 */
function assert(condition, expr) {
    const condType = typeof (condition);
    if (condType === "string") {
        if (condition.length === 0)
            condition = false;
    }
    if (!condition)
        throw new Error(`Assertion failed: ${expr}`);
}
/**
 * Resolves the library root directory, one level up when running TypeScript sources (SCRIPT=TS) and
 * two levels up otherwise.
 *
 * @returns Absolute path of the library root.
 */
function getLibRoot() {
    return _path.resolve(__dirname, process.env.SCRIPT === "TS" ? '..' : '../..');
}
/**
 * Returns the application directory: a lib/cwserver folder under the working directory when running as
 * a packaged (pkg) executable, otherwise the library root.
 *
 * @returns Absolute path of the application directory.
 */
function getAppDir() {
    if (process.pkg) {
        return `${process.cwd()}/lib/cwserver/`;
    }
    return getLibRoot();
}
/**
 * Generates a random string of ASCII letters using Math.random (not cryptographically secure).
 *
 * @param num Number of characters to generate.
 * @returns The random string of length num.
 */
function generateRandomString(num) {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";
    for (let i = 0, n = charset.length; i < num; ++i) {
        result += charset.charAt(Math.floor(Math.random() * n));
    }
    return result;
}
class JSONW {
    /**
     * Parses a JSON string, returning undefined instead of throwing on invalid JSON. Non-string input is
     * returned unchanged.
     *
     * @param text JSON text to parse, or an already parsed value.
     * @param reviver Optional JSON.parse reviver function.
     * @returns The parsed value, the input itself if it was not a string, or undefined if parsing failed.
     */
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
    /**
     * Serialises a value to JSON by delegating to JSON.stringify.
     *
     * @param value Value to serialise.
     * @param replacer Optional function transforming values during serialisation.
     * @param space Optional indentation (number of spaces or string).
     * @returns The JSON string.
     */
    static stringify(value, replacer, space) {
        return JSON.stringify(value, replacer, space);
    }
}
class Util {
    /**
     * Generates a UUID v4 string using a template-based random value replacement.
     *
     * The UUID is generated by replacing each `x` and `y` character in the
     * template with a hexadecimal digit. The `4` character identifies the
     * UUID version, while the `y` character is replaced with a hexadecimal
     * digit whose two most significant bits follow the UUID variant format.
     *
     * The random values are generated using `Math.random()`, which is not
     * cryptographically secure.
     *
     * @returns {string} A hyphenated UUID v4 string in the format
     *                   `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.
     *
     * @remarks
     * Suitable for general-purpose identifiers where cryptographic security
     * is not required. Use {@link UUID} when a cryptographically secure
     * identifier is needed.
     */
    static guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    /**
     * Generates a cryptographically secure UUID v4 string without hyphens.
     *
     * Uses Node.js's `crypto.randomUUID()` to generate a UUID v4 string
     * with cryptographically secure random values, then removes the hyphens
     * from the generated UUID.
     *
     * The resulting identifier contains exactly 32 hexadecimal characters.
     * The UUID version and variant bits are preserved.
     *
     * @returns {string} A 32-character hexadecimal UUID v4 string without
     *                   hyphens.
     *
     * @remarks
     * Suitable for generating identifiers that require strong randomness.
     * The returned string does not use the standard hyphenated UUID format.
     *
     * @see {@link guid}
     */
    static UUID() {
        return crypto.randomUUID().replace(/-/g, '');
    }
    /**
     * Copies properties from source into destination, either shallowly or recursively. Throws TypeError if
     * either argument is not a plain object.
     *
     * @param destination Object to extend; it is modified in place.
     * @param source Object whose properties are copied.
     * @param deep When true, nested plain objects are merged recursively.
     * @returns The extended destination object.
     */
    static extend(destination, source, deep) {
        if (deep === true)
            return _deepExtend(destination, source);
        return _extend(destination, source);
    }
    /**
     * Creates a shallow copy of a plain object.
     *
     * @param source Plain object to copy; throws TypeError otherwise.
     * @returns A new object with the properties of source.
     */
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
    /**
     * Checks whether a value is an Error object.
     *
     * @param obj Value to test.
     * @returns True if obj is an Error instance; false for null or other values.
     */
    static isError(obj) {
        return obj === null || !obj ? false : Object.prototype.toString.call(obj) === "[object Error]";
    }
    /**
     * Throws the given value if it is an Error object; otherwise does nothing.
     *
     * @param obj Value to inspect.
     */
    static throwIfError(obj) {
        if (this.isError(obj))
            throw obj;
    }
    /**
     * Creates a gzip compression stream, defaulting to best compression.
     *
     * @param level Optional zlib compression level; defaults to Z_BEST_COMPRESSION.
     * @returns A new zlib Gzip stream.
     */
    static createGzip(level) {
        return _zlib.createGzip({
            level: level !== null && level !== void 0 ? level : _zlib.constants.Z_BEST_COMPRESSION
        });
    }
    /**
     * Sets a 200 status with gzip content encoding on the response, then streams the file through gzip
     * into it. The read stream is destroyed when done.
     *
     * @param phypath Absolute path of the file to send.
     * @param res Response to write the compressed data to.
     * @returns Promise that resolves when the stream finishes and rejects on stream errors.
     */
    static writeGzipStreamAsync(phypath, res) {
        return __awaiter(this, void 0, void 0, function* () {
            res.status(200, {
                'Content-Encoding': 'gzip'
            });
            let rstream = null;
            try {
                rstream = _fs.createReadStream(phypath);
                yield pipelineAsync(rstream, Util.createGzip(), res);
            }
            finally {
                if (rstream) {
                    (0, destroy_1.default)(rstream);
                }
            }
        });
    }
    /**
     * Gzip-compresses a file or in-memory data and writes it to a cache file, cleaning up all streams
     * afterwards.
     *
     * @param absPath Path of the file to compress, or the raw bytes to compress.
     * @param cachePath Path of the gzip file to write.
     * @returns Promise that resolves when the compressed file has been written.
     */
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
    /**
     * Sets a 200 status and streams a file to the response. Stream errors are passed to ctx.transferError
     * unless the context is disposed.
     *
     * @param absPath Absolute path of the file to stream.
     * @param ctx Request context whose response receives the data.
     * @returns Promise that resolves when streaming finishes or is skipped.
     */
    static pipeOutputStreamAsync(absPath, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            if (ctx.isDisposed)
                return;
            const response = ctx.res;
            response.status(200);
            let openenedFile = null;
            try {
                openenedFile = _fs.createReadStream(absPath);
                yield pipelineAsync(openenedFile, response);
            }
            catch (ex) {
                if (ctx.isDisposed)
                    return;
                ctx.transferError(ex);
            }
            finally {
                if (openenedFile) {
                    (0, destroy_1.default)(openenedFile);
                }
            }
        });
    }
    /**
     * Sends a file as the response, replying 404 if it does not exist. Sets the content type (default
     * text/html; charset=UTF-8) and streams the file.
     *
     * @param ctx Request context to respond to.
     * @param reqPath Path of the file to send.
     * @param contentType Optional Content-Type header; defaults to text/html; charset=UTF-8.
     * @returns Promise that resolves when the response has been written.
     */
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
    /**
     * Extracts the lower-cased file extension (text after the last dot) from a path.
     *
     * @param reqPath File path or name.
     * @returns The extension without the dot, or undefined if there is none.
     */
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
/**
 * Gzip level for responses that are compressed on every request.
 * Level 9 (the default of {@link createGzip}) is only worth it for content
 * that is compressed once and cached.
 */
Util.GZIP_STREAM_LEVEL = _zlib.constants.Z_DEFAULT_COMPRESSION;
//# sourceMappingURL=app-util.js.map