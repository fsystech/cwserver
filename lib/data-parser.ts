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

import { PartStream } from "./dicer";
import type { IPostedFileInfo } from "./posted-file-info";
import { BufferArray, type IBufferArray, type IDispose } from "./app-static";
import { type IMultipartDataReader, MultipartDataReader } from "./multipart-data-reader";

export interface IDataParser extends IDispose {
    readonly files: IPostedFileInfo[];
    readonly body: Buffer;
    onRawData(buff: Buffer | string): void;
    getRawData(encoding?: BufferEncoding): string;
    onPart(
        stream: PartStream,
        next: (forceExit: boolean) => void,
        skipFile?: (fileInfo: IPostedFileInfo) => boolean
    ): void;
    getError(): string | void;
    getMultipartBody(): { [id: string]: string };
}

export class DataParser implements IDataParser {
    private _isDisposed: boolean = false;
    private _files: IPostedFileInfo[];
    private _body: IBufferArray;
    private _multipartBody: { [id: string]: string };
    private _errors: (Error | NodeJS.ErrnoException)[];
    private _tempDir: string;
    private _readers: IMultipartDataReader[];

    /**
     * Gets the files uploaded in the multipart request.
     *
     * @returns The array of posted file info objects.
     */
    public get files(): IPostedFileInfo[] {
        return this._files;
    }

    /**
     * Gets the raw buffered request body.
     *
     * @returns A Buffer with the body data received so far.
     */
    public get body(): Buffer {
        return this._body.data;
    }

    /**
     * Creates a data parser that collects raw data, multipart fields and uploaded files.
     *
     * @param tempDir Directory for temporary uploaded files.
     */
    constructor(
        tempDir: string
    ) {
        this._errors = []; this._files = [];
        this._body = new BufferArray();
        this._readers = []; this._tempDir = tempDir;
        this._multipartBody = {};
    }

    /**
     * Appends a chunk of raw body data to the buffer. Ignored once disposed.
     *
     * @param buff Chunk of data to append.
     */
    public onRawData(buff: Buffer | string): void {
        if (this._isDisposed)
            return;
        this._body.push(buff);
    }

    /**
     * Returns the raw body text joined with any multipart fields as key=value pairs separated by
     * ampersands.
     *
     * @param encoding Optional text encoding used for the body.
     * @returns The combined string, or null if the parser is disposed.
     */
    public getRawData(encoding?: BufferEncoding): string {
        if (this._isDisposed)
            return null;

        const data = [this._body.toString(encoding)];

        for (const [key, value] of Object.entries(this._multipartBody)) {
            data.push(`${key}=${value}`);
        }

        return data.join('&');
    }

    /**
     * Gets the multipart text fields collected so far, with values URL-encoded.
     *
     * @returns An object mapping field names to encoded values, or null if disposed.
     */
    public getMultipartBody(): { [id: string]: string } {
        if (this._isDisposed)
            return null;

        return this._multipartBody;
    }

    /**
     * Processes one multipart part with a new reader, collecting its field or file and reporting
     * completion. Ignored if disposed.
     *
     * @param stream The multipart part stream.
     * @param next Callback called when the part finishes, with true if the reader forced an exit.
     * @param skipFile Optional predicate that returns true to skip a file.
     */
    public onPart(
        stream: PartStream,
        next: (forceExit: boolean) => void,
        skipFile?: (fileInfo: IPostedFileInfo) => boolean
    ): void {

        if (this._isDisposed)
            return;

        const reader: IMultipartDataReader = new MultipartDataReader();

        if (skipFile) {
            reader.skipFile = skipFile;
        }

        reader.on("file", (file: IPostedFileInfo): void => {
            if (this._isDisposed)
                return;

            this._files.push(file);
        });

        reader.on("field", (key: string, data: string): void => {
            if (this._isDisposed)
                return;

            this._multipartBody[key] = encodeURIComponent(data);
        });

        reader.on("end", (err?: Error): void => {
            if (this._isDisposed)
                return;

            if (err) {
                this._errors.push(err);
            }
            next(reader.forceExit);
            return reader.dispose();
        });

        reader.read(stream, this._tempDir);

        this._readers.push(reader);
    }

    /**
     * Gets the errors collected during parsing as one message.
     *
     * @returns Error messages joined by newlines, or nothing if there were no errors; null if disposed.
     */
    public getError(): string | void {
        if (this._isDisposed)
            return null;

        if (this._errors.length > 0) {
            return this._errors.join("\n");
        }

    }

    /**
     * Disposes readers, files and buffers and clears state. Safe to call more than once.
     */
    public dispose(): void {
        if (this._isDisposed)
            return;

        this._isDisposed = true;
        dispose(this._readers);
        dispose(this._files);
        this._body.dispose();

        this._body = null;
        this._errors = null;
        this._multipartBody = null;
    }
}

/**
 * Removes each item from the array and disposes it.
 *
 * @param data Array of disposable objects, emptied by the call.
 */
function dispose<T extends IDispose>(data: T[]) {
    while (true) {
        const instance: T | undefined = data.shift();
        if (!instance) break;
        instance.dispose();
    }
}