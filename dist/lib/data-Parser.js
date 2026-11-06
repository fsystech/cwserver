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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataParser = void 0;
const app_static_1 = require("./app-static");
const multipart_data_reader_1 = require("./multipart-data-reader");
class DataParser {
    /**
     * Gets the files uploaded in the multipart request.
     *
     * @returns The array of posted file info objects.
     */
    get files() {
        return this._files;
    }
    /**
     * Gets the raw buffered request body.
     *
     * @returns A Buffer with the body data received so far.
     */
    get body() {
        return this._body.data;
    }
    /**
     * Creates a data parser that collects raw data, multipart fields and uploaded files.
     *
     * @param tempDir Directory for temporary uploaded files.
     */
    constructor(tempDir) {
        this._isDisposed = false;
        this._errors = [];
        this._files = [];
        this._body = new app_static_1.BufferArray();
        this._readers = [];
        this._tempDir = tempDir;
        this._multipartBody = {};
    }
    /**
     * Appends a chunk of raw body data to the buffer. Ignored once disposed.
     *
     * @param buff Chunk of data to append.
     */
    onRawData(buff) {
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
    getRawData(encoding) {
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
    getMultipartBody() {
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
    onPart(stream, next, skipFile) {
        if (this._isDisposed)
            return;
        const reader = new multipart_data_reader_1.MultipartDataReader();
        if (skipFile) {
            reader.skipFile = skipFile;
        }
        reader.on("file", (file) => {
            if (this._isDisposed)
                return;
            this._files.push(file);
        });
        reader.on("field", (key, data) => {
            if (this._isDisposed)
                return;
            this._multipartBody[key] = encodeURIComponent(data);
        });
        reader.on("end", (err) => {
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
    getError() {
        if (this._isDisposed)
            return null;
        if (this._errors.length > 0) {
            return this._errors.join("\n");
        }
    }
    /**
     * Disposes readers, files and buffers and clears state. Safe to call more than once.
     */
    dispose() {
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
exports.DataParser = DataParser;
/**
 * Removes each item from the array and disposes it.
 *
 * @param data Array of disposable objects, emptied by the call.
 */
function dispose(data) {
    while (true) {
        const instance = data.shift();
        if (!instance)
            break;
        instance.dispose();
    }
}
//# sourceMappingURL=data-parser.js.map