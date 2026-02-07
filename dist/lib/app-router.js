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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteMatcher = getRouteMatcher;
exports.pathToArray = pathToArray;
exports.getRouteInfo = getRouteInfo;
const pathRegx = /\//g;
/**
 * Builds a route matcher object from a route definition string.
 *
 * This function converts an application route (e.g. `/user/:id`, `/files/*`)
 * into a reusable matcher with `test`, `exec`, and optional `replace` support.
 *
 * Supported route features:
 * - Static paths: `/tradeplus/launch`
 * - Named parameters: `/user/:id`
 * - Wildcards (only at end): `/assets/*`
 * - Optional trailing slash matching
 *
 * Validation rules:
 * - Route must NOT end with `/`
 * - Only one `*` wildcard is allowed
 * - Wildcard `*` must be the last character in the route
 *
 * Named parameters (`:param`) are captured as regex groups and later mapped
 * by index to request path segments.
 *
 * When `rRepRegx` is enabled and the route has no named parameters, a secondary
 * replace-regex is generated. This allows stripping the matched route prefix
 * from the request path (useful for proxying or sub-routing).
 *
 * @param route
 * Route definition string (example: `/mobile-chart/*`, `/user/:id`).
 *
 * @param rRepRegx
 * When `true`, enables generation of a replacement regex used by `replace()`
 * to remove the matched route prefix from a request path.
 * This is only applied when the route contains no named parameters.
 *
 * @throws
 * Throws an error if the route definition is invalid:
 * - Trailing slash
 * - Multiple wildcards
 * - Wildcard not at the end
 *
 * @returns
 * An `IRouteMatcher` object with:
 * - `test(path)`    -> boolean route match
 * - `exec(path)`    -> RegExp match result with capture groups
 * - `replace(path)` -> path with matched prefix removed (if enabled)
 */
function getRouteMatcher(route, rRepRegx) {
    if (route.length === 0) {
        throw new Error("Invalid route defined (empty route)");
    }
    if (route.charAt(route.length - 1) === "/") {
        throw new Error(`Invalid route defined ${route}`);
    }
    // validate wildcard
    const wildcardIndex = route.indexOf("*");
    if (wildcardIndex !== -1) {
        if (route.charAt(route.length - 1) !== "*") {
            throw new Error(`Invalid route defined ${route}`);
        }
        if (route.indexOf("*", wildcardIndex + 1) !== -1) {
            throw new Error(`Invalid route defined ${route}`);
        }
    }
    const croute = route
        .replace(pathRegx, "\\/")
        .replace(/\*/g, "(.*)")
        .replace(/:([\s\S]+?)\/|:([\s\S]+?).*/g, (str) => {
        return str.indexOf("\\/") > -1
            ? "(?:([^\\/]+?))\\/"
            : "(?:([^\\/]+?))";
    });
    let repRegx;
    if (rRepRegx === true && route.indexOf(":") < 0) {
        const lastSlash = route.lastIndexOf("/");
        if (lastSlash > 0) {
            const nRoute = route.substring(0, lastSlash).replace(pathRegx, "\\/");
            repRegx = new RegExp(`^${nRoute}\\/?(?=\\/|$)`, "i");
        }
    }
    const mainRegx = new RegExp(`^${croute}\\/?$`, "i");
    return {
        test(val) {
            return mainRegx.test(val);
        },
        exec(val) {
            return mainRegx.exec(val);
        },
        replace(val) {
            if (!repRegx)
                return val;
            return val.replace(repRegx, "");
        }
    };
}
/**
 * Splits a path string into individual non-empty segments and appends them into the target array.
 *
 * This helper is useful for normalizing URL paths or wildcard matches such as:
 *  - "/a/b/c"  -> ["a", "b", "c"]
 *  - "///a//b" -> ["a", "b"]
 *
 * Empty segments produced by consecutive slashes are ignored.
 *
 * @param pathStr
 * The raw path string to split (example: "/tradeplus/launch").
 *
 * @param to
 * Target array where extracted path segments will be appended.
 *
 * @returns
 * This function does not return anything. It mutates the `to` array in-place.
 */
