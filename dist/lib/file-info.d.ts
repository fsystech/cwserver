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
    statAsync(path: string, force?: boolean): Promise<IFileDescription>;
    existsAsync(path: string, force?: boolean): Promise<{
        exists: boolean;
        url: string;
    }>;
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
export declare class FileInfoCacheHandler implements IFileInfoCacheHandler {
    private _pathCache;
    private _missCache;
    constructor();
    rmove(path: string): boolean;
    private _remember;
    statAsync(path: string, force?: boolean): Promise<IFileDescription>;
    /** @deprecated Use {@link statAsync} */
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void;
    existsAsync(path: string, force?: boolean): Promise<{
        exists: boolean;
        url: string;
    }>;
    /** @deprecated Use {@link existsAsync} */
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
