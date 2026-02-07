/**
 * Injects custom `Request` and `Response` functionality into Node.js HTTP core
 * objects (`IncomingMessage` and `ServerResponse`) globally.
 *
 * This should be called once during server startup (before creating the HTTP server).
 *
 * @example
 * injectIncomingOutgoing();
 * const server = createServer(...);
 */
export declare function injectIncomingOutgoing(): void;
