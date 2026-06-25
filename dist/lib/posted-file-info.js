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
exports.PostedFileInfo = void 0;
// 10:11 PM 2/7/2026
// by rajib chy
const _fs = __importStar(require("node:fs"));
const fsw = __importStar(require("./fsw"));
const _fsp = _fs.promises;
class PostedFileInfo {
    constructor(disposition, fname, fileName, fcontentType, tempFile) {
        this._fileInfo = {
            contentDisposition: disposition,
            name: fname,
            fileName,
            contentType: fcontentType
        };
        this._isMoved = false;
        this._isDisposed = false;
        this._tempFile = tempFile;
    }
    changePath(path) {
        this._tempFile = path;
        this._isMoved = true;
    }
    getTempPath() {
        return this._tempFile;
    }
    getContentDisposition() {
        return this._fileInfo.contentDisposition;
    }
    getName() {
        return this._fileInfo.name;
    }
    getFileName() {
        return this._fileInfo.fileName;
    }
    getContentType() {
        return this._fileInfo.contentType;
    }
    validate(arg) {
        if (!this._tempFile || this._isMoved)
            throw new Error("This file already moved or not created yet.");
        return true;
    }
    readSync() {
        if (!this.validate(this._tempFile))
            return null;
        return _fs.readFileSync(this._tempFile);
    }
    read(next) {
        if (!this.validate(this._tempFile))
            return;
        return _fs.readFile(this._tempFile, next);
    }
    readAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.validate(this._tempFile))
                return null;
            return yield _fsp.readFile(this._tempFile);
        });
    }
    saveAsSync(absPath) {
        if (!this.validate(this._tempFile))
            return;
        _fs.copyFileSync(this._tempFile, absPath);
        _fs.unlinkSync(this._tempFile);
        delete this._tempFile;
        this._isMoved = true;
    }
    saveAsAsync(absPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.validate(this._tempFile))
                return;
            try {
                yield fsw.moveFileAsync(this._tempFile, absPath);
            }
            catch (_a) { }
            delete this._tempFile;
            this._isMoved = true;
        });
    }
    saveAs(absPath, next) {
        if (!this.validate(this._tempFile))
            return;
        fsw.moveFile(this._tempFile, absPath, (err) => {
            delete this._tempFile;
            this._isMoved = true;
            return next(err);
        });
    }
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        if (!this._isMoved && this._tempFile) {
            if (_fs.existsSync(this._tempFile))
                _fs.unlinkSync(this._tempFile);
        }
        // @ts-ignore
        delete this._fileInfo;
        delete this._tempFile;
    }
    clear() {
        this.dispose();
    }
}
exports.PostedFileInfo = PostedFileInfo;
//# sourceMappingURL=posted-file-info.js.map