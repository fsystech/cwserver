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
    private _files;
    private _body;
    private _multipartBody;
    private _errors;
    private _tempDir;
    private _readers;
    get files(): IPostedFileInfo[];
    get body(): Buffer;
    constructor(tempDir: string);
    onRawData(buff: Buffer | string): void;
    getRawData(encoding?: BufferEncoding): string;
    getMultipartBody(): {
        [id: string]: string;
    };
    onPart(stream: PartStream, next: (forceExit: boolean) => void, skipFile?: (fileInfo: IPostedFileInfo) => boolean): void;
    getError(): string | void;
    dispose(): void;
}
