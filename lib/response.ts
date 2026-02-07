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

// 4:08 PM 2/7/2026
// by rajib chy

import {
    OutgoingHttpHeaders, ServerResponse
} from 'node:http';
import { ToResponseTime, toString, IResInfo } from './app-static';
import { HttpStatus } from './http-status';
import { IContext } from './server';
import { Template } from './app-template';
import { Util } from './app-util';
import * as _zlib from 'node:zlib';
import * as _mimeType from './http-mime-types';

type CookieOptions = {
    maxAge?: number;
    signed?: boolean;
    /** Date | timestamp */
    expires?: Date | number;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
    encode?: (val: string) => string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
}

export interface IResponse extends ServerResponse {
    readonly isAlive: boolean;
    readonly statusCode: number;
    cleanSocket: boolean;
    json(body: NodeJS.Dict<any>, compress?: boolean, next?: (error: Error | null) => void): void;
    status(code: number, headers?: OutgoingHttpHeaders): IResponse;
    asHTML(code: number, contentLength?: number, isGzip?: boolean): IResponse;
    asJSON(code: number, contentLength?: number, isGzip?: boolean): IResponse;
    cookie(name: string, val: string, options: CookieOptions): IResponse;
    get(name: string): string | void;
    set(field: string, value: number | string | string[]): IResponse;
    redirect(url: string, force?: boolean): void;
    render(ctx: IContext, path: string, status?: IResInfo): void;
    type(extension: string): IResponse;
    noCache(): IResponse;
    sendIfError(err?: any): boolean;
    send(chunk?: Buffer | string | number | boolean | { [key: string]: any }): void;
    dispose(): void;
}

