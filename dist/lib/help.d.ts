import { UrlWithParsedQuery } from 'node:url';
import type { IRequest } from './request';
/**
 * Parses an HTTP `Cookie` header into a dictionary of cookie names and values.
 *
 * @param cook - The cookie data. This may be:
 * - A raw `Cookie` header string.
 * - An array of cookie strings.
 * - An existing cookie dictionary, which is returned unchanged.
 * - `undefined`.
 *
 * @returns A dictionary of parsed cookies. Returns an empty object if
 * `cook` is `undefined` or otherwise falsy.
 */
export declare function parseCookie(cook: undefined | string[] | string | {
    [x: string]: any;
}): Record<string, string>;
/**
 * Strips characters (percent, equals, angle brackets, ampersand) that are unsafe in a path and trims
 * whitespace.
 *
 * @param unsafe Raw path text, may be empty or null.
 * @returns The cleaned path, or an empty string when input is empty.
 */
export declare function escapePath(unsafe?: string | null): string;
/**
 * Parse a URL using the WHATWG URL API.
 *
 * Supports relative URLs, absolute URLs and protocol-relative URLs.
 * Avoids the deprecated Node.js url.parse() API.
 *
 * @param urlStr URL string to parse.
 * @returns Parsed URL with query parameters.
 */
export declare function parseUrl(urlStr?: string): UrlWithParsedQuery;
/**
 * Parses a URL string, including its query string into an object. Returns an object with a null
 * pathname and empty query when no URL is given.
 *
 * @param url URL or request URL to parse.
 * @returns The parsed URL object with query parsed.
 */
/**
 * Normalizes an IP address.
 *
 * If the input is an IPv4-mapped IPv6 address (e.g. "::ffff:192.168.0.1"),
 * the IPv4 portion is extracted and returned.
 * Otherwise, the original IP string is returned unchanged.
 *
 * @param {string} ip - The IP address to normalize.
 * @returns {string} The normalized IP address.
 */
export declare function parseIp(ip: string): string | void;
/**
 * Determines the client IP address from the first x-forwarded-for entry, falling back to the socket's
 * remote address, normalising IPv4-mapped IPv6 addresses.
 *
 * @param req Incoming request.
 * @returns The client IP address as a string.
 */
export declare function getClientIp(req: IRequest): string;
type Ctor<T = any> = new (...args: any[]) => T;
/**
 * Injects (copies) all prototype members (methods/getters/setters) from a source class
 * into a destination class prototype.
 *
 * This is useful when you want to "extend" built-in Node.js objects like
 * `IncomingMessage` or `ServerResponse` without using per-request
 * `Object.setPrototypeOf()` (which can be slower under heavy load).
 *
 * It preserves property descriptors, meaning:
 * - getters/setters remain getters/setters
 * - writable/enumerable/configurable flags are preserved
 *
 * ⚠️ Warning:
 * - If `overwrite=true`, existing destination prototype members will be replaced.
 * - Be careful not to overwrite Node.js internal methods such as `destroy()`, `end()`, etc.
 *
 * @template TSrc Source prototype type
 * @template TDst Destination prototype type
 *
 * @param srcCtor The source class (provides prototype members).
 * @param dstCtor The destination class (receives injected members).
 * @param overwrite If true, overwrites existing members in destination prototype.
 *
 * @example
 * injectPrototype(Request, IncomingMessage, true);
 * injectPrototype(Response, ServerResponse, true);
 */
export declare function injectPrototype<TSrc extends object, TDst extends object>(srcCtor: Ctor<TSrc>, dstCtor: Ctor<TDst>, overwrite?: boolean): void;
export {};
