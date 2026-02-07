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

// 11:17 PM 5/5/2020
// by rajib chy

import { deprecate, TextDecoder } from 'node:util';
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import { Dicer, PartStream } from './dicer';
import os from 'node:os';
import destroy from 'destroy';
import type { IRequest } from './request';
import { toNumber, toString, type IDispose, type ErrorHandler } from './app-static';
import { Util } from './app-util';
import * as fsw from './fsw';
import { type IPostedFileInfo } from './posted-file-info';
import { DataParser, type IDataParser } from './data-Parser';

export type UploadFileInfo = {
    contentType: string;
    name: string;
    fileName: string;
    contentDisposition: string;
    tempPath: string | undefined
}

export type FileInfo = {
    contentDisposition: string;
    name: string;
    fileName: string;
    contentType: string;
}

export interface IBodyParser extends IDispose {
    /** If you return true, this file will be skip */
    skipFile?: (fileInfo: IPostedFileInfo) => boolean;
    isUrlEncoded(): boolean;
    isAppJson(): boolean;
    isMultipart(): boolean;
    isRawData(): boolean;
    isValidRequest(): boolean;
    saveAsSync(absPath: string): void;
    /**
     * Default Urlencoded max length 20971520 (20mb)
     * You can override between this length
     */
    setMaxBuffLength(length: number): IBodyParser;
    saveAs(outdir: string, next: (err: Error | NodeJS.ErrnoException | null) => void, errorHandler: ErrorHandler): void;
    getUploadFileInfo(): UploadFileInfo[];
    getFilesSync(next: (file: IPostedFileInfo) => void): void;
    getFiles(next: (file?: IPostedFileInfo, done?: () => void) => void): void;
    getJson(): NodeJS.Dict<any>;
    getData(): string;
    parse(onReadEnd: (err?: Error) => void): void;
    parseSync(): Promise<void>;
    /** @deprecated since v2.0.3 - use `parse` instead. */
    readData(onReadEnd: (err?: Error) => void): void;
    /** @deprecated since v2.0.3 - use `parseSync` instead. */
    readDataAsync(): Promise<void>;
    /** @deprecated since v2.0.3 - use `dispose` instead. */
    clear(): void;
}

const incomingContentType: {
    APP_JSON: string;
    MULTIPART: string;
    RAW_TEXT: string;
    URL_ENCODE: string;
} = {
    APP_JSON: "application/json",
    MULTIPART: "multipart/form-data",
    RAW_TEXT: "text/plain",
    URL_ENCODE: "application/x-www-form-urlencoded"
}

enum ContentType {
    URL_ENCODE = 1,
    APP_JSON = 2,
    MULTIPART = 3,
    RAW_TEXT = 4,
    UNKNOWN = -1
}

const RE_BOUNDARY: RegExp = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;

function decode(str: string): string {
    return decodeURIComponent(str.replace(/\+/g, ' '));
}

export function decodeBodyBuffer(buff: Buffer): NodeJS.Dict<string> {
    const outObj: NodeJS.Dict<string> = {};
    const decoder: TextDecoder = new TextDecoder('utf-8');
    const params = new URLSearchParams(decoder.decode(buff));
    for (const [key, value] of params.entries()) {
        if (!value) {
            // &p=10&a
            continue;
        }
        outObj[decode(key)] = decode(value);
    }
    return outObj;
}

const MaxBuffLength: number = 1024 * 1024 * 20; // (20mb)

