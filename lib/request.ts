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

// 4:03 PM 2/7/2026
// by rajib chy

import { IncomingMessage } from 'node:http';
import { toString } from './app-static';
import { Util } from './app-util';
import { UrlWithParsedQuery } from 'node:url';
import { escapePath, getClientIp, parseCookie, parseUrl } from './help';
import type { ISession } from './session';
import type { CompressionType } from './app-global';

type ParsedUrlQuery = { [key: string]: string | string[] | undefined; };

export interface IRequest extends IncomingMessage {
    /**
     * Gets the parsed request URL.
     *
     * @remarks
     * The URL is parsed only once using `parseUrl()` and the result is cached
     * for subsequent accesses.
     *
     * @returns The parsed URL, including its pathname and query parameters.
     */
    readonly q: UrlWithParsedQuery;

    /**
     * Gets the unique identifier for this request.
     *
     * @remarks
     * A GUID is generated lazily on first access using `Util.guid()` and
     * reused for the lifetime of the request.
     *
     * @returns The request identifier.
     */
    readonly id: string;


    /**
     * Gets the parsed HTTP cookies.
     *
     * @remarks
     * The `Cookie` request header is parsed only once and the resulting
     * key-value map is cached for subsequent accesses.
     *
     * @returns A dictionary containing the parsed cookie names and values.
     */
    readonly cookies: Record<string, string>;

    /**
     * Gets the parsed URL query parameters.
     *
     * @remarks
     * This property returns the `query` component of the parsed request URL.
     *
     * @returns The parsed query parameters.
     */
    readonly query: ParsedUrlQuery;

    /**
     * Gets the client's IP address.
     *
     * @remarks
     * The IP address is resolved using `getClientIp()` on first access and
     * cached for subsequent accesses.
     *
     * @returns The client's IP address.
     */
    readonly ip: string;
    readonly isMobile: boolean;
    readonly isLocal: boolean;
    cleanSocket: boolean;

    /**
     * Gets the normalized request path.
     *
     * @remarks
     * The path is URL-decoded and sanitized using `escapePath()`. The computed
     * value is cached after the first access.
     *
     * @returns The normalized request path.
     */
    path: string;
    session: ISession;

    /**
     * Retrieves the value of an HTTP request header.
     *
     * @param name - The header name. Header names are matched using Node.js'
     * normalized lowercase keys (for example, `"content-type"` or
     * `"accept-encoding"`).
     * @returns The header value as a string, or `undefined` if the header is not present.
     */
    get(name: string): string | void;
    setSocketNoDelay(noDelay?: boolean): void;
    dispose(): void;

    /**
     * Returns the most suitable compression algorithm supported by the client.
     *
     * @remarks
     * The client's `Accept-Encoding` header is evaluated in the following order:
     *
     * 1. The server's preferred compression algorithm (`_DEFAULT_CONTENT_COMPRESSION`), if accepted.
     * 2. Brotli (`br`).
     * 3. Gzip (`gzip`).
     *
     * If none of the supported algorithms are accepted, or the
     * `Accept-Encoding` header is not present, `null` is returned.
     *
     * @returns The selected compression algorithm, or `null` if no supported
     * compression algorithm is accepted by the client.
     */
    acceptEncoding(): CompressionType;
}

const MOBILE_RE = /mobile/i;

/**
 * The server's preferred response compression algorithm.
 *
 * This value is read from the `DEFAULT_CONTENT_COMPRESSION` environment
 * variable and defaults to `"gzip"` when not specified.
 */
const _DEFAULT_CONTENT_COMPRESSION = process.env.DEFAULT_CONTENT_COMPRESSION ?? "gzip";

export class Request extends IncomingMessage implements IRequest {
    private _q: UrlWithParsedQuery | undefined;
    private _cookies: Record<string, string> | undefined;
    private _path: string | undefined;
    private _session: ISession | undefined;
    private _ip: string | undefined;
    private _id: string | undefined;
    private _cleanSocket: boolean | undefined;
    private _isMobile: boolean | undefined;
    private _isLocal: boolean | undefined;

