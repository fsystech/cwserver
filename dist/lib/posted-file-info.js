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
    /**
     * Creates a description of an uploaded file and its temporary location.
     *
     * @param disposition Content-Disposition header value.
     * @param fname Form field name.
     * @param fileName Original file name sent by the client.
     * @param fcontentType File content type.
     * @param tempFile Path of the temporary file on disk.
     */
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
    /**
     * Points the file to a new path and marks it as moved, so it is no longer deleted on dispose.
     *
     * @param path New file path.
     */
    changePath(path) {
        this._tempFile = path;
        this._isMoved = true;
    }
    /**
     * Gets the temporary file path.
     *
     * @returns The path, or undefined or null if not available.
     */
    getTempPath() {
        return this._tempFile;
    }
    /**
     * Gets the Content-Disposition header value of the part.
     *
     * @returns The content disposition string.
     */
    getContentDisposition() {
        return this._fileInfo.contentDisposition;
    }
    /**
     * Gets the form field name of the upload.
     *
     * @returns The field name.
     */
    getName() {
        return this._fileInfo.name;
    }
    /**
     * Gets the original file name provided by the client.
     *
     * @returns The file name.
     */
    getFileName() {
        return this._fileInfo.fileName;
    }
    /**
     * Gets the content type of the upload.
     *
     * @returns The content type string.
     */
    getContentType() {
        return this._fileInfo.contentType;
    }
    /**
     * Checks that the temp file exists and has not been moved. Throws an Error otherwise.
     *
     * @param arg Value to check, normally the temp file path (not inspected).
     * @returns True when the file is available.
     */
    validate(arg) {
        if (!this._tempFile || this._isMoved)
            throw new Error("This file already moved or not created yet.");
        return true;
    }
    /**
     * Synchronously reads the temporary file. Throws if the file was moved or not created.
     *
     * @returns A Buffer with the file contents.
     */
    readSync() {
        if (!this.validate(this._tempFile))
            return null;
        return _fs.readFileSync(this._tempFile);
    }
    /** @deprecated Use {@link readAsync} */
    read(next) {
        if (!this.validate(this._tempFile))
            return;
        _fsp.readFile(this._tempFile).then((data) => next(null, data), (err) => next(err, null));
    }
    /**
     * Reads the temporary file asynchronously. Throws if the file was moved or not created.
     *
     * @returns A Promise resolving to a Buffer with the file contents.
     */
    readAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.validate(this._tempFile))
                return null;
            return yield _fsp.readFile(this._tempFile);
        });
    }
    /**
     * Synchronously moves the temp file to the given path by copying then deleting it, and marks it as
     * moved. Throws if already moved.
     *
     * @param absPath Absolute destination path.
     */
    saveAsSync(absPath) {
        if (!this.validate(this._tempFile))
            return;
        _fs.copyFileSync(this._tempFile, absPath);
        _fs.unlinkSync(this._tempFile);
        this._tempFile = null;
        this._isMoved = true;
    }
    /**
     * Asynchronously moves the temp file to the given path and marks it as moved. Move errors are
     * swallowed; throws if already moved.
     *
     * @param absPath Absolute destination path.
     * @returns A Promise that resolves when the move attempt is done.
     */
    saveAsAsync(absPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.validate(this._tempFile))
                return;
            try {
                yield fsw.moveFileAsync(this._tempFile, absPath);
            }
            catch (_a) { }
            this._tempFile = null;
            this._isMoved = true;
        });
    }
    /** @deprecated Use {@link saveAsAsync} */
    saveAs(absPath, next) {
        if (!this.validate(this._tempFile))
            return;
        fsw.moveFileAsync(this._tempFile, absPath).then(() => null, (err) => err).then((err) => {
            this._tempFile = null;
            this._isMoved = true;
            return next(err);
        });
    }
    /**
     * Releases the file info, deleting the temp file if it was not moved. Safe to call more than once.
     */
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        if (!this._isMoved && this._tempFile) {
            if (_fs.existsSync(this._tempFile))
                _fs.unlinkSync(this._tempFile);
        }
        this._fileInfo = null;
        this._tempFile = null;
    }
}
exports.PostedFileInfo = PostedFileInfo;
//# sourceMappingURL=posted-file-info.js.map