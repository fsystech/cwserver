export type IRouteMatcher = {
    readonly test: (val: string) => boolean;
    readonly replace: (val: string) => string;
    readonly exec: (val: string) => RegExpMatchArray | null;
};
export type IRequestParam = {
    query: {
        [x: string]: string;
    };
    match: string[];
};
export type ILayerInfo<T> = {
    route?: string;
    handler: T;
    routeMatcher?: IRouteMatcher;
    method?: "GET" | "POST" | "ANY";
    pathArray?: string[];
};
export type IRouteInfo<T> = {
    layer: ILayerInfo<T>;
    requestParam?: IRequestParam;
};
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
export declare function getRouteMatcher(route: string, rRepRegx?: boolean): IRouteMatcher;
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
export declare function pathToArray(pathStr: string, to: string[]): void;
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
export declare function getRouteInfo<T>(reqPath: string, handlerInfos: ILayerInfo<T>[], method: string): IRouteInfo<T> | undefined;
