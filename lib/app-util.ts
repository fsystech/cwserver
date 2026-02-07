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
import { pipeline } from 'node:stream';
import type { IContext } from './context';
import destroy from 'destroy';
import { isExists } from './fsw';

function _isPlainObject(obj: any): obj is { [x: string]: any; } {
    if (obj === null || obj === undefined) return false;
    return typeof (obj) === 'object' && Object.prototype.toString.call(obj) === "[object Object]";
}

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

export function assert(condition: any, expr: string) {
    const condType = typeof (condition);
    if (condType === "string") {
        if (condition.length === 0)
            condition = false;
    }
    if (!condition)
        throw new Error(`Assertion failed: ${expr}`);
}

export function getLibRoot(): string {
    return _path.resolve(__dirname, process.env.SCRIPT === "TS" ? '..' : '../..');
}

export function getAppDir(): string {
    if (process.pkg) {
        return `${process.cwd()}/lib/cwserver/`;
    }
    return getLibRoot();
}

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
    static parse(text: any, reviver?: (this: any, key: string, value: any) => any): any {
        if (typeof (text) !== "string") return text;
        try {
            return JSON.parse(text, reviver);
        } catch {
            return undefined;
        }
    }
    static stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): any {
        return JSON.stringify(value, replacer, space);
    }
}

export class Util {

    public static guid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c: string) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public static readonly JSON = JSONW;

    public static extend<T>(destination: T, source: any, deep?: boolean): T {
        if (deep === true)
            return _deepExtend(destination, source);
        return _extend(destination, source);
    }

    public static clone<T>(source: T): T {
        return _extend({}, source);
    }

    /** Checks whether the specified value is an object. true if the value is an object; false otherwise. */
    public static isPlainObject(obj?: any): obj is { [x: string]: any; } {
        return _isPlainObject(obj);
    }

    /** Checks whether the specified value is an array object. true if the value is an array object; false otherwise. */
    public static isArrayLike<T>(obj?: any): obj is T[] {
        if (obj === null || obj === undefined) return false;
        const result = Object.prototype.toString.call(obj);
        return result === "[object NodeList]" || result === "[object Array]" ? true : false;
    }

    public static isError(obj: any): obj is Error {
        return obj === null || !obj ? false : Object.prototype.toString.call(obj) === "[object Error]";
    }

    public static throwIfError(obj: any): void {
        if (this.isError(obj)) throw obj;
    }

    public static pipeOutputStream(absPath: string, ctx: IContext): void {
        return ctx.handleError(null, () => {
            const statusCode: number = ctx.res.statusCode;
            const openenedFile: _fs.ReadStream = _fs.createReadStream(absPath);
            return pipeline(openenedFile, ctx.res, (err: NodeJS.ErrnoException | null) => {
                destroy(openenedFile);
                ctx.next(statusCode);
            }), void 0;
        });
    }

    public static sendResponse(
        ctx: IContext, reqPath: string, contentType?: string
    ): void {
        return isExists(reqPath, (exists: boolean, url: string): void => {
            return ctx.handleError(null, () => {
                if (!exists) return ctx.next(404, true);
                ctx.res.status(200, { 'Content-Type': contentType || 'text/html; charset=UTF-8' });
                return this.pipeOutputStream(url, ctx);
            });
        });
    }

    public static getExtension(reqPath: string): string | void {
        const index = reqPath.lastIndexOf(".");
        if (index > 0) {
            return reqPath.substring(index + 1).toLowerCase();
        }
        return void 0;
    }
}