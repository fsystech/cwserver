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
    public get url() {
        return this._url;
    }
    public get exists() {
        return this._exists;
    }
    public get stats() {
        return this._stats;
    }
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

export class FileInfoCacheHandler implements IFileInfoCacheHandler {

    private _pathCache: Map<string, FileDescription>;

    constructor() {
        this._pathCache = new Map();
    }

    public rmove(path: string): boolean {
        return this._pathCache.delete(path);
    }

    public async statAsync(path: string, force?: boolean): Promise<IFileDescription> {
        if (!force) {
            const info = this._pathCache.get(path);
            if (info) return info;
        }

        const url = _path.resolve(path);

        try {
            const stat = await _fsp.stat(url);

            const desc = new FileDescription(
                true, url, stat
            );

            this._pathCache.set(path, desc);

            return desc;
        } catch {

            const desc = new FileDescription(
                false, url, null
            );

            this._pathCache.set(path, desc);

            return desc;
        }
    }

    public stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void {
        this.statAsync(path, force).then(next);
    }

    public async existsAsync(
        path: string, force?: boolean
    ): Promise<{ exists: boolean, url: string }> {
        const desc = await this.statAsync(path, force);

        return {
            url: desc.url,
            exists: desc.exists
        }
    }

    public exists(
        path: string, next: (exists: boolean, url: string) => void, force?: boolean
    ): void {

        this.existsAsync(path, force).then(desc => {
            return next(desc.exists, desc.url);
        });
    }
}