import { EventEmitter } from 'node:events';
import { PartStream } from "./dicer";
import { type IDispose } from "./app-static";
import { type IPostedFileInfo } from "./posted-file-info";
export interface IMultipartDataReader extends IDispose {
    readonly forceExit: boolean;
    skipFile(fileInfo: IPostedFileInfo): boolean;
    read(stream: PartStream, tempDir: string): void;
    on(ev: "field", handler: (key: string, buff: string) => void): IMultipartDataReader;
    on(ev: "file", handler: (file: IPostedFileInfo) => void): IMultipartDataReader;
    on(ev: "end", handler: (err?: Error) => void): IMultipartDataReader;
}
export declare class MultipartDataReader extends EventEmitter implements IMultipartDataReader {
    private _forceExit;
    private _writeStream?;
    private _isDisposed;
    /**
     * Whether the reader aborted early because of an error.
     *
     * @returns True if a forced exit occurred.
     */
    get forceExit(): boolean;
    /**
     * Creates a multipart part reader in its initial state.
     */
    constructor();
    /**
     * Destroys the temporary file write stream if it is still open.
     */
    private destroy;
    /**
     * Marks a forced exit and emits an 'end' event with an error built from the reason.
     *
     * @param reason Message of the error to emit.
     */
    private exit;
    /**
     * Default hook deciding whether to skip an uploaded file; it never skips. DataParser may replace it.
     *
     * @param fileInfo Information about the file being uploaded.
     * @returns False, meaning the file is kept.
     */
    skipFile(fileInfo: IPostedFileInfo): boolean;
    /**
     * Reads one multipart part. After the header arrives it determines field or file; fields are buffered
     * and emitted as 'field', files are streamed to a temp file and emitted as 'file'. Emits 'end' when
     * done or with an error for missing name, filename or content type.
     *
     * @param stream The multipart part stream to read.
     * @param tempDir Directory where uploaded file contents are written temporarily.
     */
    read(stream: PartStream, tempDir: string): void;
    /**
     * Removes all listeners, destroys the write stream and clears state. Safe to call more than once.
     */
    dispose(): void;
}
