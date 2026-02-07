"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookie = parseCookie;
exports.escapePath = escapePath;
exports.parseUrl = parseUrl;
exports.parseIp = parseIp;
exports.getClientIp = getClientIp;
exports.injectPrototype = injectPrototype;
// 4:03 PM 2/7/2026
// by rajib chy
const node_url_1 = __importDefault(require("node:url"));
const app_static_1 = require("./app-static");
function parseCookie(cook) {
    if (!cook)
        return {};
    if (Array.isArray(cook))
        return getCook(cook);
    if (cook instanceof Object)
        return cook;
    return getCook(cook.split(';'));
}
function getCook(cooks) {
    const cookies = {};
    cooks.forEach((value) => {
        const index = value.indexOf('=');
        if (index < 0)
            return;
        cookies[value.substring(0, index).trim()] = value.substring(index + 1).trim();
    });
    return cookies;
}
function escapePath(unsafe) {
    if (!unsafe)
        return "";
    return unsafe
        .replace(/%/gi, "")
        .replace(/=/gi, "")
        .replace(/</gi, "")
        .replace(/>/gi, "")
        .replace(/&/gi, "")
        .trim();
}
function parseUrl(url) {
    if (url) {
        return node_url_1.default.parse(url, true);
    }
    return Object.create({
        pathname: null, query: {}
    });
}
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
function parseIp(ip) {
    const normalized = ip.trim().toLowerCase();
    if (normalized.startsWith("::ffff:")) {
        return normalized.substring(7);
    }
    return normalized;
}
function getClientIp(req) {
    const res = req.headers['x-forwarded-for'];
    let ip;
    if (res && typeof (res) === 'string') {
        ip = parseIp(res.split(',')[0]);
        if (ip)
            return ip;
    }
    ip = parseIp((0, app_static_1.toString)(req.socket.remoteAddress));
    return (0, app_static_1.toString)(ip);
}
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
function injectPrototype(srcCtor, dstCtor, overwrite = false) {
    const src = srcCtor.prototype;
    const dst = dstCtor.prototype;
    for (const key of Reflect.ownKeys(src)) {
        if (key === "constructor")
            continue;
        if (!overwrite && Object.prototype.hasOwnProperty.call(dst, key)) {
            continue;
        }
        const desc = Object.getOwnPropertyDescriptor(src, key);
        if (desc) {
            Object.defineProperty(dst, key, desc);
        }
    }
}
//# sourceMappingURL=help.js.map