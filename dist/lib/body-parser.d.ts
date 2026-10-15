import type { IRequest } from './request';
import { type IDispose, type ErrorHandler } from './app-static';
import { type IPostedFileInfo } from './posted-file-info';
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
    getJson(): Record<string, any>;
    getData(): string;
    parse(onReadEnd: (err?: Error) => void): void;
    parseAsync(): Promise<void>;
    getFilesAsync(next: (file: IPostedFileInfo) => Promise<void>): Promise<void>;
    /** @deprecated since v4.1.2 - use `parseAsync` instead. */
    parseSync(): Promise<void>;
}
export declare function decodeBodyBuffer(buff: Buffer): Record<string, string>;
export declare function getBodyParser(req: IRequest, tempDir?: string): IBodyParser;
