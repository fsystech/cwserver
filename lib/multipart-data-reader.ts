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
import { pipeline } from 'node:stream';
import { EventEmitter } from 'node:events';
import destroy from 'destroy';
import { PartStream } from "./dicer";
import { Util } from './app-util';
import { BufferArray, type IBufferArray, type IDispose } from "./app-static";
import { type IPostedFileInfo, PostedFileInfo } from "./posted-file-info";

export interface IMultipartDataReader extends IDispose {
    readonly forceExit: boolean;
    skipFile(fileInfo: IPostedFileInfo): boolean;
    read(stream: PartStream, tempDir: string): void;
    on(ev: "field", handler: (key: string, buff: string) => void): IMultipartDataReader;
    on(ev: "file", handler: (file: IPostedFileInfo) => void): IMultipartDataReader;
    on(ev: "end", handler: (err?: Error) => void): IMultipartDataReader;
}

export class MultipartDataReader extends EventEmitter implements IMultipartDataReader {
    private _forceExit: boolean;
    private _writeStream?: _fs.WriteStream;
    private _isDisposed: boolean;

    /**
     * Whether the reader aborted early because of an error.
     *
     * @returns True if a forced exit occurred.
     */
    public get forceExit(): boolean {
        return this._forceExit;
    }

    /**
     * Creates a multipart part reader in its initial state.
     */
    constructor() {
        super();
        this._isDisposed = false;
        this._forceExit = false;
    }

    /**
     * Destroys the temporary file write stream if it is still open.
     */
    private destroy(): void {
        if (this._writeStream && !this._writeStream.destroyed) {
            destroy(this._writeStream);
        }
    }

    /**
     * Marks a forced exit and emits an 'end' event with an error built from the reason.
     *
     * @param reason Message of the error to emit.
     */
    private exit(reason: string): void {
        this._forceExit = true;
        this.emit("end", new Error(reason));
    }

    /**
     * Default hook deciding whether to skip an uploaded file; it never skips. DataParser may replace it.
     *
     * @param fileInfo Information about the file being uploaded.
     * @returns False, meaning the file is kept.
     */
    public skipFile(fileInfo: IPostedFileInfo): boolean {
        return false;
    }

    /**
     * Reads one multipart part. After the header arrives it determines field or file; fields are buffered
     * and emitted as 'field', files are streamed to a temp file and emitted as 'file'. Emits 'end' when
     * done or with an error for missing name, filename or content type.
     *
     * @param stream The multipart part stream to read.
     * @param tempDir Directory where uploaded file contents are written temporarily.
     */
    public read(stream: PartStream, tempDir: string): void {

        let
            fieldName: string = "", fileName: string = "",
            disposition: string = "", contentType: string = "",
            isFile: boolean = false;

        stream.once("header", (header: object): void => {

            for (const [key, value] of Object.entries(header)) {

                if (!Util.isArrayLike<string>(value))
                    continue;

                const part: string | undefined = value[0];
                if (!part) continue;

                if (key === "content-disposition") {

                    if (part.indexOf("filename") > -1) {

                        fileName = _extractBetween(part, "filename=\"", "\"").trim();

                        if (fileName.length === 0) {
                            return this.exit(`Unable to extract filename form given header: ${part}`);
                        }

                        fieldName = _extractBetween(part, "name=\"", ";");
                        isFile = true;
                        disposition = part;

                        continue;
                    }

                    fieldName = _extractBetween(part, "name=\"", "\"");
                    continue;

                }

                if (key === "content-type") {
                    contentType = part.trim();
                }
            }

            if (!fieldName) {
                stream.resume();
                return this.exit("Multipart field name missing in content-disposition.");
            }

            if (!isFile) {

                const body: IBufferArray = new BufferArray();

                stream.on("data", (chunk: string | Buffer): void => {
                    body.push(chunk);
                }).on("end", () => {
                    this.emit("field", fieldName, body.data.toString());
                    body.dispose();
                    this.emit("end");
                });

                return;

            }

            if (contentType.length > 0) {

                const fileInfo = new PostedFileInfo(
                    disposition, fieldName.replace(/"/gi, ""),
                    fileName.replace(/"/gi, ""),
                    contentType.replace(/"/gi, ""),
                    _path.resolve(`${tempDir}/${Util.UUID()}.temp`)
                );

                if (this.skipFile(fileInfo)) {
                    stream.resume();
                    this.emit("end");
                    return;
                }

                const tempFile = fileInfo.getTempPath();

                if (tempFile) {

                    this._writeStream = pipeline(stream, _fs.createWriteStream(tempFile, { flags: 'a' }), (err: NodeJS.ErrnoException | null) => {
                        this.destroy();
                        this.emit("end", err);
                    });

                    this.emit("file", fileInfo);
                }

            } else {
                return this.exit("Content type not found in requested file....");
            }
        });
    }

    /**
     * Removes all listeners, destroys the write stream and clears state. Safe to call more than once.
     */
    public dispose(): void {
        if (this._isDisposed)
            return;

        this._isDisposed = true;
        this.removeAllListeners();
        this.destroy();

        this._writeStream = null;
        this._forceExit = null;
    }
}

/**
 * Returns the text between the first occurrence of one separator and the next occurrence of another.
 *
 * @param data Text to search.
 * @param separator1 Separator marking the start.
 * @param separator2 Separator marking the end.
 * @returns The text between the separators, or an empty string if either is not found.
 */
function _extractBetween(
    data: string,
    separator1: string,
    separator2: string
): string {
    let result: string = "";
    let start: number = 0;
    let limit: number = 0;
    start = data.indexOf(separator1);
    if (start >= 0) {
        start += separator1.length;
        limit = data.indexOf(separator2, start);
        if (limit > -1)
            result = data.substring(start, limit);
    }
    return result;
}