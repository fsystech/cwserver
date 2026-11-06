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
import { DataParser, type IDataParser } from './data-parser';

export type UploadFileInfo = {
    contentType: string;
    name: string;
    fileName: string;
    contentDisposition: string;
    tempPath: string | undefined
};

export type FileInfo = {
    contentDisposition: string;
    name: string;
    fileName: string;
    contentType: string;
};

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
    getJson(): Record<string, any>;
    getData(): string;
    /** @deprecated Use {@link parseAsync} */
    parse(onReadEnd: (err?: Error) => void): void;
    parseAsync(): Promise<void>;
    getFilesAsync(
        next: (file: IPostedFileInfo) => Promise<void>
    ): Promise<void>;
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
};

enum ContentType {
    URL_ENCODE = 1,
    APP_JSON = 2,
    MULTIPART = 3,
    RAW_TEXT = 4,
    UNKNOWN = -1
}

const RE_BOUNDARY: RegExp = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;

/**
 * Decodes a URL-encoded component after converting plus signs to spaces.
 *
 * @param str The URL-encoded string to decode.
 * @returns The decoded string. Throws URIError if the input contains malformed percent-encoding.
 */
function decode(str: string): string {
    return decodeURIComponent(str.replace(/\+/g, ' '));
}

/**
 * Parses a URL-encoded request body buffer into a flat key/value object, decoding keys and values.
 * Pairs with an empty value are skipped.
 *
 * @param buff Buffer holding the application/x-www-form-urlencoded body, decoded as UTF-8.
 * @returns An object mapping each decoded key to its decoded non-empty value.
 */