export class Response extends ServerResponse implements IResponse {
    private _isAlive: boolean | undefined;
    private _method: string | undefined;
    private _cleanSocket: boolean | undefined;
    private _statusCode: number | undefined;
    // @ts-ignore
    public get statusCode() {
        return this._statusCode === undefined ? 0 : this._statusCode;
    }
    public set statusCode(code: number) {
        if (!HttpStatus.isValidCode(code))
            throw new Error(`Invalid status code ${code}`);
        this._statusCode = code;
    }
    public get cleanSocket() {
        if (this._cleanSocket === undefined) return false;
        return this._cleanSocket;
    }
    public set cleanSocket(val: boolean) {
        this._cleanSocket = val;
    }
    public get isAlive() {
        if (this._isAlive !== undefined) return this._isAlive;
        this._isAlive = true;
        return this._isAlive;
    }
    public set isAlive(val: boolean) {
        this._isAlive = val;
    }
    public get method() {
        return toString(this._method);
    }
    public set method(val: string) {
        this._method = val;
    }
    public noCache(): IResponse {
        const header: string | void = this.get('cache-control');
        if (header) {
            if (header.indexOf('must-revalidate') > -1) {
                return this;
            }
            this.removeHeader('cache-control');
        }
        this.setHeader('cache-control', 'no-store, no-cache, must-revalidate, immutable');
        return this;
    }
    public status(code: number, headers?: OutgoingHttpHeaders): IResponse {
        this.statusCode = code;
        if (headers) {
            for (const name in headers) {
                const val: number | string | string[] | undefined = headers[name];
                if (!val) continue;
                this.setHeader(name, val);
            }
        }
        return this;
    }
    public get(name: string): string | void {
        const val: number | string | string[] | undefined = this.getHeader(name);
        if (val) {
            if (Array.isArray(val)) {
                return Util.JSON.stringify(val);
            }
            return toString(val);
        }
    }
    public set(field: string, value: number | string | string[]): IResponse {
        return this.setHeader(field, value), this;
    }
    public type(extension: string): IResponse {
        return this.setHeader('Content-Type', _mimeType.getMimeType(extension)), this;
    }
    public send(chunk?: any): void {
        if (this.headersSent) {
            throw new Error("If you use res.writeHead(), invoke res.end() instead of res.send()");
        }
        if (204 === this.statusCode || 304 === this.statusCode) {
            this.removeHeader('Content-Type');
            this.removeHeader('Content-Length');
            this.removeHeader('Transfer-Encoding');
            return this.end(), void 0;
        }
        if (this.method === "HEAD") {
            return this.end(), void 0;
        }
        switch (typeof (chunk)) {
            case 'undefined': throw new Error("Body required....");
            case 'string':
                if (!this.get('Content-Type')) {
                    this.type('html');
                }
                break;
            case 'boolean':
            case 'number':
                if (!this.get('Content-Type')) {
                    this.type('text');
                }
                chunk = String(chunk);
            case 'object':
                if (Buffer.isBuffer(chunk)) {
                    if (!this.get('Content-Type')) {
                        this.type('bin');
                    }
                } else {
                    this.type("json");
                    chunk = Util.JSON.stringify(chunk);
                }
                break;
        }
        let len: number = 0;
        if (Buffer.isBuffer(chunk)) {
            // get length of Buffer
            len = chunk.length;
        } else {
            // convert chunk to Buffer and calculate
            chunk = Buffer.from(chunk, "utf-8");
            len = chunk.length;
        }
        this.set('Content-Length', len);
        return this.end(chunk), void 0;
    }
    public asHTML(code: number, contentLength?: number, isGzip?: boolean): IResponse {
        return this.status(code, getCommonHeader(_mimeType.getMimeType("html"), contentLength, isGzip)), this;
    }
    public asJSON(code: number, contentLength?: number, isGzip?: boolean): IResponse {
        return this.status(code, getCommonHeader(_mimeType.getMimeType('json'), contentLength, isGzip)), this;
    }
    public render(ctx: IContext, path: string, status?: IResInfo): void {
        return Template.parse(ctx, path, status);
    }
    public redirect(url: string, force?: boolean): void {
        if (force) {
            this.noCache();
        }
        return this.status(this.statusCode, {
            'Location': url
        }).end(), void 0;
    }
    public cookie(name: string, val: string, options: CookieOptions): IResponse {
        let sCookie: number | string | string[] | undefined = this.getHeader('Set-Cookie');
        if (Array.isArray(sCookie)) {
            this.removeHeader('Set-Cookie');
        } else {
            sCookie = [];
        }
        sCookie.push(createCookie(name, val, options));
        return this.setHeader('Set-Cookie', sCookie), this;
    }
    public sendIfError(err?: any): boolean {
        if (!this.isAlive) return true;
        if (!err || !Util.isError(err)) return false;
        this.status(500, {
            'Content-Type': _mimeType.getMimeType('text')
        }).end(`Runtime Error: ${err.message}`);
        return true;
    }
    public json(body: NodeJS.Dict<any>, compress?: boolean, next?: (error: Error | null) => void): void {
        const buffer: Buffer = Buffer.from(Util.JSON.stringify(body), "utf-8");
        if (typeof (compress) === 'boolean' && compress === true) {
            return _zlib.gzip(buffer, (error: Error | null, buff: Buffer) => {
                if (!this.sendIfError(error)) {
                    this.asJSON(200, buff.length, true).end(buff);
                }
            }), void 0;
        }
        return this.asJSON(200, buffer.length).end(buffer), void 0;
    }
    public dispose(): void {
        delete this._method;
        if (this.cleanSocket || process.env.TASK_TYPE === 'TEST') {
            this.removeAllListeners();
            this.destroy();
        }
    }
}

function getCommonHeader(contentType: string, contentLength?: number, isGzip?: boolean): OutgoingHttpHeaders {
    const header: OutgoingHttpHeaders = {
        'Content-Type': contentType
    };
    if (typeof (contentLength) === 'number') {
        header['Content-Length'] = contentLength;
    }
    if (typeof (isGzip) === 'boolean' && isGzip === true) {
        header['Content-Encoding'] = 'gzip';
    }
    return header;
}

function createCookie(name: string, val: string, options: CookieOptions): string {
    let str = `${name}=${val}`;
    if (options.domain)
        str += `;Domain=${options.domain}`;
    if (options.path) {
        str += `;Path=${options.path}`;
    } else {
        str += ';Path=/';
    }
    if (options.expires && !options.maxAge)
        str += `;Expires=${ToResponseTime(options.expires)}`;
    if (options.maxAge && !options.expires)
        str += `;Expires=${ToResponseTime(Date.now() + options.maxAge)}`;
    if (options.secure)
        str += '; Secure';
    if (options.httpOnly)
        str += '; HttpOnly';
    if (options.sameSite) {
        switch (options.sameSite) {
            case true: str += ';SameSite=Strict'; break;
            case 'lax': str += ';SameSite=Lax'; break;
            case 'strict': str += ';SameSite=Strict'; break;
            case 'none': str += ';SameSite=None'; break;
        }
    }
    return str;
}