function pathToArray(pathStr, to) {
    // 2:07 AM 6/7/2020
    const from = pathStr.split("/");
    for (const kv of from) {
        if (!kv || kv.length === 0)
            continue;
        to.push(kv);
    }
}
/**
 * Finds the first matching route layer for the given request path and HTTP method.
 *
 * This function scans the provided handler layer list and attempts to resolve
 * the correct route handler based on:
 *  - HTTP method matching (GET/POST/ANY)
 *  - fast path segment checking (avoids regex if first segment mismatch)
 *  - routeMatcher regular expression execution
 *
 * If a route is matched, it returns the matched layer and (if applicable)
 * extracted route parameters.
 *
 * Route parameter extraction supports:
 *  - named parameters (e.g. "/user/:id")
 *  - wildcard segments (e.g. "/files/*")
 *  - multi-segment captures (e.g. "/a/b/c")
 *
 * @template T The handler type stored inside the layer.
 *
 * @param reqPath
 * The request path (example: "/tradeplus/launch").
 * If empty, it is treated as "/".
 *
 * @param handlerInfos
 * List of route/middleware layers containing matchers and handler functions.
 *
 * @param method
 * Request method (example: "GET", "POST").
 * If "ANY", method filtering is skipped and only the first regex match is returned.
 *
 * @returns
 * Returns the matched route info including the layer and extracted request parameters,
 * or `undefined` if no matching layer is found.
 */
function getRouteInfo(reqPath, handlerInfos, method) {
    var _a;
    const len = handlerInfos.length;
    if (len === 0)
        return undefined;
    if (!reqPath)
        reqPath = "/";
    // Only split if needed
    const reqParts = method === "ANY" ? null : reqPath.split("/");
    for (let i = 0; i < len; i++) {
        const layer = handlerInfos[i];
        const matcher = layer.routeMatcher;
        if (!matcher)
            continue;
        // Method filter
        if (method !== "ANY") {
            const lm = layer.method;
            if (lm && lm !== "ANY" && lm !== method)
                continue;
        }
        // Fast path check (avoid regex when possible)
        if (reqParts && layer.pathArray && layer.pathArray.length > 1) {
            const first = layer.pathArray[1];
            if (first && first !== "*" && first.indexOf(":") < 0) {
                if (reqParts[1] !== first)
                    continue;
            }
        }
        // exec() does matching + capture in one pass
        const rmatch = matcher.exec(reqPath);
        if (!rmatch)
            continue;
        // For method ANY, no param extraction needed
        if (method === "ANY") {
            return { layer };
        }
        const layerParts = (_a = layer.pathArray) !== null && _a !== void 0 ? _a : [];
        const requestParam = { query: {}, match: [] };
        // Precompute param indexes once (avoid findIndex inside loop)
        let paramIndexes = null;
        if (layerParts.length > 0) {
            paramIndexes = [];
            for (let p = 0; p < layerParts.length; p++) {
                if (layerParts[p].indexOf(":") === 0)
                    paramIndexes.push(p);
            }
        }
        let paramPtr = 0;
        for (let m = 1; m < rmatch.length; m++) {
            const mstr = rmatch[m];
            if (!mstr)
                continue;
            if (mstr.indexOf("/") !== -1) {
                pathToArray(mstr, requestParam.match);
                continue;
            }
            const idx = paramIndexes && paramPtr < paramIndexes.length
                ? paramIndexes[paramPtr++]
                : -1;
            if (idx < 0) {
                requestParam.match.push(mstr);
                continue;
            }
            const key = layerParts[idx].slice(1); // remove ':'
            requestParam.query[key] = reqParts[idx];
        }
        return { layer, requestParam };
    }
    return undefined;
}
//# sourceMappingURL=app-router.js.map