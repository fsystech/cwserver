/// <reference types="node" />
import { IRequest } from './sow-server-core';
export interface IPostedFileInfo {
    getContentDisposition(): string;
    getFileSize(): number;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    saveAs(absPath: string): void;
    read(): Buffer;
    getTempPath(): string | undefined;
    setInfo(tempFile?: string, fileSize?: number): void;
    isEmptyHeader(): boolean;
    clear(): void;
}
export interface IPayloadParser {
    isUrlEncoded(): boolean;
    isMultipart(): boolean;
    isValidRequest(): boolean;
    getFiles(next: (file: IPostedFileInfo) => void): void;
    getData(): string;
    readData(onReadEnd: (err?: Error | string) => void): void;
    readDataAsync(): Promise<void>;
}
export declare enum ContentType {
    URL_ENCODE = 1,
    MULTIPART = 2,
    UNKNOWN = -1
}
export declare class PostedFileInfo implements IPostedFileInfo {
    _fcontentDisposition: string;
    _fname: string;
    _fileName: string;
    _fcontentType: string;
    _fileSize: number;
    _isMoved: boolean;
    _tempFile?: string;
    _isDisposed: boolean;
    constructor(disposition: string, fname: string, fileName: string, fcontentType: string);
    setInfo(tempFile?: string, fileSize?: number): void;
    isEmptyHeader(): boolean;
    getTempPath(): string | undefined;
    getContentDisposition(): string;
    getFileSize(): number;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    read(): Buffer;
    saveAs(absPath: string): void;
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
    private _clientConnected;
    constructor(req: IRequest, tempDir: string);
    isUrlEncoded(): boolean;
    isMultipart(): boolean;
    isValidRequest(): boolean;
    saveAs(outdir: string): void;
    getFiles(next: (file: IPostedFileInfo) => void): void;
    getJson(): {
        [key: string]: any;
    };
    getData(): string;
    readDataAsync(): Promise<void>;
    readData(onReadEnd: (err?: Error | string) => void): void;
    clear(): void;
}