    public get isMobile(): boolean {
        if (this._isMobile !== undefined) return this._isMobile;
        const userAgent: string = toString(this.get('user-agent'));
        this._isMobile = MOBILE_RE.test(userAgent);
        return this._isMobile;
    }

    public get cleanSocket(): boolean {
        if (this._cleanSocket === undefined)
            return false;
        return this._cleanSocket;
    }

    public set cleanSocket(val: boolean) {
        this._cleanSocket = val;
    }

    public get q(): UrlWithParsedQuery {
        if (this._q !== undefined) return this._q;
        this._q = parseUrl(this.url);
        return this._q;
    }

    public get cookies(): Record<string, string> {
        if (this._cookies !== undefined) return this._cookies;
        this._cookies = parseCookie(this.headers.cookie);
        return this._cookies;
    }

    public get session(): ISession {
        return this._session || Object.create({});
    }

    public set session(val: ISession) {
        this._session = val;
    }

    public get isLocal() {
        if (this._isLocal !== undefined) return this._isLocal;
        this._isLocal = this.ip === '::1' || this.ip === '127.0.0.1';
        return this._isLocal;
    }

    public get path(): string {
        if (this._path !== undefined) return this._path;
        this._path = decodeURIComponent(escapePath(this.q.pathname));
        return this._path;
    }

    public set path(val: string) {
        this._path = val;
    }

    public get ip(): string {
        if (this._ip !== undefined) return this._ip;
        this._ip = getClientIp(this);
        return this._ip;
    }

    public get id(): string {

        if (!this._id) {
            this._id = Util.guid();
        }

        return this._id;
    }

    public get query(): ParsedUrlQuery {
        return this.q.query;
    }

    /**
     * Retrieves the value of an HTTP request header.
     *
     * @param name - The header name. Header names are matched using Node.js'
     * normalized lowercase keys (for example, `"content-type"` or
     * `"accept-encoding"`).
     * @returns The header value as a string, or `undefined` if the header is not present.
     */
    public get(name: string): string | void {
        const val = this.headers[name];
        if (val !== undefined) {
            return String(val);
        }
    }

    /**
     * Returns the most suitable compression algorithm supported by the client.
     *
     * @remarks
     * The client's `Accept-Encoding` header is evaluated in the following order:
     *
     * 1. The server's preferred compression algorithm (`_DEFAULT_CONTENT_COMPRESSION`), if accepted.
     * 2. Brotli (`br`).
     * 3. Gzip (`gzip`).
     *
     * If none of the supported algorithms are accepted, or the
     * `Accept-Encoding` header is not present, `null` is returned.
     *
     * @returns The selected compression algorithm, or `null` if no supported
     * compression algorithm is accepted by the client.
     */
    public acceptEncoding(): CompressionType {
        const encoding = this.get('accept-encoding');
        if (!encoding)
            return null;

        // Check if the client supports our explicitly preferred server default first
        if (encoding.includes(_DEFAULT_CONTENT_COMPRESSION))
            return _DEFAULT_CONTENT_COMPRESSION;

        if (encoding.includes('br'))
            return 'br';

        // Strict fallback ladder if the server default isn't matched
        if (encoding.includes('gzip'))
            return 'gzip';

        // zstd not supported write now. will be implement

        return null;
    }

    public setSocketNoDelay(noDelay?: boolean) {
        if (this.socket) {
            this.socket.setNoDelay(noDelay);
        }
    }

    public dispose(): void {
        delete this._id;
        delete this._q;
        delete this._ip;
        delete this._path;
        delete this._cookies;
        delete this._isLocal;

        if (this.cleanSocket || process.env.TASK_TYPE === 'TEST') {
            this.removeAllListeners();
            this.destroy();
        }

    }
}