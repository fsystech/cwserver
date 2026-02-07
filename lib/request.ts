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
import { toString, ISession } from './app-static';
import { Util } from './app-util';
import { UrlWithParsedQuery } from 'node:url';
import { escapePath, getClientIp, parseCookie, parseUrl } from './help';

type ParsedUrlQuery = { [key: string]: string | string[] | undefined; };

export interface IRequest extends IncomingMessage {
    readonly q: UrlWithParsedQuery;
    readonly id: string;
    readonly cookies: NodeJS.Dict<string>;
    readonly query: ParsedUrlQuery;
    readonly ip: string;
    readonly isMobile: boolean;
    readonly isLocal: boolean;
    cleanSocket: boolean;
    path: string;
    session: ISession;
    get(name: string): string | void;
    setSocketNoDelay(noDelay?: boolean): void;
    dispose(): void;
}

const MOBILE_RE = /mobile/i;

export class Request extends IncomingMessage implements IRequest {
    private _q: UrlWithParsedQuery | undefined;
    private _cookies: NodeJS.Dict<string> | undefined;
    private _path: string | undefined;
    private _session: ISession | undefined;
    private _ip: string | undefined;
    private _id: string | undefined;
    private _cleanSocket: boolean | undefined;
    private _isMobile: boolean | undefined;
    private _isLocal: boolean | undefined;
    public get isMobile() {
        if (this._isMobile !== undefined) return this._isMobile;
        const userAgent: string = toString(this.get('user-agent'));
        this._isMobile = MOBILE_RE.test(userAgent);
        return this._isMobile;
    }
    public get cleanSocket() {
        if (this._cleanSocket === undefined) return false;
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
    public get cookies(): NodeJS.Dict<string> {
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
        if (this._id !== undefined) return this._id;
        this._id = Util.guid();
        return this._id;
    }
    public get query(): ParsedUrlQuery {
        return this.q.query;
    }

    public get(name: string): string | void {
        const val: number | string | string[] | undefined = this.headers[name];
        if (val !== undefined) {
            return String(val);
        }
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