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
    readAsync(): Promise<Buffer>;
    saveAsSync(absPath: string): void;
    saveAsAsync(absPath: string): Promise<void>;
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    dispose(): void;
}
