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
    get files() {
        return this._files;
    }
    get body() {
        return this._body.data;
    }
    constructor(tempDir) {
        this._isDisposed = false;
        this._errors = [];
        this._files = [];
        this._body = new app_static_1.BufferArray();
        this._readers = [];
        this._tempDir = tempDir;
        this._multipartBody = {};
    }
    onRawData(buff) {
        if (this._isDisposed)
            return;
        this._body.push(buff);
    }
    getRawData(encoding) {
        if (this._isDisposed)
            return null;
        const data = [this._body.toString(encoding)];
        for (const [key, value] of Object.entries(this._multipartBody)) {
            data.push(`${key}=${value}`);
        }
        return data.join('&');
    }
    getMultipartBody() {
        if (this._isDisposed)
            return null;
        return this._multipartBody;
    }
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
    getError() {
        if (this._isDisposed)
            return null;
        if (this._errors.length > 0) {
            return this._errors.join("\n");
        }
    }
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
function dispose(data) {
    while (true) {
        const instance = data.shift();
        if (!instance)
            break;
        instance.dispose();
    }
}
//# sourceMappingURL=data-Parser.js.map