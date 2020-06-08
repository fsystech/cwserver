"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteInfo = exports.pathToArray = exports.getRouteMatcher = void 0;
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
    }
    const croute = route
        .replace(pathRegx, "\\/")
        .replace(/\*/gi, '(.*)')
        .replace(/:([\s\S]+?)\/|:([\s\S]+?).*/gi, (str) => {
        if (str.indexOf("\\/") > -1) {
            return "(?:([^\/]+?))\\/";
        }
        return "(?:([^\/]+?))";
    });
    let repStr;
    if (rRepRegx === true && route.indexOf(":") < 0) {
        const nRoute = route.substring(0, route.lastIndexOf("/")).replace(pathRegx, "\\/");
        repStr = `^${nRoute}\/?(?=\/|$)`;
    }
    const regx = `^${croute}\\/?$`;
    return {
        get regExp() {
            return new RegExp(regx, "gi");
        },
        get repRegExp() {
            if (!repStr)
                return void 0;
            return new RegExp(repStr, "gi");
        }
    };
}
exports.getRouteMatcher = getRouteMatcher;
// 2:07 AM 6/7/2020
function pathToArray(pathStr, to) {
    const from = pathStr.split("/");
    for (const kv of from) {
        if (!kv || kv.length === 0)
            continue;
        to.push(kv);
    }
}
exports.pathToArray = pathToArray;
;
function getRouteInfo(reqPath, handlerInfos, method) {
    if (handlerInfos.length === 0)
        return void 0;
    if (reqPath.length === 0) {
        reqPath = "/";
    }
    if (method === "ANY") {
        const layer = handlerInfos.find(a => {
            if (a.routeMatcher)
                return a.routeMatcher.regExp.test(reqPath);
            return false;
        });
        if (!layer)
            return void 0;
        return {
            layer
        };
    }
    const pathArray = reqPath.split("/");
    for (const info of handlerInfos) {
        if (!info.routeMatcher)
            continue;
        if (info.method !== "ANY") {
            if (info.method !== method)
                continue;
        }
        if (info.pathArray.length > 0) {
            if (info.pathArray[1] !== "*" && info.pathArray[1].indexOf(":") < 0 && pathArray[1] !== info.pathArray[1])
                continue;
        }
        if (!info.routeMatcher.regExp.test(reqPath))
            continue;
        const rmatch = info.routeMatcher.regExp.exec(reqPath);
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
                nextIndex = info.pathArray.findIndex((str, index) => index >= nextIndex && str.indexOf(":") > -1);
                if (nextIndex < 0) {
                    requestParam.match.push(mstr);
                    continue;
                }
                const part = info.pathArray[nextIndex];
                requestParam.query[part.replace(/:/gi, "")] = pathArray[nextIndex];
            }
            return {
                layer: info,
                requestParam
            };
        }
    }
    return void 0;
}
exports.getRouteInfo = getRouteInfo;
//# sourceMappingURL=sow-router.js.map