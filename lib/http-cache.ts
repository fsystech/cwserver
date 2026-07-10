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

// 1:47 AM 5/5/2020
// by rajib chy
import { IncomingHttpHeaders } from 'node:http';
import type { IResponse } from './response';
import { toResponseTime } from './app-static';

export type IChangeHeader = {
    sinceModify?: number | void;
    etag?: string;
};
export class HttpCache {

    /**
     * Parses the `If-Modified-Since` request header and returns its UTC timestamp.
     *
     * Node.js normalizes incoming header names to lowercase, so the header is
     * read from `if-modified-since`. If the header is missing or contains an
     * invalid HTTP date, `undefined` is returned.
     *
     * @param {IncomingHttpHeaders} headers - The incoming HTTP request headers.
     * @returns {number | undefined} The parsed UTC timestamp in milliseconds,
     * or `undefined` when the header is absent or invalid.
     */
    public static getIfModifiedSinceUTCTime(headers: IncomingHttpHeaders): number | undefined {
        // IncomingHttpHeaders automatically normalizes keys to lowercase
        const headerValue = headers["if-modified-since"];

        if (headerValue) {
            // Safely grab the first string if it's an array (rare for this header, but safe)
            const dateStr = Array.isArray(headerValue) ? headerValue[0] : headerValue;
            const timestamp = Date.parse(dateStr);

            // Fast, native validation check
            if (!isNaN(timestamp)) {
                return timestamp;
            }
        }

        // Returning undefined is cleaner and idiomatic in TypeScript than 'number | void'
        return undefined;
    }

    /**
     * Extracts conditional request headers used for cache validation.
     *
     * Reads the `If-Modified-Since` and `If-None-Match`/`ETag` headers from the
     * incoming request and returns them in a normalized structure for
     * conditional response handling (for example, returning `304 Not Modified`).
     *
     * @param {IncomingHttpHeaders} headers - The incoming HTTP request headers.
     * @returns {IChangeHeader} An object containing the parsed
     * `If-Modified-Since` timestamp and `ETag`, if present.
     */
    public static getChangedHeader(headers: IncomingHttpHeaders): IChangeHeader {
        const tag = headers["If-None-Match"] || headers["if-none-match"] || headers.ETag || headers.etag;
        return {
            sinceModify: this.getIfModifiedSinceUTCTime(headers),
            etag: tag ? tag.toString() : void 0
        };
    }

    /**
     * Writes standard HTTP caching headers to the response.
     *
     * Depending on the supplied configuration, this method enables either:
     * - Time-based client caching using `Cache-Control: max-age` and `Expires`, or
     * - Server revalidation using `Cache-Control: no-cache, must-revalidate`,
     *   allowing clients to validate cached content with `ETag` or
     *   `Last-Modified` before reusing it.
     *
     * If provided, the `Last-Modified` and `ETag` headers are included to support
     * conditional requests (`If-Modified-Since` and `If-None-Match`).
     *
     * @param {IResponse} res - The HTTP response object.
     * @param {{ lastChangeTime?: number | void; etag?: string }} obj - Cache
     * metadata used for conditional requests.
     * @param {number} [obj.lastChangeTime] - Resource modification time as a Unix
     * timestamp in milliseconds.
     * @param {string} [obj.etag] - Entity tag identifying the current version of
     * the resource.
     * @param {{ maxAge: number; serverRevalidate: boolean }} cacheHeader - Cache
     * policy configuration.
     * @param {number} cacheHeader.maxAge - Client cache lifetime in seconds.
     * @param {boolean} cacheHeader.serverRevalidate - When `true`, instructs
     * clients to revalidate cached content with the server before using it.
     * When `false`, allows clients to reuse the cached response until `maxAge`
     * expires.
     * @returns {void}
     */
    public static writeCacheHeader(
        res: IResponse,
        obj: { lastChangeTime?: number | void, etag?: string },
        cacheHeader: {
            maxAge: number; // Assumed to be in seconds (e.g., 3600 for 1 hour)
            serverRevalidate: boolean;
        }
    ): void {
        if (obj.lastChangeTime) {
            res.setHeader('last-modified', toResponseTime(obj.lastChangeTime));

            // 'expires' expects an absolute future date string. 
            // Convert maxAge to milliseconds to add it to Date.now().
            const expiresTimestamp = Date.now() + (cacheHeader.maxAge * 1000);
            res.setHeader('expires', toResponseTime(expiresTimestamp));
        }

        if (obj.etag) {
            res.setHeader('ETag', obj.etag);
        }

        if (cacheHeader.serverRevalidate) {
            // Tells browser to store it, but always revalidate using ETag/Last-Modified
            res.setHeader('cache-control', 'no-cache, must-revalidate');
            res.setHeader('x-server-revalidate', 'true');
        } else {
            // Pass ONLY the relative maxAge seconds here. Do NOT add Date.now().
            res.setHeader('cache-control', `max-age=${cacheHeader.maxAge}, public`);
        }
    }

    /**
     * Generates a weak ETag from a resource's last modification timestamp and size.
     *
     * The ETag is intended for HTTP cache validation and should not be considered
     * a cryptographically unique identifier. It is suitable for detecting resource
     * changes for conditional requests.
     *
     * @param {number} timestamp - The resource's last modification time in
     * milliseconds since the Unix epoch.
     * @param {number} fsize - The resource size in bytes.
     * @returns {string} A weak ETag value.
     */
    public static getEtag(timestamp: number, fsize: number): string {
        return `W/${(timestamp ^ fsize)}`;
    }

    /**
     * Determines whether the client accepts a specific content encoding.
     *
     * Checks the `Accept-Encoding` request header for the specified encoding
     * token (for example, `"gzip"` or `"br"`).
     *
     * @param {IncomingHttpHeaders} headers - The incoming HTTP request headers.
     * @param {string} name - The content encoding to check.
     * @returns {boolean} `true` if the encoding is accepted; otherwise, `false`.
     */
    public static isAcceptedEncoding(headers: IncomingHttpHeaders, name: string): boolean {
        const acceptEncoding = headers['accept-encoding'];
        if (!acceptEncoding) return false;
        return acceptEncoding.indexOf(name) > -1;
    }
}