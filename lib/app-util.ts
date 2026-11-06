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

// 9:01 PM 5/2/2020
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import * as crypto from 'node:crypto';

import { pipeline, Readable } from 'node:stream';
import type { IContext } from './context';
import destroy from 'destroy';
import * as _zlib from 'node:zlib';
import { promisify } from "node:util";
import { isExistsAsync } from './fsw';
import { IResponse } from './response';

const pipelineAsync = promisify(pipeline);

/**
 * Checks whether a value is a plain object (its Object.prototype.toString tag is [object Object]).
 *
 * @param obj Value to test.
 * @returns True for plain objects; false for null, undefined and other types.
 */
function _isPlainObject(obj: any): obj is { [x: string]: any; } {
    if (obj === null || obj === undefined) return false;
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
function _extend(destination: any, source: any): any {
    if (!_isPlainObject(destination) || !_isPlainObject(source))
        throw new TypeError(`Invalid arguments defined. Arguments should be Object instance. destination type ${typeof (destination)} and source type ${typeof (source)}`);
    for (const property in source) {
        if (property === "__proto__" || property === "constructor") continue;
        if (!destination.hasOwnProperty(property)) {
            destination[property] = source[property];
        } else {
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
function _deepExtend(destination: any, source: any): any {
    if (typeof (source) === "function") source = source();
    if (!_isPlainObject(destination) || !_isPlainObject(source))
        throw new TypeError(`Invalid arguments defined. Arguments should be Object instance. destination type ${typeof (destination)} and source type ${typeof (source)}`);
    for (const property in source) {
        if (property === "__proto__" || property === "constructor") continue;
        if (!destination.hasOwnProperty(property)) {
            destination[property] = void 0;
        }
        const s = source[property];
        const d = destination[property];
        if (_isPlainObject(d) && _isPlainObject(s)) {
            _deepExtend(d, s); continue;
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
export function assert(condition: any, expr: string) {
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
export function getLibRoot(): string {
    return _path.resolve(__dirname, process.env.SCRIPT === "TS" ? '..' : '../..');
}

/**
 * Returns the application directory: a lib/cwserver folder under the working directory when running as
 * a packaged (pkg) executable, otherwise the library root.
 *
 * @returns Absolute path of the application directory.
 */
export function getAppDir(): string {
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
export function generateRandomString(num: number): string {
    const
        charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result: string = "";
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
    static parse(text: any, reviver?: (this: any, key: string, value: any) => any): any {
        if (typeof (text) !== "string")
            return text;

        try {
            return JSON.parse(text, reviver);
        } catch {
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
    static stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): any {
        return JSON.stringify(value, replacer, space);
    }
}

export class Util {

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
    public static guid(): string {
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
    public static UUID(): string {
        return crypto.randomUUID().replace(/-/g, '');
    }

    public static readonly JSON = JSONW;

    /**
     * Copies properties from source into destination, either shallowly or recursively. Throws TypeError if
     * either argument is not a plain object.
     *
     * @param destination Object to extend; it is modified in place.
     * @param source Object whose properties are copied.
     * @param deep When true, nested plain objects are merged recursively.
     * @returns The extended destination object.
     */
    public static extend<T>(destination: T, source: any, deep?: boolean): T {
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
    public static clone<T>(source: T): T {
        return _extend({}, source);
    }

    /** Checks whether the specified value is an object. true if the value is an object; false otherwise. */
    public static isPlainObject(obj?: any): obj is { [x: string]: any; } {
        return _isPlainObject(obj);
    }

    /** Checks whether the specified value is an array object. true if the value is an array object; false otherwise. */
    public static isArrayLike<T>(obj?: any): obj is T[] {
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
    public static isError(obj: any): obj is Error {
        return obj === null || !obj ? false : Object.prototype.toString.call(obj) === "[object Error]";
    }

    /**
     * Throws the given value if it is an Error object; otherwise does nothing.
     *
     * @param obj Value to inspect.
     */
    public static throwIfError(obj: any): void {
        if (this.isError(obj)) throw obj;
    }

    /**
     * Gzip level for responses that are compressed on every request.
     * Level 9 (the default of {@link createGzip}) is only worth it for content
     * that is compressed once and cached.
     */
    public static readonly GZIP_STREAM_LEVEL: number = _zlib.constants.Z_DEFAULT_COMPRESSION;

    /**
     * Creates a gzip compression stream, defaulting to best compression.
     *
     * @param level Optional zlib compression level; defaults to Z_BEST_COMPRESSION.
     * @returns A new zlib Gzip stream.
     */
    public static createGzip(level?: number): _zlib.Gzip {
        return _zlib.createGzip({
            level: level ?? _zlib.constants.Z_BEST_COMPRESSION
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
    public static async writeGzipStreamAsync(
        phypath: string, res: IResponse
    ): Promise<void> {

        res.status(200, {
            'Content-Encoding': 'gzip'
        });

        let rstream: _fs.ReadStream = null;

        try {

            rstream = _fs.createReadStream(phypath);

            await pipelineAsync(
                rstream, Util.createGzip(), res
            );

        } finally {

            if (rstream) {
                destroy(rstream);
            }

        }
    }

    /**
     * Gzip-compresses a file or in-memory data and writes it to a cache file, cleaning up all streams
     * afterwards.
     *
     * @param absPath Path of the file to compress, or the raw bytes to compress.
     * @param cachePath Path of the gzip file to write.
     * @returns Promise that resolves when the compressed file has been written.
     */
    public static async compressAsync(
        absPath: string | Uint8Array,
        cachePath: string
    ): Promise<void> {

        const rstream = typeof absPath === "string"
            ? _fs.createReadStream(absPath)
            : Readable.from(absPath);

        const gzip = Util.createGzip();
        const wstream = _fs.createWriteStream(cachePath);

        try {

            await pipelineAsync(
                rstream,
                gzip,
                wstream
            );

        } finally {
            destroy(rstream);
            destroy(gzip);
            destroy(wstream);
        }
    }

    /**
     * Sets a 200 status and streams a file to the response. Stream errors are passed to ctx.transferError
     * unless the context is disposed.
     *
     * @param absPath Absolute path of the file to stream.
     * @param ctx Request context whose response receives the data.
     * @returns Promise that resolves when streaming finishes or is skipped.
     */
    public static async pipeOutputStreamAsync(absPath: string, ctx: IContext): Promise<void> {
        if (ctx.isDisposed)
            return;

        const response = ctx.res;
        response.status(200);

        let openenedFile: _fs.ReadStream = null;

        try {

            openenedFile = _fs.createReadStream(absPath);
            await pipelineAsync(openenedFile, response);

        } catch (ex: any) {
            if (ctx.isDisposed)
                return;

            ctx.transferError(ex);

        } finally {

            if (openenedFile) {
                destroy(openenedFile);
            }

        }
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
    public static async sendResponseAsync(
        ctx: IContext, reqPath: string, contentType?: string
    ): Promise<void> {

        const e = await isExistsAsync(reqPath);
        if (ctx.isDisposed)
            return;

        if (!e.exists) {
            return ctx.next(404, true);
        }

        ctx.res.status(200, {
            'Content-Type': contentType || 'text/html; charset=UTF-8'
        });

        return await this.pipeOutputStreamAsync(
            e.url, ctx
        );
    }

    /**
     * Extracts the lower-cased file extension (text after the last dot) from a path.
     *
     * @param reqPath File path or name.
     * @returns The extension without the dot, or undefined if there is none.
     */
    public static getExtension(reqPath: string): string | void {
        const index = reqPath.lastIndexOf(".");
        if (index > 0) {
            return reqPath.substring(index + 1).toLowerCase();
        }
        return void 0;
    }
}