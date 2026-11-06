import { PartStream } from "./dicer";
import type { IPostedFileInfo } from "./posted-file-info";
import { type IDispose } from "./app-static";
export interface IDataParser extends IDispose {
    readonly files: IPostedFileInfo[];
    readonly body: Buffer;
    onRawData(buff: Buffer | string): void;
    getRawData(encoding?: BufferEncoding): string;
    onPart(stream: PartStream, next: (forceExit: boolean) => void, skipFile?: (fileInfo: IPostedFileInfo) => boolean): void;
    getError(): string | void;
    getMultipartBody(): {
        [id: string]: string;
    };
}
export declare class DataParser implements IDataParser {
    private _isDisposed;
    private _files;
    private _body;
    private _multipartBody;
    private _errors;
    private _tempDir;
    private _readers;
    /**
     * Gets the files uploaded in the multipart request.
     *
     * @returns The array of posted file info objects.
     */
    get files(): IPostedFileInfo[];
    /**
     * Gets the raw buffered request body.
     *
     * @returns A Buffer with the body data received so far.
     */
    get body(): Buffer;
    /**
     * Creates a data parser that collects raw data, multipart fields and uploaded files.
     *
     * @param tempDir Directory for temporary uploaded files.
     */
    constructor(tempDir: string);
    /**
     * Appends a chunk of raw body data to the buffer. Ignored once disposed.
     *
     * @param buff Chunk of data to append.
     */
    onRawData(buff: Buffer | string): void;
    /**
     * Returns the raw body text joined with any multipart fields as key=value pairs separated by
     * ampersands.
     *
     * @param encoding Optional text encoding used for the body.
     * @returns The combined string, or null if the parser is disposed.
     */
    getRawData(encoding?: BufferEncoding): string;
    /**
     * Gets the multipart text fields collected so far, with values URL-encoded.
     *
     * @returns An object mapping field names to encoded values, or null if disposed.
     */
    getMultipartBody(): {
        [id: string]: string;
    };
    /**
     * Processes one multipart part with a new reader, collecting its field or file and reporting
     * completion. Ignored if disposed.
     *
     * @param stream The multipart part stream.
     * @param next Callback called when the part finishes, with true if the reader forced an exit.
     * @param skipFile Optional predicate that returns true to skip a file.
     */
    onPart(stream: PartStream, next: (forceExit: boolean) => void, skipFile?: (fileInfo: IPostedFileInfo) => boolean): void;
    /**
     * Gets the errors collected during parsing as one message.
     *
     * @returns Error messages joined by newlines, or nothing if there were no errors; null if disposed.
     */
    getError(): string | void;
    /**
     * Disposes readers, files and buffers and clears state. Safe to call more than once.
     */
    dispose(): void;
}
