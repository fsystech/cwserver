import './app-global';
import { Server } from 'node:http';
import { type IRequestParam } from './app-router';
import { type IRequest } from './request';
import { type IResponse } from './response';
type onError = (req: IRequest, res: IResponse, err?: Error | number) => void;
export type NextFunction = (err?: any) => void;
export type HandlerFunc = (req: IRequest, res: IResponse, next: NextFunction, requestParam?: IRequestParam) => void;
export interface IApplication {
    readonly version: string;
    readonly httpServer: Server;
    readonly isRunning: boolean;
    /**
     * Clears all registered handlers in the application.
     *
     * This includes:
     * 1. Route-specific handlers.
     * 2. Global middlewares.
     * 3. Prerequisite handlers.
     *
     * After calling this method, the application will have no active routes,
     * middlewares, or prerequisites.
     */
    clearHandler(): void;
    /**
     * Registers a global middleware handler.
     *
     * The middleware function is executed for every incoming request, in the order it was added.
     *
     * @param {HandlerFunc} handler - The middleware function to execute for each request.
     * @returns {IApplication} The application instance for chaining.
     */
    use(handler: HandlerFunc): IApplication;
    /**
     * Registers a route-specific handler.
     *
     * The handler is executed only when the request matches the specified route.
     * Optionally, the route can be marked as "virtual" to alter routing behavior.
     *
     * @param {string} route - The path of the route to handle.
     * @param {HandlerFunc} handler - The function to execute for requests matching the route.
     * @param {boolean} [isVirtual=false] - Optional flag to mark the route as virtual.
     * @returns {IApplication} The application instance for chaining.
     */
    use(route: string, handler: HandlerFunc, isVirtual?: boolean): IApplication;
    /**
     * Registers a prerequisite handler executed before route handlers and middlewares.
     *
     * @param {HandlerFunc} handler - Function to be executed for every request before routing.
     * @returns {IApplication} Returns the application instance for chaining.
     * @throws {Error} Throws if the handler is not a function.
     */
    prerequisites(handler: (req: IRequest, res: IResponse, next: NextFunction) => void): IApplication;
    /**
     * Initiates server shutdown and calls the provided callback when done.
     *
     * Emits the 'shutdown' event immediately, then gracefully shuts down the server.
     * Any errors during shutdown are passed to the callback.
     *
     * @param {(err?: Error) => void} next - Callback invoked when shutdown completes or errors.
     */
    shutdown(next: (err?: Error) => void): Promise<void> | void;
    /**
     * Initiates server shutdown and returns a promise.
     *
     * Emits the 'shutdown' event immediately, then gracefully shuts down the server.
     * The returned promise resolves when shutdown completes, or rejects if an error occurs.
     *
     * @returns {Promise<void>} Resolves when server shutdown completes successfully.
     */
    shutdownAsync(): Promise<void>;
    on(ev: 'request-begain', handler: (req: IRequest) => void): IApplication;
    on(ev: 'response-end', handler: (req: IRequest, res: IResponse) => void): IApplication;
    on(ev: 'error', handler: onError): IApplication;
    on(ev: 'shutdown', handler: () => void): IApplication;
    listen(handle: any, listeningListener?: () => void): IApplication;
}
export declare const appVersion: string, readAppVersion: () => string;
/**
 * Initializes and returns the main application instance.
 *
 * This function performs the following steps:
 * 1. Injects custom prototypes for Request and Response objects.
 * 2. Creates an HTTP server and wraps it in the Application class.
 * 3. Sets headers for every response and tracks response lifecycle.
 * 4. Emits application-level events such as:
 *    - 'request-begain' when a request starts (optional)
 *    - 'response-end' when a response closes
 *    - 'error' on any handler error
 *
 * @param {boolean} [useRequestBegain=true] - Whether to emit 'request-begain' for incoming requests.
 * @returns {IApplication} The initialized Application instance.
 */
export declare function App(useRequestBegain?: boolean): IApplication;
export {};
