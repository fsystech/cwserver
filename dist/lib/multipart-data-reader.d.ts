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
    get forceExit(): boolean;
    constructor();
    private destroy;
    private exit;
    skipFile(fileInfo: IPostedFileInfo): boolean;
    read(stream: PartStream, tempDir: string): void;
    dispose(): void;
}
