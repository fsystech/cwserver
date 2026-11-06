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
    /**
     * Gets the resolved absolute path of the file.
     *
     * @returns The absolute path.
     */
    get url(): string;
    /**
     * Gets whether the file exists.
     *
     * @returns True if the file exists.
     */
    get exists(): boolean;
    /**
     * Gets the file stats.
     *
     * @returns The Stats object, or null if the file does not exist.
     */
    get stats(): _fs.Stats;
    /**
     * Creates a file description result.
     *
     * @param exists Whether the file exists.
     * @param url Resolved file path.
     * @param stats Optional file stats.
     */
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
    /**
     * Creates a file cache with empty hit and miss caches.
     */
    constructor();
    /**
     * Removes a path from both the found and not-found caches.
     *
     * @param path Path key to remove.
     * @returns True if the path was in either cache.
     */
    rmove(path: string): boolean;
    /**
     * Stores a result in the cache: found files in the main cache, missing files in a bounded not-found
     * cache that evicts the oldest entry when full.
     *
     * @param path Cache key path.
     * @param desc File description to remember.
     */
    private _remember;
    /**
     * Gets file details, using the cache unless forced, otherwise stats the file and caches the result.
     * Never rejects.
     *
     * @param path Path of the file to inspect.
     * @param force If true, bypasses the cache and stats again.
     * @returns A Promise resolving to a description with existence, resolved path and stats.
     */
    statAsync(path: string, force?: boolean): Promise<IFileDescription>;
    /** @deprecated Use {@link statAsync} */
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void;
    /**
     * Checks whether a file exists, using the cache unless forced.
     *
     * @param path Path of the file to check.
     * @param force If true, bypasses the cache.
     * @returns A Promise resolving to an object with exists and the resolved url.
     */
    existsAsync(path: string, force?: boolean): Promise<{
        exists: boolean;
        url: string;
    }>;
    /** @deprecated Use {@link existsAsync} */
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
