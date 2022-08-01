"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileInfoCacheHandler = exports.FileDescription = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:56 AM 8/1/2022
// by rajib chy
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
class FileDescription {
    constructor(exists, url, stats) {
        this._exists = exists;
        this._url = url;
        this._stats = stats;
    }
    get url() {
        return this._url;
    }
    get exists() {
        return this._exists;
    }
    get stats() {
        return this._stats;
    }
}
exports.FileDescription = FileDescription;
class FileInfoCacheHandler {
    constructor() {
        this._pathCache = {};
    }
    // statSync(path: string): IFileDescription {
    //     const info = this._pathCache[path];
    //     if (info) return info;
    //     const url = _path.resolve(path);
    //     const stat = _fs.statSync(url);
    //     let desc: FileDescription;
    //     if (!stat) {
    //         desc = new FileDescription(false, url);
    //     } else {
    //         desc = new FileDescription(true, url, stat);
    //     }
    //     return desc;
    // }
    // existsSync(path: string): boolean {
    //     const desc: IFileDescription = this.statSync(path);
    //     return desc.exists;
    // }
    stat(path, next, force) {
        // const _force: boolean = typeof (force) === "boolean" ? force : false;
        if (!force) {
            const info = this._pathCache[path];
            if (info)
                return next(info);
        }
        const url = _path.resolve(path);
        _fs.stat(url, (serr, stat) => {
            const exists = serr ? false : true;
            const desc = new FileDescription(exists, url, stat);
            this._pathCache[path] = desc;
            return next(desc);
        });
    }
    exists(path, next, force) {
        this.stat(path, (desc) => {
            return next(desc.exists, desc.url);
        }, force);
    }
}
exports.FileInfoCacheHandler = FileInfoCacheHandler;
//# sourceMappingURL=file-info.js.map