/// <reference types="node" />
import * as _fs from 'fs';
export interface IFileDescription {
    readonly url: string;
    readonly exists: boolean;
    readonly stats?: _fs.Stats;
}
export declare class FileDescription implements IFileDescription {
    private _url;
    private _exists;
    private _stats?;
    get url(): string;
    get exists(): boolean;
    get stats(): _fs.Stats | undefined;
    constructor(exists: boolean, url: string, stats?: _fs.Stats);
}
export interface IFileInfoCacheHandler {
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void;
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
export declare class FileInfoCacheHandler implements IFileInfoCacheHandler {
    private _pathCache;
    constructor();
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void;
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
