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

const _fsp = _fs.promises;

export type FileInfo = {
    contentDisposition: string;
    name: string;
    fileName: string;
    contentType: string;
};

export interface IPostedFileInfo extends IDispose {
    changePath(path: string): void;
    getContentDisposition(): string;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    saveAsSync(absPath: string): void;
    saveAsAsync(absPath: string): Promise<void>;
    saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void;
    readSync(): Buffer;
    readAsync(): Promise<Buffer>;
    read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void;
    getTempPath(): string | undefined;
}

export class PostedFileInfo implements IPostedFileInfo {
    private _fileInfo: FileInfo;
    private _isMoved: boolean;
    private _tempFile?: string;
    private _isDisposed: boolean;
    /**
     * Creates a description of an uploaded file and its temporary location.
     *
     * @param disposition Content-Disposition header value.
     * @param fname Form field name.
     * @param fileName Original file name sent by the client.
     * @param fcontentType File content type.
     * @param tempFile Path of the temporary file on disk.
     */
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

    /**
     * Points the file to a new path and marks it as moved, so it is no longer deleted on dispose.
     *
     * @param path New file path.
     */
    public changePath(path: string): void {
        this._tempFile = path;
        this._isMoved = true;
    }

    /**
     * Gets the temporary file path.
     *
     * @returns The path, or undefined or null if not available.
     */
    public getTempPath(): string | undefined {
        return this._tempFile;
    }

    /**
     * Gets the Content-Disposition header value of the part.
     *
     * @returns The content disposition string.
     */
    public getContentDisposition(): string {
        return this._fileInfo.contentDisposition;
    }

    /**
     * Gets the form field name of the upload.
     *
     * @returns The field name.
     */
    public getName(): string {
        return this._fileInfo.name;
    }

    /**
     * Gets the original file name provided by the client.
     *
     * @returns The file name.
     */
    public getFileName(): string {
        return this._fileInfo.fileName;
    }

    /**
     * Gets the content type of the upload.
     *
     * @returns The content type string.
     */
    public getContentType(): string {
        return this._fileInfo.contentType;
    }

    /**
     * Checks that the temp file exists and has not been moved. Throws an Error otherwise.
     *
     * @param arg Value to check, normally the temp file path (not inspected).
     * @returns True when the file is available.
     */
    private validate(arg: any): arg is string {
        if (!this._tempFile || this._isMoved)
            throw new Error("This file already moved or not created yet.");
        return true;
    }

    /**
     * Synchronously reads the temporary file. Throws if the file was moved or not created.
     *
     * @returns A Buffer with the file contents.
     */
    public readSync(): Buffer {
        if (!this.validate(this._tempFile))
            return null;

        return _fs.readFileSync(this._tempFile);
    }

    /** @deprecated Use {@link readAsync} */
    public read(next: (err: Error | NodeJS.ErrnoException | null, data: Buffer) => void): void {
        if (!this.validate(this._tempFile))
            return;

        _fsp.readFile(this._tempFile).then(
            (data) => next(null, data),
            (err) => next(err, null)
        );
    }

    /**
     * Reads the temporary file asynchronously. Throws if the file was moved or not created.
     *
     * @returns A Promise resolving to a Buffer with the file contents.
     */
    public async readAsync(): Promise<Buffer> {
        if (!this.validate(this._tempFile))
            return null;

        return await _fsp.readFile(this._tempFile);
    }

    /**
     * Synchronously moves the temp file to the given path by copying then deleting it, and marks it as
     * moved. Throws if already moved.
     *
     * @param absPath Absolute destination path.
     */
    public saveAsSync(absPath: string): void {
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
    public async saveAsAsync(absPath: string): Promise<void> {
        if (!this.validate(this._tempFile))
            return;

        try {
            await fsw.moveFileAsync(this._tempFile, absPath);
        } catch { }

        this._tempFile = null;

        this._isMoved = true;
    }

    /** @deprecated Use {@link saveAsAsync} */
    public saveAs(absPath: string, next: (err: Error | NodeJS.ErrnoException | null) => void): void {
        if (!this.validate(this._tempFile))
            return;

        fsw.moveFileAsync(this._tempFile, absPath).then(
            (): Error | null => null, (err: Error): Error | null => err
        ).then((err) => {
            this._tempFile = null;
            this._isMoved = true;
            return next(err);
        });
    }

    /**
     * Releases the file info, deleting the temp file if it was not moved. Safe to call more than once.
     */
    public dispose(): void {
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