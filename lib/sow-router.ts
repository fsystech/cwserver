/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 3:15 AM 6/7/2020
// by rajib chy
export type IRouteMatcher = {
    readonly test: (val: string) => boolean;
    readonly replace: (val: string) => string;
    readonly exec: (val: string) => RegExpMatchArray | null;
};
export type IRequestParam = {
    query: { [x: string]: string };
    match: string[];
};
export type ILayerInfo<T> = {
    route: string;
    handler: T;
    routeMatcher: IRouteMatcher | undefined;
    method: "GET" | "POST" | "ANY";
    pathArray: string[];
};
export type IRouteInfo<T> = {
    layer: ILayerInfo<T>;
    requestParam?: IRequestParam;
};
const pathRegx = new RegExp('/', "gi");
export function getRouteMatcher(route: string, rRepRegx?: boolean): IRouteMatcher {
    if (route.charAt(route.length - 1) === '/') {
        throw new Error(`Invalid route defined ${route}`);
    }
    const wildcardIndex: number = route.lastIndexOf("*");
    if (wildcardIndex > -1) {
        if (route.charAt(route.length - 1) !== "*") {
            throw new Error(`Invalid route defined ${route}`);
        }
        const wmatch: RegExpMatchArray | null = route.match(/\*/gi);
        if (wmatch && wmatch.length > 1) {
            throw new Error(`Invalid route defined ${route}`);
        }
    }
    const croute: string = route
        .replace(pathRegx, "\\/")
        .replace(/\*/gi, "(.*)")
        .replace(/:([\s\S]+?)\/|:([\s\S]+?).*/gi, (str: string): string => {
            if (str.indexOf("\\/") > -1) {
                return "(?:([^\/]+?))\\/";
            }
            return "(?:([^\/]+?))";
        });
    let repRegxStr: string | void;
    if (rRepRegx === true && route.indexOf(":") < 0) {
        const nRoute: string = route.substring(0, route.lastIndexOf("/")).replace(pathRegx, "\\/");
        repRegxStr = `^${nRoute}\/?(?=\/|$)`;
    }
    const regx: string = `^${croute}\\/?$`;
    // const tregx: RegExp = new RegExp( `^${croute}\\/?$`, "gi" );
    return {
        test(val: string): boolean {
            return new RegExp(regx, "gi").test(val);
        },
        exec(val: string): RegExpMatchArray | null {
            return new RegExp(regx, "gi").exec(val);
        },
        replace(val: string): string {
            if (!repRegxStr) return val;
            return val.replace(new RegExp(repRegxStr, "gi"), "");
        }
    };
}
// 2:07 AM 6/7/2020
export function pathToArray(pathStr: string, to: string[]): void {
    const from: string[] = pathStr.split("/");
    for (const kv of from) {
        if (!kv || kv.length === 0) continue;
        to.push(kv);
    }
}
export function getRouteInfo<T>(
    reqPath: string,
    handlerInfos: ILayerInfo<T>[],
    method: string
): IRouteInfo<T> | undefined {
    if (handlerInfos.length === 0) return void 0;
    if (reqPath.length === 0) {
        reqPath = "/";
    }
    if (method === "ANY") {
        const layer = handlerInfos.find(a => {
            if (a.routeMatcher)
                return a.routeMatcher.test(reqPath);
            return false;
        });
        if (!layer) return void 0;
        return {
            layer
        };
    }
    const pathArray: string[] = reqPath.split("/");
    for (const layer of handlerInfos) {
        if (!layer.routeMatcher) continue;
        if (layer.method !== "ANY") {
            if (layer.method !== method) continue;
        }
        if (layer.pathArray.length > 0) {
            if (layer.pathArray[1] !== "*" && layer.pathArray[1].indexOf(":") < 0 && pathArray[1] !== layer.pathArray[1]) continue;
        }
        if (!layer.routeMatcher.test(reqPath)) continue;
        const rmatch: RegExpMatchArray | null = layer.routeMatcher.exec(reqPath);
        if (rmatch) {
            const requestParam: IRequestParam = {
                query: {},
                match: []
            };
            let nextIndex: number = -1;
            for (const mstr of rmatch) {
                nextIndex++;
                if (nextIndex === 0) continue;
                if (mstr.indexOf("/") > -1) {
                    pathToArray(mstr, requestParam.match);
                    continue;
                }
                const curIndex: number = nextIndex;
                nextIndex = layer.pathArray.findIndex((str, index) => index >= curIndex && str.indexOf(":") > -1);
                if (nextIndex < 0) {
                    requestParam.match.push(mstr);
                    continue;
                }
                const part: string = layer.pathArray[nextIndex];
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