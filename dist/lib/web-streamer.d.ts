import { Stats } from 'node:fs';
import type { IContext } from './context';
export declare class Streamer {
    /**
     * Streams a file to the response, honouring an HTTP Range header with a 206 partial response,
     * otherwise sending the whole file with 200. Calls the context's next handler when the stream
     * finishes.
     *
     * @param ctx Request context for the current request.
     * @param absPath Absolute path of the file to stream.
     * @param mimeType Content-Type value to send.
     * @param fstat File stats, used for the total size.
     */
    static stream(ctx: IContext, absPath: string, mimeType: string, fstat: Stats): void;
}
