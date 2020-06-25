/// <reference types="node" />
import { IRequest } from './sow-server-core';
import { IDispose } from './sow-static';
import { ErrorHandler } from './sow-fsw';
export declare type UploadFileInfo = {
    contentType: string;
    name: string;
    fileName: string;
    contentDisposition: string;
    tempPath: string | undefined;
};
export interface IPostedFileInfo extends IDispose {
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
export interface IBodyParser extends IDispose {
    isUrlEncoded(): boolean;
    isAppJson(): boolean;
    isMultipart(): boolean;
    isValidRequest(): boolean;
    saveAsSync(absPath: string): void;
    saveAs(outdir: string, next: (err: Error | NodeJS.ErrnoException | null) => void, errorHandler: ErrorHandler): void;
    getUploadFileInfo(): UploadFileInfo[];
    getFilesSync(next: (file: IPostedFileInfo) => void): void;
    getFiles(next: (file?: IPostedFileInfo, done?: () => void) => void): void;
    getJson(): NodeJS.Dict<string>;
    getData(): string;
    readData(onReadEnd: (err?: Error) => void): void;
    readDataAsync(): Promise<void>;
    /** @deprecated since v2.0.3 - use `dispose` instead. */
    clear(): void;
}
declare class BodyParser implements IBodyParser {
    private _contentType;
    private _contentTypeEnum;
    private _contentLength;
    private _parser;
    private _req;
    private _isReadEnd;
    private _isDisposed;
    private _part;
    private _multipartParser?;
    constructor(req: IRequest, tempDir?: string);
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
    getJson(): NodeJS.Dict<string>;
    getData(): string;
    readDataAsync(): Promise<void>;
    private tryFinish;
    private skipPart;
    private onPart;
    private finalEvent;
    readData(onReadEnd: (err?: Error) => void): void;
    dispose(): void;
    clear(): void;
}
/** @deprecated since v2.0.3 - use `getBodyParser` instead. */
export declare const PayloadParser: typeof BodyParser;
export declare function getBodyParser(req: IRequest, tempDir?: string): IBodyParser;
export {};
