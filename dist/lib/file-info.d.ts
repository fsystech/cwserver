import * as _fs from 'node:fs';
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
    get stats(): _fs.Stats;
    constructor(exists: boolean, url: string, stats?: _fs.Stats);
}
export interface IFileInfoCacheHandler {
    rmove(path: string): boolean;
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void;
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
export declare class FileInfoCacheHandler implements IFileInfoCacheHandler {
    private _pathCache;
    constructor();
    rmove(path: string): boolean;
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void;
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
