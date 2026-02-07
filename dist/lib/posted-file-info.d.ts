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
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    readSync(): Buffer;
    read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void;
    getTempPath(): string | undefined;
    /** @deprecated since v2.0.3 - use `dispose` instead. */
    clear(): void;
}
export declare class PostedFileInfo implements IPostedFileInfo {
    private _fileInfo;
    private _isMoved;
    private _tempFile?;
    private _isDisposed;
    constructor(disposition: string, fname: string, fileName: string, fcontentType: string, tempFile: string);
    changePath(path: string): void;
    getTempPath(): string | undefined;
    getContentDisposition(): string;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    private validate;
    readSync(): Buffer;
    read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void;
    saveAsSync(absPath: string): void;
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    dispose(): void;
    clear(): void;
}
