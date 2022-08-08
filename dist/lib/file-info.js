"use strict";
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
    stat(path, next, force) {
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