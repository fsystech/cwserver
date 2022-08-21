export declare type IRouteMatcher = {
    readonly test: (val: string) => boolean;
    readonly replace: (val: string) => string;
    readonly exec: (val: string) => RegExpMatchArray | null;
};
export declare type IRequestParam = {
    query: {
        [x: string]: string;
    };
    match: string[];
};
export declare type ILayerInfo<T> = {
    route: string;
    handler: T;
    routeMatcher: IRouteMatcher | undefined;
    method: "GET" | "POST" | "ANY";
    pathArray: string[];
};
export declare type IRouteInfo<T> = {
    layer: ILayerInfo<T>;
    requestParam?: IRequestParam;
};
export declare function getRouteMatcher(route: string, rRepRegx?: boolean): IRouteMatcher;
export declare function pathToArray(pathStr: string, to: string[]): void;
export declare function getRouteInfo<T>(reqPath: string, handlerInfos: ILayerInfo<T>[], method: string): IRouteInfo<T> | undefined;
