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

// 10:11 PM 2/7/2026
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import * as fsw from './fsw';
import type { IDispose } from './app-static';

export type FileInfo = {
    contentDisposition: string;
    name: string;
    fileName: string;
    contentType: string;
}

export interface IPostedFileInfo extends IDispose {
    changePath(path: string): void;
    getContentDisposition(): string;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    saveAsSync(absPath: string): void;
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    readSync(): Buffer;
    read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void;
    getTempPath(): string | undefined;
    /** @deprecated since v2.0.3 - use `dispose` instead. */
    clear(): void;
}

export class PostedFileInfo implements IPostedFileInfo {
    private _fileInfo: FileInfo;
    private _isMoved: boolean;
    private _tempFile?: string;
    private _isDisposed: boolean;
    constructor(
        disposition: string,
        fname: string,
        fileName: string,
        fcontentType: string,
        tempFile: string
    ) {
        this._fileInfo = {
            contentDisposition: disposition,
            name: fname,
            fileName,
            contentType: fcontentType
        };
        this._isMoved = false; this._isDisposed = false;
        this._tempFile = tempFile;
    }

    public changePath(path: string): void {
        this._tempFile = path;
        this._isMoved = true;
    }

    public getTempPath(): string | undefined {
        return this._tempFile;
    }

    public getContentDisposition(): string {
        return this._fileInfo.contentDisposition;
    }

    public getName(): string {
        return this._fileInfo.name;
    }

    public getFileName(): string {
        return this._fileInfo.fileName;
    }

    public getContentType(): string {
        return this._fileInfo.contentType;
    }

    private validate(arg: any): arg is string {
        if (!this._tempFile || this._isMoved)
            throw new Error("This file already moved or not created yet.");
        return true;
    }

    public readSync(): Buffer {
        if (!this._tempFile || this._isMoved)
            throw new Error("This file already moved or not created yet.");
        return _fs.readFileSync(this._tempFile);
    }

    public read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void {
        if (this.validate(this._tempFile))
            return _fs.readFile(this._tempFile, next);
    }

    public saveAsSync(absPath: string): void {
        if (this.validate(this._tempFile)) {
            _fs.copyFileSync(this._tempFile, absPath);
            _fs.unlinkSync(this._tempFile);
            delete this._tempFile;
            this._isMoved = true;
        }
    }

    public saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void {
        if (this.validate(this._tempFile)) {
            fsw.moveFile(this._tempFile, absPath, (err) => {
                delete this._tempFile;
                this._isMoved = true;
                return next(err);
            });
        }
    }

    public dispose(): void {
        if (this._isDisposed) return;
        this._isDisposed = true;
        if (!this._isMoved && this._tempFile) {
            if (_fs.existsSync(this._tempFile))
                _fs.unlinkSync(this._tempFile);
        }
        // @ts-ignore
        delete this._fileInfo;
        delete this._tempFile;
    }

    public clear(): void {
        this.dispose();
    }
}