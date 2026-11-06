import type { IContext } from './context';
export interface IHttpMimeHandler {
    renderAsync(ctx: IContext, maybeDir?: string): Promise<void>;
    getMimeType(extension: string): string;
    isValidExtension(extension: string): boolean;
}
export declare class HttpMimeHandler implements IHttpMimeHandler {
    /**
     * Looks up the MIME type for a file extension, adding a UTF-8 charset for text and JS/JSON types.
     * Throws when the extension is unsupported.
     *
     * @param extension File extension or file name to look up.
     * @returns The MIME type string.
     */
    getMimeType(extension: string): string;
    /**
     * Checks whether a MIME type is registered for the given extension.
     *
     * @param extension Extension to check (without a leading dot).
     * @returns True if the extension is supported, otherwise false.
     */
    isValidExtension(extension: string): boolean;
    /**
     * Serves the static file for the current request with the MIME type matching its extension. Transfers
     * a 404 when the extension is not supported.
     *
     * @param ctx Request context for the current request.
     * @param maybeDir Optional base directory to resolve the request path against.
     * @returns Promise that resolves when the response has been handled.
     */
    renderAsync(ctx: IContext, maybeDir?: string): Promise<void>;
}
