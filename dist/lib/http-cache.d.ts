import { IncomingHttpHeaders } from 'node:http';
import type { IResponse } from './response';
export type IChangeHeader = {
    sinceModify?: number | void;
    etag?: string;
};
export declare class HttpCache {
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
    static getIfModifiedSinceUTCTime(headers: IncomingHttpHeaders): number | undefined;
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
    static getChangedHeader(headers: IncomingHttpHeaders): IChangeHeader;
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
    static writeCacheHeader(res: IResponse, obj: {
        lastChangeTime?: number | void;
        etag?: string;
    }, cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    }): void;
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
    static getEtag(timestamp: number, fsize: number): string;
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
    static isAcceptedEncoding(headers: IncomingHttpHeaders, name: string): boolean;
}
