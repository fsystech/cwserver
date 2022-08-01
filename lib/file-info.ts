/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:56 AM 8/1/2022
// by rajib chy
import * as _fs from 'fs';
import * as _path from 'path';
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
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void;
    exists(path: string, next: (exists: boolean, url: string) => void, force?: boolean): void;
}
export class FileInfoCacheHandler implements IFileInfoCacheHandler {
    private _pathCache: NodeJS.Dict<FileDescription>;
    constructor() {
        this._pathCache = {};
    }
    stat(path: string, next: (desc: IFileDescription) => void, force?: boolean): void {
        if (!force) {
            const info = this._pathCache[path];
            if (info) return next(info);
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