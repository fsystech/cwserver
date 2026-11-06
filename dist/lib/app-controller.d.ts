import type { IHttpMimeHandler } from './http-mime';
import { AppHandler } from './server';
import type { IContext } from './context';
export interface IController {
    readonly httpMimeHandler: IHttpMimeHandler;
    any(route: string, next: AppHandler): IController;
    get(route: string, next: AppHandler): IController;
    post(route: string, next: AppHandler): IController;
    processAny(ctx: IContext): Promise<void>;
    reset(): void;
    /** The given `arguments` will be skip */
    delete(...args: string[]): void;
    remove(path: string): boolean;
    sort(): void;
}
export declare class Controller implements IController {
    private _httpMimeHandler;
    private _fileInfo;
    private _hasDefaultExt;
    /**
     * Gets the HTTP mime handler used to serve static mime-typed files.
     *
     * @returns The HttpMimeHandler instance owned by this controller.
     */
    get httpMimeHandler(): IHttpMimeHandler;
    private _routeTable;
    /**
     * Creates a controller with fresh file info cache and mime handler.
     *
     * @param hasDefaultExt Whether the server uses a default extension, which enables extension-less url handling.
     */
    constructor(hasDefaultExt: boolean);
    /**
     * Clears all registered get, post and any routes and the parameterized router list.
     */
    reset(): void;
    /**
     * Finds a parameterized route matching the request path and method and invokes its handler with the
     * extracted request parameters.
     *
     * @param ctx Current request context.
     * @returns A promise resolving to true if a route handler was found and invoked, otherwise false.
     */
    private fireHandlerAsync;
    /**
     * Removes all registered routes except those matching the given patterns. With no arguments, resets
     * the whole route table.
     *
     * @param args Route patterns to keep; every other route is deleted.
     */
    delete(...args: string[]): void;
    /**
     * Registers a handler for GET requests on a route. Routes containing ":" or "*" are also added to the
     * parameterized router. Throws if the route already exists as a get or any route.
     *
     * @param route Route path, optionally with parameters or wildcards.
     * @param next Handler invoked for matching requests.
     * @returns The controller itself, for chaining.
     */
    get(route: string, next: AppHandler): IController;
    /**
     * Registers a handler for POST requests on a route. Routes containing ":" or "*" are also added to the
     * parameterized router. Throws if the route already exists as a post or any route.
     *
     * @param route Route path, optionally with parameters or wildcards.
     * @param next Handler invoked for matching requests.
     * @returns The controller itself, for chaining.
     */
    post(route: string, next: AppHandler): IController;
    /**
     * Registers a handler for any HTTP method on a route. Routes containing ":" or "*" are also added to
     * the parameterized router. Throws if the route already exists as a get, post or any route.
     *
     * @param route Route path, optionally with parameters or wildcards.
     * @param next Handler invoked for matching requests.
     * @returns The controller itself, for chaining.
     */
    any(route: string, next: AppHandler): IController;
    /**
     * Looks for a configured default document in the requested directory and renders the first one that
     * exists; otherwise responds with 404.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves when the response has been rendered or passed on as 404.
     */
    private passDefaultDocAsync;
    /**
     * Handles extension-less requests: serves a default document for directory paths, or, when a default
     * extension is configured, maps the path to a file with that extension and renders it. Falls back to
     * 404 or transfers error-code file names to the matching error page.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves once the request has been rendered or passed on.
     */
    private sendDefaultDocAsync;
    /**
     * Processes a GET request by trying, in order, an exact route handler, a parameterized route, template
     * rendering, mime-type file serving and default documents, responding 404 when none apply.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves when the request has been handled.
     */
    private processGetAsync;
    /**
     * Processes a POST request using an exact route handler or a parameterized route; responds 404 if none
     * matches.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves when the request has been handled.
     */
    private processPostAsync;
    /**
     * Dispatches a request: uses an exact any-route handler if present, otherwise delegates to GET or POST
     * processing by method, and responds 404 for other methods.
     *
     * @param ctx Current request context.
     * @returns A promise that resolves when the request has been handled.
     */
    processAny(ctx: IContext): Promise<void>;
    /**
     * Removes the route registered for the given path from the any, post or get table (first match found)
     * and from the parameterized router.
     *
     * @param path Route path to remove.
     * @returns True if a route was removed, false if none was registered.
     */
    remove(path: string): boolean;
    /**
     * Sorts the parameterized route list in place by ascending route length.
     */
    sort(): void;
}
