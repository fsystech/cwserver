// Copyright (c) 2022 Safe Online World Ltd.
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
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void;
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
export class FileInfoCacheHandler implements IFileInfoCacheHandler {
    private _pathCache: NodeJS.Dict<FileDescription>;
    constructor() {
        this._pathCache = {};
    }
    rmove(path: string): boolean {
        if (this._pathCache[path]) {
            delete this._pathCache[path];
            return true;
        }
        return false;
    }
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void {
        if (!force) {
            const info = this._pathCache[path];
            if (info) return process.nextTick(() => next(info));
        }
        const url = _path.resolve(path);
        _fs.stat(url, (serr?: NodeJS.ErrnoException | null, stat?: _fs.Stats): void => {
            const exists: boolean = serr ? false : true;
            const desc = new FileDescription(exists, url, stat);
            this._pathCache[path] = desc;
            return next(desc);
        });
    }
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void {
        this.stat(path, (desc: IFileDescription) => {
            return next(desc.exists, desc.url);
        }, force);
    }
}