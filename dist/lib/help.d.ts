import { UrlWithParsedQuery } from 'node:url';
import type { IRequest } from './request';
export declare function parseCookie(cook: undefined | string[] | string | {
    [x: string]: any;
}): NodeJS.Dict<string>;
export declare function escapePath(unsafe?: string | null): string;
export declare function parseUrl(url?: string): UrlWithParsedQuery;
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
