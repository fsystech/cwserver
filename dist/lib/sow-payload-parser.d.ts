/// <reference types="node" />
import { IRequest } from './sow-server-core';
import { ErrorHandler } from './sow-fsw';
export declare type UploadFileInfo = {
    contentType: string;
    name: string;
    fileName: string;
    contentDisposition: string;
    fileSize: number;
    tempPath: string | undefined;
};
export interface IPostedFileInfo {
    getContentDisposition(): string;
    getFileSize(): number;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    saveAsSync(absPath: string): void;
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    readSync(): Buffer;
    read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void;
    getTempPath(): string | undefined;
    setInfo(tempFile?: string, fileSize?: number): void;
    isEmptyHeader(): boolean;
    clear(): void;
}
export interface IPayloadParser {
    isUrlEncoded(): boolean;
    isAppJson(): boolean;
    isMultipart(): boolean;
    isValidRequest(): boolean;
    saveAsSync(absPath: string): void;
    saveAs(outdir: string, next: (err: Error | NodeJS.ErrnoException | null) => void, errorHandler: ErrorHandler): void;
    getUploadFileInfo(): UploadFileInfo[];
    getFilesSync(next: (file: IPostedFileInfo) => void): void;
    getFiles(next: (file?: IPostedFileInfo, done?: () => void) => void): void;
    getData(): string;
    readData(onReadEnd: (err?: Error | string) => void): void;
    readDataAsync(): Promise<void>;
}
export declare enum ContentType {
    URL_ENCODE = 1,
    APP_JSON = 2,
    MULTIPART = 3,
    UNKNOWN = -1
}
export declare class PostedFileInfo implements IPostedFileInfo {
    private _fcontentDisposition;
    private _fname;
    private _fileName;
    private _fcontentType;
    private _fileSize;
    private _isMoved;
    private _tempFile?;
    private _isDisposed;
    constructor(disposition: string, fname: string, fileName: string, fcontentType: string);
    setInfo(tempFile?: string, fileSize?: number): void;
    isEmptyHeader(): boolean;
    getTempPath(): string | undefined;
    getContentDisposition(): string;
    getFileSize(): number;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    private validate;
    readSync(): Buffer;
    read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void;
    saveAsSync(absPath: string): void;
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    clear(): void;
}
export declare class PayloadParser implements IPayloadParser {
    private _contentType;
    private _contentTypeEnum;
    private _contentLength;
    private _payloadDataParser;
    private _req;
    private _isReadEnd;
    private _isDisposed;
    private _isConnectionActive;
    constructor(req: IRequest, tempDir: string);
    isUrlEncoded(): boolean;
    isAppJson(): boolean;
    isMultipart(): boolean;
    isValidRequest(): boolean;
    private validate;
    saveAsSync(outdir: string): void;
    saveAs(outdir: string, next: (err: Error | NodeJS.ErrnoException | null) => void, errorHandler: ErrorHandler): void;
    getUploadFileInfo(): UploadFileInfo[];
    getFilesSync(next: (file: IPostedFileInfo) => void): void;
    getFiles(next: (file?: IPostedFileInfo, done?: () => void) => void): void;
    getJson(): {
        [key: string]: any;
    };
    getData(): string;
    readDataAsync(): Promise<void>;
    readData(onReadEnd: (err?: Error | string) => void): void;
    clear(): void;
}