export function decodeBodyBuffer(buff: Buffer): Record<string, string> {
    const outObj: Record<string, string> = {};
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
    /**
     * Creates a body parser for a request, detecting the content type (multipart, URL-encoded, JSON or raw
     * text) from the content-type header and reading the content-length. Unsupported content types leave
     * the parser in an invalid state.
     *
     * @param req The incoming request whose headers and stream are used.
     * @param tempDir Directory used to store uploaded files temporarily; defaults to the OS temp directory.
     */
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

    /**
     * Sets the maximum allowed body size for URL-encoded, JSON and raw text requests. Throws an Error if
     * the value is not between 1 and the 20 MB default limit.
     *
     * @param length Maximum buffer length in bytes.
     * @returns This parser instance, for chaining.
     */
    public setMaxBuffLength(length: number): IBodyParser {
        if (length > MaxBuffLength || length <= 0)
            throw new Error(`Max buff length should be between ${MaxBuffLength} and non zero`);
        this._maxBuffLength = length;
        return this;
    }

    /**
     * Checks whether the request content type is application/x-www-form-urlencoded.
     *
     * @returns True if the body is URL-encoded.
     */
    public isUrlEncoded(): boolean {
        return this._contentTypeEnum === ContentType.URL_ENCODE;
    }

    /**
     * Checks whether the request content type is JSON.
     *
     * @returns True if the body is application/json.
     */
    public isAppJson(): boolean {
        return this._contentTypeEnum === ContentType.APP_JSON;
    }

    /**
     * Checks whether the request content type is multipart.
     *
     * @returns True if the body is multipart form data.
     */
    public isMultipart(): boolean {
        return this._contentTypeEnum === ContentType.MULTIPART;
    }

    /**
     * Checks whether the request content type is raw text.
     *
     * @returns True if the body is raw text data.
     */
    public isRawData(): boolean {
        return this._contentTypeEnum === ContentType.RAW_TEXT;
    }

    /**
     * Checks whether the request has a positive content length and a supported content type.
     *
     * @returns True if the request body can be parsed.
     */
    public isValidRequest(): boolean {
        return this._contentLength > 0 && this._contentTypeEnum !== ContentType.UNKNOWN;
    }

    /**
     * Verifies the parser is ready to expose parsed data. Throws an Error if the parser is disposed, the
     * request is invalid, the body has not finished reading, or multipart is required but the request is
     * not multipart.
     *
     * @param isMultipart Whether the request must be multipart form data.
     */
    private validate(isMultipart: boolean): void {
        if (this._isDisposed)
            throw new Error("BodyParser is disposed state");

        if (!this.isValidRequest())
            throw new Error("Invalid request defiend....");

        if (!this._isReadEnd)
            throw new Error("Data did not read finished yet...");

        if (isMultipart && this._contentTypeEnum !== ContentType.MULTIPART) {
            throw new Error("Multipart form data required....");
        }
    }

    /**
     * Synchronously moves all uploaded files into the given directory, creating it if needed. Each file is
     * saved under a UUID-prefixed copy of its original name; throws if the parser state is invalid or the
     * directory cannot be created.
     *
     * @param outdir Destination directory path for the uploaded files.
     */
    public saveAsSync(outdir: string): void {
        this.validate(true);

        if (!fsw.mkdirSync(outdir))
            throw new Error(`Invalid outdir dir ${outdir}`);

        return this._parser.files.forEach(pf => {
            return pf.saveAsSync(_path.resolve(`${outdir}/${Util.UUID()}_${pf.getFileName()}`));
        });
    }

    /**
     * Asynchronously moves all uploaded files into the given directory, creating it if needed. Each file
     * is saved under a UUID-prefixed copy of its original name, in parallel.
     *
     * @param outdir Destination directory path for the uploaded files.
     * @returns A Promise that resolves once every file has been saved, and rejects on validation or file-system
     *   errors.
     */
    public async saveAsAsync(outdir: string) {
        this.validate(true);

        await fsw.mkdirAsyncx(outdir);

        await Promise.all(this._parser.files.map(
            pf => pf.saveAsAsync(_path.resolve(`${outdir}/${Util.UUID()}_${pf.getFileName()}`))
        ));
    }

    /**
     * Callback-style wrapper around saveAsAsync that saves all uploaded files to a directory.
     *
     * @param outdir Destination directory path for the uploaded files.
     * @param next Callback invoked with null after all files are saved.
     * @param errorHandler Handler called with the error and the next callback when saving fails.
     */
    public saveAs(
        outdir: string,
        next: (err?: Error | NodeJS.ErrnoException) => void,
        errorHandler: ErrorHandler
    ): void {

        this.saveAsAsync(outdir).then(
            () => next(null)
        ).catch(
            ex => errorHandler(ex, next)
        );
    }

    /**
     * Returns metadata for every uploaded file in a multipart request. Throws if the parser state is
     * invalid or the request is not multipart.
     *
     * @returns An array of objects with content type, field name, file name, content disposition and temp path for
     *   each file.
     */
    public getUploadFileInfo(): UploadFileInfo[] {
        this.validate(true);

        return this._parser.files.map<UploadFileInfo>(file => ({
            contentType: file.getContentType(),
            name: file.getName(),
            fileName: file.getFileName(),
            contentDisposition: file.getContentDisposition(),
            tempPath: file.getTempPath()
        }));
    }

    /**
     * Synchronously invokes a callback for each uploaded file. Throws if the parser state is invalid or
     * the request is not multipart.
     *
     * @param next Callback called once per uploaded file.
     */
    public getFilesSync(next: (file: IPostedFileInfo) => void): void {

        this.validate(true);

        const files = this._parser.files;

        for (const file of files) {
            next(file);
        }
    }

    /**
     * Invokes an async callback for every uploaded file concurrently and waits for all of them to finish.
     * Throws if the parser state is invalid or the request is not multipart.
     *
     * @param next Async callback called once per uploaded file.
     * @returns A Promise that resolves after all callbacks complete, or rejects if one fails.
     */
    public async getFilesAsync(
        next: (file: IPostedFileInfo) => Promise<void>
    ): Promise<void> {

        this.validate(true);

        const files = this._parser.files;

        if (files.length === 0)
            return;

        const promises: Array<Promise<void>> = [];

        for (const file of files) {
            promises.push(next(file));
        }

        await Promise.all(promises);
    }

    /**
     * Iterates the uploaded files sequentially, advancing to the next file when the callback calls done.
     * The callback is called with no arguments once all files have been visited.
     *
     * @param next Callback receiving each file and a done function to move on, or no arguments at the end.
     */
    public getFiles(next: (file?: IPostedFileInfo, done?: () => void) => void): void {
        this.validate(true);

        let index: number = -1;

        /**
         * Advances to the next uploaded file and passes it, with a continuation, to the callback; calls the
         * callback without arguments when no files remain.
         */
        const forward = (): void => {
            index++;

            const pf = this._parser.files[index];
            if (!pf) return next();

            return next(pf, () => {
                return forward();
            });
        };

        return forward();
    }

    /**
     * Builds an object of the request data. For JSON bodies it parses the raw data; for URL-encoded or
     * multipart bodies it merges decoded body fields with multipart fields. Throws if the body is raw
     * text.
     *
     * @returns An object containing the parsed request data.
     */
    public getJson(): Record<string, any> {
        this.isValidRequest();

        if (this._contentTypeEnum === ContentType.APP_JSON) {
            return Util.JSON.parse(this._parser.getRawData());
        }

        if (this._contentTypeEnum === ContentType.RAW_TEXT) {
            throw new Error("Raw Text data found. It's can not transform to json.");
        }

        const outObj = decodeBodyBuffer(
            this._parser.body
        );

        Util.extend(
            outObj, this._parser.getMultipartBody()
        );

        return outObj;
    }

    /**
     * Returns the raw request body as a string. Throws if the parser state is invalid or the body is not
     * fully read.
     *
     * @returns The raw body text, including any multipart fields appended as key=value pairs.
     */
    public getData(): string {
        this.validate(false);
        return this._parser.getRawData();
    }

    /**
     * Reads the request body. Resolves when the whole body has been read
     * and rejects on a read/parse error or when the client disconnects.
     */
    public parseAsync(): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            this._read((err?: Error): void => {
                err ? reject(err) : resolve();
            });

        });
    }

    /** @deprecated Use {@link parseAsync} */
    public parse(onReadEnd: (err?: Error) => void): void {
        this.parseAsync().then(
            () => onReadEnd(),
            (err: Error) => onReadEnd(err)
        );
    }

    /**
     * Completes reading when the body has ended and no parts are pending, reporting any parser error or
     * success to the callback.
     *
     * @param onReadEnd Callback invoked with an Error on failure or with no arguments on success.
     */
    private tryFinish(onReadEnd: (err?: Error) => void): void {
        if (!this._isReadEnd || this._part.length > 0)
            return void 0;

        const error: string | void = this._parser.getError();

        if (error)
            return onReadEnd(new Error(error));

        return onReadEnd();
    }

    /**
     * Discards a multipart part by resuming its stream.
     *
     * @param stream The part stream to drain.
     */
    private skipPart(stream: PartStream): void {
        stream.resume();
    }

    /**
     * Creates the handler for multipart 'part' events. It tracks pending parts, delegates each to the data
     * parser and, on forced exit, stops further parts and finishes.
     *
     * @param onReadEnd Callback invoked when reading finishes or fails.
     * @returns A function that processes one part stream.
     */
    private onPart(onReadEnd: (err?: Error) => void): (stream: PartStream) => void {
        return (stream: PartStream): void => {

            this._part.push(1);

            this._parser.onPart(stream, (forceExit: boolean): void => {

                if (forceExit) {

                    this._part.length = 0;
                    this.skipPart(stream);

                    if (this._multipartParser) {

                        this._multipartParser.removeListener(
                            'part', this.onPart
                        );

                        this._multipartParser.on(
                            "part", this.skipPart
                        );
                    }

                } else {
                    this._part.shift();
                }

                return this.tryFinish(onReadEnd);

            }, this.skipFile);
        };
    }

    /**
     * Creates a handler for stream close or error events that marks reading as finished and reports the
     * result. A close before the body completed is reported as a client disconnect.
     *
     * @param ev The event type being handled, close or error.
     * @param onReadEnd Callback invoked with the resulting error, if any.
     * @returns A function that receives the optional error and finishes reading.
     */
    private finalEvent(ev: "close" | "error", onReadEnd: (err?: Error) => void): (err?: Error) => void {
        return (err?: Error) => {
            if (ev === "close") {
                if (this._isReadEnd) return;
                err = new Error("CLIENET_DISCONNECTED");
            }
            this._isReadEnd = true;
            this._part.length = 0;
            return onReadEnd(err);
        };
    }

    /**
     * Starts reading the request body. For JSON, URL-encoded and raw text it buffers data events; for
     * multipart it pipes the request into a Dicer parser. Reports errors for disposed or invalid state,
     * oversized bodies and a bad content-type boundary.
     *
     * @param onReadEnd Callback invoked with an Error on failure or with no arguments when reading completes.
     */
    private _read(onReadEnd: (err?: Error) => void): void {
        if (this._isDisposed)
            return onReadEnd(new Error("BodyParser is disposed state"));

        if (!this.isValidRequest()) {
            return process.nextTick(() => onReadEnd(
                new Error("Invalid request defiend....")
            ));
        }

        if (
            this._contentTypeEnum === ContentType.APP_JSON ||
            this._contentTypeEnum === ContentType.URL_ENCODE ||
            this._contentTypeEnum === ContentType.RAW_TEXT
        ) {
            if (this._contentLength > this._maxBuffLength) {
                return process.nextTick(() => onReadEnd(
                    new Error(`Max buff length max:${this._maxBuffLength} > req:${this._contentLength} exceed for contentent type ${this._contentType}`))
                );
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

        const match: RegExpExecArray | null = RE_BOUNDARY.exec(
            this._contentType
        );

        if (!match) {
            return process.nextTick(() => {
                onReadEnd(new Error(
                    `Invalid or incomplete Content-Type header: ${this._contentType}`
                ));
            });
        }

        this._multipartParser = new Dicer({
            boundary: match[1] || match[2]
        });

        this._multipartParser.on(
            "part", this.onPart(onReadEnd)
        );

        this._multipartParser.on("finish", (): void => {
            this._isReadEnd = true;
            return this.tryFinish(onReadEnd);
        });

        this._multipartParser.on(
            "error", this.finalEvent("error", onReadEnd)
        );

        this._req.pipe(this._multipartParser);
    }

    /**
     * Releases the parser, its data parser, the multipart stream and request references. Safe to call more
     * than once.
     */
    public dispose(): void {

        if (this._isDisposed)
            return;

        this._isDisposed = true;

        if (this._isReadEnd) {
            this._parser.dispose();
            this._parser = null;
        }

        if (this._multipartParser) {
            this._req.unpipe(this._multipartParser);
            destroy(this._multipartParser);
            this._multipartParser = null;
        }

        this._req = null;
        this._part = null;
        this._contentType = null;
        this._contentLength = null;
    }
}

BodyParser.prototype.parse = deprecate(BodyParser.prototype.parse, '`BodyParser.parse` is depreciated, please use `BodyParser.parseAsync` instead.', '4.1.2');

/**
 * Creates a body parser for the given request.
 *
 * @param req The incoming request to parse.
 * @param tempDir Optional directory for temporary uploaded files.
 * @returns A new body parser instance.
 */
export function getBodyParser(
    req: IRequest,
    tempDir?: string
): IBodyParser {
    return new BodyParser(req, tempDir);
}
// 3:20 PM 5/6/2020