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
const pathRegx = new RegExp('/', "gi");
function getRouteMatcher(route, rRepRegx) {
    if (route.charAt(route.length - 1) === '/') {
        throw new Error(`Invalid route defined ${route}`);
    }
    const wildcardIndex = route.lastIndexOf("*");
    if (wildcardIndex > -1) {
        if (route.charAt(route.length - 1) !== "*") {
            throw new Error(`Invalid route defined ${route}`);
        }
        const wmatch = route.match(/\*/gi);
        if (wmatch && wmatch.length > 1) {
            throw new Error(`Invalid route defined ${route}`);
        }
    }
    const croute = route
        .replace(pathRegx, "\\/")
        .replace(/\*/gi, "(.*)")
        .replace(/:([\s\S]+?)\/|:([\s\S]+?).*/gi, (str) => {
        if (str.indexOf("\\/") > -1) {
            return "(?:([^\/]+?))\\/";
        }
        return "(?:([^\/]+?))";
    });
    let repRegxStr;
    if (rRepRegx === true && route.indexOf(":") < 0) {
        const nRoute = route.substring(0, route.lastIndexOf("/")).replace(pathRegx, "\\/");
        repRegxStr = `^${nRoute}\/?(?=\/|$)`;
    }
    const regx = `^${croute}\\/?$`;
    // const tregx: RegExp = new RegExp( `^${croute}\\/?$`, "gi" );
    return {
        test(val) {
            return new RegExp(regx, "gi").test(val);
        },
        exec(val) {
            return new RegExp(regx, "gi").exec(val);
        },
        replace(val) {
            if (!repRegxStr)
                return val;
            return val.replace(new RegExp(repRegxStr, "gi"), "");
        }
    };
}
// 2:07 AM 6/7/2020
function pathToArray(pathStr, to) {
    const from = pathStr.split("/");
    for (const kv of from) {
        if (!kv || kv.length === 0)
            continue;
        to.push(kv);
    }
}
function getRouteInfo(reqPath, handlerInfos, method) {
    if (handlerInfos.length === 0)
        return void 0;
    if (reqPath.length === 0) {
        reqPath = "/";
    }
    if (method === "ANY") {
        const layer = handlerInfos.find(a => {
            if (a.routeMatcher)
                return a.routeMatcher.test(reqPath);
            return false;
        });
        if (!layer)
            return void 0;
        return {
            layer
        };
    }
    const pathArray = reqPath.split("/");
    for (const layer of handlerInfos) {
        if (!layer.routeMatcher)
            continue;
        if (layer.method !== "ANY") {
            if (layer.method !== method)
                continue;
        }
        if (layer.pathArray.length > 0) {
            if (layer.pathArray[1] !== "*" && layer.pathArray[1].indexOf(":") < 0 && pathArray[1] !== layer.pathArray[1])
                continue;
        }
        if (!layer.routeMatcher.test(reqPath))
            continue;
        const rmatch = layer.routeMatcher.exec(reqPath);
        if (rmatch) {
            const requestParam = {
                query: {},
                match: []
            };
            let nextIndex = -1;
            for (const mstr of rmatch) {
                nextIndex++;
                if (nextIndex === 0)
                    continue;
                if (mstr.indexOf("/") > -1) {
                    pathToArray(mstr, requestParam.match);
                    continue;
                }
                const curIndex = nextIndex;
                nextIndex = layer.pathArray.findIndex((str, index) => index >= curIndex && str.indexOf(":") > -1);
                if (nextIndex < 0) {
                    requestParam.match.push(mstr);
                    continue;
                }
                const part = layer.pathArray[nextIndex];
                requestParam.query[part.replace(/:/gi, "")] = pathArray[nextIndex];
            }
            return {
                layer,
                requestParam
            };
        }
    }
    return void 0;
}
//# sourceMappingURL=app-router.js.map