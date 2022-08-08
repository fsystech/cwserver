// Copyright (c) 2022 Safe Online World Ltd.
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

// 1:47 AM 5/5/2020
// by rajib chy
import { IncomingHttpHeaders } from 'http';
import { IResponse } from './sow-server-core';
import { ToResponseTime } from './sow-static';
export type IChangeHeader = {
    sinceModify?: number | void;
    etag?: string;
};
export class SowHttpCache {
    /** Gets value in millisecond of {If-Modified-Since} from header. */
    public static getIfModifiedSinceUTCTime(headers: IncomingHttpHeaders): number | void {
        const ifModifiedSinceHeaderText: string | string[] | undefined = headers["If-Modified-Since"] || headers["if-modified-since"];
        if (ifModifiedSinceHeaderText) {
            const date: Date = new Date(ifModifiedSinceHeaderText.toString());
            if (date.toString().indexOf("Invalid") > -1) return void 0;
            return date.getTime();
        }
        return void 0;
    }
    /** Gets the {sinceModify, etag} from given header {If-None-Match, If-Modified-Since}. */
    public static getChangedHeader(headers: IncomingHttpHeaders): IChangeHeader {
        const tag: string | string[] | undefined = headers["If-None-Match"] || headers["if-none-match"] || headers.ETag || headers.etag;
        return {
            sinceModify: this.getIfModifiedSinceUTCTime(headers),
            etag: tag ? tag.toString() : void 0
        };
    }
    /**
     * Write cache header
     * e.g. {last-modified, expires, ETag, cache-control, x-server-revalidate}.
     */
    public static writeCacheHeader(
        res: IResponse,
        obj: { lastChangeTime?: number | void, etag?: string },
        cacheHeader: {
            maxAge: number;
            serverRevalidate: boolean;
        }
    ): void {
        if (obj.lastChangeTime) {
            res.setHeader('last-modified', ToResponseTime(obj.lastChangeTime));
            res.setHeader('expires', ToResponseTime(cacheHeader.maxAge + Date.now()));
        }
        if (obj.etag) {
            res.setHeader('ETag', obj.etag);
        }
        if (cacheHeader.serverRevalidate) {
            res.setHeader('cache-control', 'no-cache, must-revalidate, immutable');
            res.setHeader('x-server-revalidate', 'true');
        } else {
            res.setHeader('cache-control', `max-age=${cacheHeader.maxAge + Date.now()}, public, immutable`);
        }
    }
    /** Create and Gets {etag} (timestamp ^ fsize). */
    public static getEtag(timestamp: number, fsize: number): string {
        return `W/${(timestamp ^ fsize)}`;
    }
    public static isAcceptedEncoding(headers: IncomingHttpHeaders, name: string): boolean {
        const acceptEncoding = headers['accept-encoding'];
        if (!acceptEncoding) return false;
        return acceptEncoding.indexOf(name) > -1;
    }
}