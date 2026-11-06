import type { IDispose } from './app-static';
export type FileInfo = {
    contentDisposition: string;
    name: string;
    fileName: string;
    contentType: string;
};
export interface IPostedFileInfo extends IDispose {
    changePath(path: string): void;
    getContentDisposition(): string;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    saveAsSync(absPath: string): void;
    saveAsAsync(absPath: string): Promise<void>;
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    readSync(): Buffer;
    readAsync(): Promise<Buffer>;
    read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void;
    getTempPath(): string | undefined;
}
export declare class PostedFileInfo implements IPostedFileInfo {
    private _fileInfo;
    private _isMoved;
    private _tempFile?;
    private _isDisposed;
    /**
     * Creates a description of an uploaded file and its temporary location.
     *
     * @param disposition Content-Disposition header value.
     * @param fname Form field name.
     * @param fileName Original file name sent by the client.
     * @param fcontentType File content type.
     * @param tempFile Path of the temporary file on disk.
     */
    constructor(disposition: string, fname: string, fileName: string, fcontentType: string, tempFile: string);
    /**
     * Points the file to a new path and marks it as moved, so it is no longer deleted on dispose.
     *
     * @param path New file path.
     */
    changePath(path: string): void;
    /**
     * Gets the temporary file path.
     *
     * @returns The path, or undefined or null if not available.
     */
    getTempPath(): string | undefined;
    /**
     * Gets the Content-Disposition header value of the part.
     *
     * @returns The content disposition string.
     */
    getContentDisposition(): string;
    /**
     * Gets the form field name of the upload.
     *
     * @returns The field name.
     */
    getName(): string;
    /**
     * Gets the original file name provided by the client.
     *
     * @returns The file name.
     */
    getFileName(): string;
    /**
     * Gets the content type of the upload.
     *
     * @returns The content type string.
     */
    getContentType(): string;
    /**
     * Checks that the temp file exists and has not been moved. Throws an Error otherwise.
     *
     * @param arg Value to check, normally the temp file path (not inspected).
     * @returns True when the file is available.
     */
    private validate;
    /**
     * Synchronously reads the temporary file. Throws if the file was moved or not created.
     *
     * @returns A Buffer with the file contents.
     */
    readSync(): Buffer;
    /** @deprecated Use {@link readAsync} */
    read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void;
    /**
     * Reads the temporary file asynchronously. Throws if the file was moved or not created.
     *
     * @returns A Promise resolving to a Buffer with the file contents.
     */
    readAsync(): Promise<Buffer>;
    /**
     * Synchronously moves the temp file to the given path by copying then deleting it, and marks it as
     * moved. Throws if already moved.
     *
     * @param absPath Absolute destination path.
     */
    saveAsSync(absPath: string): void;
    /**
     * Asynchronously moves the temp file to the given path and marks it as moved. Move errors are
     * swallowed; throws if already moved.
     *
     * @param absPath Absolute destination path.
     * @returns A Promise that resolves when the move attempt is done.
     */
    saveAsAsync(absPath: string): Promise<void>;
    /** @deprecated Use {@link saveAsAsync} */
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    /**
     * Releases the file info, deleting the temp file if it was not moved. Safe to call more than once.
     */
    dispose(): void;
}
