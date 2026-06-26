"use strict";
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileInfoCacheHandler = exports.FileDescription = void 0;
// 10:56 AM 8/1/2022
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const _fsp = _fs.promises;
class FileDescription {
    get url() {
        return this._url;
    }
    get exists() {
        return this._exists;
    }
    get stats() {
        return this._stats;
    }
    constructor(exists, url, stats) {
        this._exists = exists;
        this._url = url;
        this._stats = stats;
    }
}
exports.FileDescription = FileDescription;
class FileInfoCacheHandler {
    constructor() {
        this._pathCache = new Map();
    }
    rmove(path) {
        return this._pathCache.delete(path);
    }
    statAsync(path, force) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!force) {
                const info = this._pathCache.get(path);
                if (info)
                    return info;
            }
            const url = _path.resolve(path);
            try {
                const stat = yield _fsp.stat(url);
                const desc = new FileDescription(true, url, stat);
                this._pathCache.set(path, desc);
                return desc;
            }
            catch (_a) {
                const desc = new FileDescription(false, url, null);
                this._pathCache.set(path, desc);
                return desc;
            }
        });
    }
    stat(path, next, force) {
        this.statAsync(path, force).then(next);
    }
    existsAsync(path, force) {
        return __awaiter(this, void 0, void 0, function* () {
            const desc = yield this.statAsync(path, force);
            return {
                url: desc.url,
                exists: desc.exists
            };
        });
    }
    exists(path, next, force) {
        this.existsAsync(path, force).then(desc => {
            return next(desc.exists, desc.url);
        });
    }
}
exports.FileInfoCacheHandler = FileInfoCacheHandler;
//# sourceMappingURL=file-info.js.map