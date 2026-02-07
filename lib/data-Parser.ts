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
    private _files: IPostedFileInfo[];
    private _body: IBufferArray;
    private _multipartBody: { [id: string]: string };
    private _errors: (Error | NodeJS.ErrnoException)[];
    private _tempDir: string;
    private _readers: IMultipartDataReader[];
    public get files(): IPostedFileInfo[] {
        return this._files;
    }
    public get body(): Buffer {
        return this._body.data;
    }
    constructor(
        tempDir: string
    ) {
        this._errors = []; this._files = [];
        this._body = new BufferArray();
        this._readers = []; this._tempDir = tempDir;
        this._multipartBody = {};
    }
    public onRawData(buff: Buffer | string): void {
        this._body.push(buff);
    }
    public getRawData(encoding?: BufferEncoding): string {
        let data = this._body.toString(encoding);
        if (Object.keys(this._multipartBody).length > 0) {
            for (const prop in this._multipartBody) {
                data += '&' + prop + '=' + this._multipartBody[prop];
            }
        }
        return data;
    }
    public getMultipartBody(): { [id: string]: string } {
        return this._multipartBody;
    }
    public onPart(
        stream: PartStream,
        next: (forceExit: boolean) => void,
        skipFile?: (fileInfo: IPostedFileInfo) => boolean
    ): void {
        const reader: IMultipartDataReader = new MultipartDataReader();
        if (skipFile) {
            reader.skipFile = skipFile;
        }
        reader.on("file", (file: IPostedFileInfo): void => {
            return this._files.push(file), void 0;
        });
        reader.on("field", (key: string, data: string): void => {
            this._multipartBody[key] = encodeURIComponent(data);
        });
        reader.on("end", (err?: Error): void => {
            if (err) {
                this._errors.push(err);
            }
            next(reader.forceExit);
            return reader.dispose();
        });
        reader.read(stream, this._tempDir);
        this._readers.push(reader);
        return void 0;
    }
    public getError(): string | void {
        if (this._errors.length > 0) {
            let str: string = "";
            for (const err of this._errors) {
                str += err.message + "\n";
            }
            return str;
        }
    }
    public dispose(): void {
        dispose(this._readers);
        dispose(this._files);
        this._body.dispose();
        // @ts-ignore
        delete this._body; delete this._multipartBody;
        if (this._errors) {
            // @ts-ignore
            delete this._errors;
        }
    }
}

function dispose<T extends IDispose>(data: T[]) {
    while (true) {
        const instance: T | undefined = data.shift();
        if (!instance) break;
        instance.dispose();
    }
}