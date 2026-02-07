import type { IRequest } from './request';
import { IDispose, ErrorHandler } from './app-static';
export type UploadFileInfo = {
    contentType: string;
    name: string;
    fileName: string;
    contentDisposition: string;
    tempPath: string | undefined;
};
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
export interface IBodyParser extends IDispose {
    /** If you return true, this file will be skip */
    skipFile?: (fileInfo: IPostedFileInfo) => boolean;
    isUrlEncoded(): boolean;
    isAppJson(): boolean;
    isMultipart(): boolean;
    isRawData(): boolean;
    isValidRequest(): boolean;
    saveAsSync(absPath: string): void;
    /**
     * Default Urlencoded max length 20971520 (20mb)
     * You can override between this length
     */
    setMaxBuffLength(length: number): IBodyParser;
    saveAs(outdir: string, next: (err: Error | NodeJS.ErrnoException | null) => void, errorHandler: ErrorHandler): void;
    getUploadFileInfo(): UploadFileInfo[];
    getFilesSync(next: (file: IPostedFileInfo) => void): void;
    getFiles(next: (file?: IPostedFileInfo, done?: () => void) => void): void;
    getJson(): NodeJS.Dict<any>;
    getData(): string;
    parse(onReadEnd: (err?: Error) => void): void;
    parseSync(): Promise<void>;
    /** @deprecated since v2.0.3 - use `parse` instead. */
    readData(onReadEnd: (err?: Error) => void): void;
    /** @deprecated since v2.0.3 - use `parseSync` instead. */
    readDataAsync(): Promise<void>;
    /** @deprecated since v2.0.3 - use `dispose` instead. */
    clear(): void;
}
export declare function decodeBodyBuffer(buff: Buffer): NodeJS.Dict<string>;
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
    private _maxBuffLength;
    skipFile?: (fileInfo: IPostedFileInfo) => boolean;
    constructor(req: IRequest, tempDir?: string);
    setMaxBuffLength(length: number): IBodyParser;
    isUrlEncoded(): boolean;
    isAppJson(): boolean;
    isMultipart(): boolean;
    isRawData(): boolean;
    isValidRequest(): boolean;
    private validate;
    saveAsSync(outdir: string): void;
    saveAs(outdir: string, next: (err: Error | NodeJS.ErrnoException | null) => void, errorHandler: ErrorHandler): void;
    getUploadFileInfo(): UploadFileInfo[];
    getFilesSync(next: (file: IPostedFileInfo) => void): void;
    getFiles(next: (file?: IPostedFileInfo, done?: () => void) => void): void;
    getJson(): NodeJS.Dict<any>;
    getData(): string;
    readDataAsync(): Promise<void>;
    parseSync(): Promise<void>;
    private tryFinish;
    private skipPart;
    private onPart;
    private finalEvent;
    parse(onReadEnd: (err?: Error) => void): void;
    readData(onReadEnd: (err?: Error) => void): void;
    dispose(): void;
    clear(): void;
}
/** @deprecated since v2.0.3 - use `getBodyParser` instead. */
export declare const PayloadParser: typeof BodyParser;
export declare function getBodyParser(req: IRequest, tempDir?: string): IBodyParser;
export {};
