// Copyright (c) 2022 FSys Tech Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 10:56 AM 8/1/2022
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
const _fsp = _fs.promises;

export interface IFileDescription {
    readonly url: string;
    readonly exists: boolean;
    readonly stats?: _fs.Stats;
}

export class FileDescription implements IFileDescription {
    private _url: string;
    private _exists: boolean;
    private _stats?: _fs.Stats;
    /**
     * Gets the resolved absolute path of the file.
     *
     * @returns The absolute path.
     */
    public get url() {
        return this._url;
    }
    /**
     * Gets whether the file exists.
     *
     * @returns True if the file exists.
     */
    public get exists() {
        return this._exists;
    }
    /**
     * Gets the file stats.
     *
     * @returns The Stats object, or null if the file does not exist.
     */
    public get stats() {
        return this._stats;
    }
    /**
     * Creates a file description result.
     *
     * @param exists Whether the file exists.
     * @param url Resolved file path.
     * @param stats Optional file stats.
     */
    constructor(exists: boolean, url: string, stats?: _fs.Stats) {
        this._exists = exists; this._url = url; this._stats = stats;
    }
}
export interface IFileInfoCacheHandler {
    rmove(path: string): boolean;

    stat(
        path: string, next: (desc: IFileDescription) => void, force?: boolean
    ): void;

    statAsync(
        path: string, force?: boolean
    ): Promise<IFileDescription>;

    existsAsync(
        path: string, force?: boolean
    ): Promise<{ exists: boolean, url: string }>;

    exists(
        path: string, next: (exists: boolean, url: string) => void, force?: boolean
    ): void;
}

/**
 * Maximum number of "file not found" results that are remembered.
 * Every unknown URL (scanners, typos, bots) would otherwise add a permanent
 * entry and grow the cache without bound.
 */
const MAX_NEGATIVE_ENTRIES = 1024;

export class FileInfoCacheHandler implements IFileInfoCacheHandler {

    private _pathCache: Map<string, FileDescription>;
    private _missCache: Map<string, FileDescription>;

    /**
     * Creates a file cache with empty hit and miss caches.
     */
    constructor() {
        this._pathCache = new Map();
        this._missCache = new Map();
    }

    /**
     * Removes a path from both the found and not-found caches.
     *
     * @param path Path key to remove.
     * @returns True if the path was in either cache.
     */
    public rmove(path: string): boolean {
        const hit = this._pathCache.delete(path);
        const miss = this._missCache.delete(path);
        return hit || miss;
    }

    /**
     * Stores a result in the cache: found files in the main cache, missing files in a bounded not-found
     * cache that evicts the oldest entry when full.
     *
     * @param path Cache key path.
     * @param desc File description to remember.
     */
    private _remember(path: string, desc: FileDescription): void {
        if (desc.exists) {
            this._missCache.delete(path);
            this._pathCache.set(path, desc);
            return;
        }

        this._pathCache.delete(path);

        if (this._missCache.size >= MAX_NEGATIVE_ENTRIES && !this._missCache.has(path)) {
            // Map keeps insertion order; drop the oldest entry
            this._missCache.delete(this._missCache.keys().next().value);
        }

        this._missCache.set(path, desc);
    }

    /**
     * Gets file details, using the cache unless forced, otherwise stats the file and caches the result.
     * Never rejects.
     *
     * @param path Path of the file to inspect.
     * @param force If true, bypasses the cache and stats again.
     * @returns A Promise resolving to a description with existence, resolved path and stats.
     */
    public async statAsync(path: string, force?: boolean): Promise<IFileDescription> {
        if (!force) {
            const info = this._pathCache.get(path) || this._missCache.get(path);
            if (info) return info;
        }

        const url = _path.resolve(path);

        try {
            const stat = await _fsp.stat(url);

            const desc = new FileDescription(
                true, url, stat
            );

            this._remember(path, desc);

            return desc;
        } catch {

            const desc = new FileDescription(
                false, url, null
            );

            this._remember(path, desc);

            return desc;
        }
    }

    /** @deprecated Use {@link statAsync} */
    public stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void {
        this.statAsync(path, force).then(next);
    }

    /**
     * Checks whether a file exists, using the cache unless forced.
     *
     * @param path Path of the file to check.
     * @param force If true, bypasses the cache.
     * @returns A Promise resolving to an object with exists and the resolved url.
     */
    public async existsAsync(
        path: string, force?: boolean
    ): Promise<{ exists: boolean, url: string }> {
        const desc = await this.statAsync(path, force);

        return {
            url: desc.url,
            exists: desc.exists
        };
    }

    /** @deprecated Use {@link existsAsync} */
    public exists(
        path: string, next: (exists: boolean, url: string) => void, force?: boolean
    ): void {

        this.existsAsync(path, force).then(desc => {
            return next(desc.exists, desc.url);
        });
    }
}