class BodyParser implements IBodyParser {
    private _contentType: string;
    private _contentTypeEnum: ContentType;
    private _contentLength: number;
    private _parser: IDataParser;
    private _req: IRequest;
    private _isReadEnd: boolean;
    private _isDisposed: boolean;
    private _part: number[];
    private _multipartParser?: Dicer;
    private _maxBuffLength: number;
    public skipFile?: (fileInfo: IPostedFileInfo) => boolean;
    constructor(
        req: IRequest,
        tempDir?: string
    ) {
        this._isDisposed = false; this._part = []; this._maxBuffLength = MaxBuffLength;
        this._contentType = toString(req.get("content-type"));
        this._contentLength = toNumber(req.get("content-length"));
        if (this._contentType.indexOf(incomingContentType.MULTIPART) > -1) {
            this._contentTypeEnum = ContentType.MULTIPART;
        } else if (this._contentType.indexOf(incomingContentType.URL_ENCODE) > -1) {
            this._contentTypeEnum = ContentType.URL_ENCODE;
        } else if (this._contentType.indexOf(incomingContentType.APP_JSON) > -1) {
            this._contentTypeEnum = ContentType.APP_JSON;
        } else if (this._contentType.indexOf(incomingContentType.RAW_TEXT) > -1) {
            this._contentTypeEnum = ContentType.RAW_TEXT;
        } else {
            this._contentTypeEnum = ContentType.UNKNOWN;
        }
        if (this._contentTypeEnum !== ContentType.UNKNOWN) {
            this._parser = new DataParser(tempDir || os.tmpdir());
            this._req = req;
        } else {
            this._parser = Object.create(null);
            this._req = Object.create(null);
        }
        this._isReadEnd = false;
    }
    public setMaxBuffLength(length: number): IBodyParser {
        if (length > MaxBuffLength || length <= 0)
            throw new Error(`Max buff length should be between ${MaxBuffLength} and non zero`);
        this._maxBuffLength = length;
        return this;
    }
    public isUrlEncoded(): boolean {
        return this._contentTypeEnum === ContentType.URL_ENCODE;
    }
    public isAppJson(): boolean {
        return this._contentTypeEnum === ContentType.APP_JSON;
    }
    public isMultipart(): boolean {
        return this._contentTypeEnum === ContentType.MULTIPART;
    }
    public isRawData(): boolean {
        return this._contentTypeEnum === ContentType.RAW_TEXT;
    }
    public isValidRequest(): boolean {
        return this._contentLength > 0 && this._contentTypeEnum !== ContentType.UNKNOWN;
    }
    private validate(isMultipart: boolean): void {
        if (!this.isValidRequest())
            throw new Error("Invalid request defiend....");
        if (!this._isReadEnd)
            throw new Error("Data did not read finished yet...");
        if (isMultipart) {
            if (this._contentTypeEnum !== ContentType.MULTIPART)
                throw new Error("Multipart form data required....");
            return;
        }
    }
    public saveAsSync(outdir: string): void {
        this.validate(true);
        if (!fsw.mkdirSync(outdir))
            throw new Error(`Invalid outdir dir ${outdir}`);
        return this._parser.files.forEach(pf => {
            return pf.saveAsSync(_path.resolve(`${outdir}/${Util.guid()}_${pf.getFileName()}`));
        });
    }
    public saveAs(
        outdir: string,
        next: (err: Error | NodeJS.ErrnoException | null) => void,
        errorHandler: ErrorHandler
    ): void {
        this.validate(true);
        return fsw.mkdir(outdir, "", (err: NodeJS.ErrnoException | null): void => {
            return errorHandler(err, () => {
                return this.getFiles((file?: IPostedFileInfo, done?: () => void): void => {
                    if (!file || !done) return next(null);
                    return file.saveAs(_path.resolve(`${outdir}/${Util.guid()}_${file.getFileName()}`), (serr: Error | NodeJS.ErrnoException | null): void => {
                        return errorHandler(serr, () => {
                            return done();
                        });
                    });
                });
            });
        }, errorHandler);
    }
    public getUploadFileInfo(): UploadFileInfo[] {
        this.validate(true);
        const data: UploadFileInfo[] = [];
        this._parser.files.forEach((file: IPostedFileInfo): void => {
            data.push({
                contentType: file.getContentType(),
                name: file.getName(),
                fileName: file.getFileName(),
                contentDisposition: file.getContentDisposition(),
                tempPath: file.getTempPath()
            });
        });
        return data;
    }
    public getFilesSync(next: (file: IPostedFileInfo) => void): void {
        this.validate(true);
        return this._parser.files.forEach(pf => next(pf));
    }
    public getFiles(next: (file?: IPostedFileInfo, done?: () => void) => void): void {
        this.validate(true);
        let index: number = -1;
        const forward = (): void => {
            index++;
            const pf: IPostedFileInfo | undefined = this._parser.files[index];
            if (!pf) return next();
            return next(pf, () => {
                return forward();
            });
        };
        return forward();
    }
    public getJson(): NodeJS.Dict<any> {
        this.isValidRequest();
        if (this._contentTypeEnum === ContentType.APP_JSON) {
            return Util.JSON.parse(this._parser.getRawData());
        }
        if (this._contentTypeEnum === ContentType.RAW_TEXT) {
            throw new Error("Raw Text data found. It's can not transform to json.");
        }
        const outObj: NodeJS.Dict<string> = decodeBodyBuffer(this._parser.body);
        Util.extend(outObj, this._parser.getMultipartBody());
        return outObj;
    }
    public getData(): string {
        this.validate(false);
        return this._parser.getRawData();
    }
    public readDataAsync(): Promise<void> {
        return this.parseSync();
    }
    public parseSync(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.parse((err?: Error): void => {
                if (err) return reject(err);
                return resolve();
            });
        });
    }
    private tryFinish(onReadEnd: (err?: Error) => void): void {
        if (!this._isReadEnd || this._part.length > 0) return void 0;
        const error: string | void = this._parser.getError();
        if (error) return onReadEnd(new Error(error));
        return onReadEnd();
    }
    private skipPart(stream: PartStream): void {
        stream.resume();
    }
    private onPart(onReadEnd: (err?: Error) => void): (stream: PartStream) => void {
        return (stream: PartStream): void => {
            this._part.push(1);
            this._parser.onPart(stream, (forceExit: boolean): void => {
                if (forceExit) {
                    this._part.length = 0;
                    this.skipPart(stream);
                    if (this._multipartParser) {
                        this._multipartParser.removeListener('part', this.onPart);
                        this._multipartParser.on("part", this.skipPart)
                    }
                } else {
                    this._part.shift();
                }
                return this.tryFinish(onReadEnd);
            }, this.skipFile);
        }
    }
    private finalEvent(ev: "close" | "error", onReadEnd: (err?: Error) => void): (err?: Error) => void {
        return (err?: Error) => {
            if (ev === "close") {
                if (this._isReadEnd) return;
                err = new Error("CLIENET_DISCONNECTED");
            }
            this._isReadEnd = true;
            this._part.length = 0;
            return onReadEnd(err);
        }
    }
    public parse(onReadEnd: (err?: Error) => void): void {
        if (!this.isValidRequest()) {
            return process.nextTick(() => onReadEnd(new Error("Invalid request defiend....")));
        }

        if (
            this._contentTypeEnum === ContentType.APP_JSON ||
            this._contentTypeEnum === ContentType.URL_ENCODE ||
            this._contentTypeEnum === ContentType.RAW_TEXT
        ) {
            if (this._contentLength > this._maxBuffLength) {
                return process.nextTick(() => onReadEnd(new Error(`Max buff length max:${this._maxBuffLength} > req:${this._contentLength} exceed for contentent type ${this._contentType}`)));
            }
        }

        if (
            this._contentTypeEnum === ContentType.URL_ENCODE ||
            this._contentTypeEnum === ContentType.APP_JSON ||
            this._contentTypeEnum === ContentType.RAW_TEXT
        ) {
            this._req.on("data", (chunk: any): void => {
                this._parser.onRawData(chunk);
            });

            this._req.on("end", () => {
                this._isReadEnd = true;
                return onReadEnd();
            });

            return;
        }

        const match: RegExpExecArray | null = RE_BOUNDARY.exec(this._contentType);
        if (match) {
            this._multipartParser = new Dicer({ boundary: match[1] || match[2] });
            this._multipartParser.on("part", this.onPart(onReadEnd));
            this._multipartParser.on("finish", (): void => {
                this._isReadEnd = true;
                return this.tryFinish(onReadEnd);
            });
            this._multipartParser.on("error", this.finalEvent("error", onReadEnd));
            this._req.pipe(this._multipartParser);
        }
    }
    public readData(onReadEnd: (err?: Error) => void): void {
        return this.parse(onReadEnd);
    }
    public dispose(): void {
        if (this._isDisposed) return;
        this._isDisposed = true;
        if (this._isReadEnd) {
            this._parser.dispose();
            // @ts-ignore
            delete this._parser;
        }
        if (this._multipartParser) {
            this._req.unpipe(this._multipartParser);
            destroy(this._multipartParser);
            delete this._multipartParser;
        }
        // @ts-ignore
        delete this._req; delete this._part;
        // @ts-ignore
        delete this._contentType; delete this._contentLength;
    }
    public clear(): void {
        this.dispose();
    }
}

/** @deprecated since v2.0.3 - use `getBodyParser` instead. */
export const { PayloadParser } = (() => {
    return { PayloadParser: deprecate(BodyParser, '`PayloadParser` is depreciated, please use `getBodyParser` instead.', 'v2.0.3:1') };
})();

BodyParser.prototype.clear = deprecate(BodyParser.prototype.clear, '`BodyParser.clear` is depreciated, please use `BodyParser.dispose` instead.', 'v2.0.3:2');
BodyParser.prototype.readData = deprecate(BodyParser.prototype.readData, '`BodyParser.readData` is depreciated, please use `BodyParser.parse` instead.', 'v2.0.3:3');
BodyParser.prototype.readDataAsync = deprecate(BodyParser.prototype.readDataAsync, '`BodyParser.readDataAsync` is depreciated, please use `BodyParser.parseSync` instead.', 'v2.0.3:4');

export function getBodyParser(
    req: IRequest,
    tempDir?: string
): IBodyParser {
    return new BodyParser(req, tempDir);
}
// 3:20 PM 5/6/2020