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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBodyParser = exports.PayloadParser = exports.decodeBodyBuffer = void 0;
// 11:17 PM 5/5/2020
// by rajib chy
const node_events_1 = require("node:events");
const node_util_1 = require("node:util");
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
// import Dicer from 'dicer';
const dicer_1 = require("./dicer");
const node_stream_1 = require("node:stream");
const node_os_1 = __importDefault(require("node:os"));
const destroy = require("destroy");
const app_static_1 = require("./app-static");
const app_util_1 = require("./app-util");
const fsw = __importStar(require("./fsw"));
function dispose(data) {
    while (true) {
        const instance = data.shift();
        if (!instance)
            break;
        instance.dispose();
    }
}
const incomingContentType = {
    APP_JSON: "application/json",
    MULTIPART: "multipart/form-data",
    RAW_TEXT: "text/plain",
    URL_ENCODE: "application/x-www-form-urlencoded"
};
var ContentType;
(function (ContentType) {
    ContentType[ContentType["URL_ENCODE"] = 1] = "URL_ENCODE";
    ContentType[ContentType["APP_JSON"] = 2] = "APP_JSON";
    ContentType[ContentType["MULTIPART"] = 3] = "MULTIPART";
    ContentType[ContentType["RAW_TEXT"] = 4] = "RAW_TEXT";
    ContentType[ContentType["UNKNOWN"] = -1] = "UNKNOWN";
})(ContentType || (ContentType = {}));
function extractBetween(data, separator1, separator2) {
    let result = "";
    let start = 0;
    let limit = 0;
    start = data.indexOf(separator1);
    if (start >= 0) {
        start += separator1.length;
        limit = data.indexOf(separator2, start);
        if (limit > -1)
            result = data.substring(start, limit);
    }
    return result;
}
class PostedFileInfo {
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
    changePath(path) {
        this._tempFile = path;
        this._isMoved = true;
    }
    getTempPath() {
        return this._tempFile;
    }
    getContentDisposition() {
        return this._fileInfo.contentDisposition;
    }
    getName() {
        return this._fileInfo.name;
    }
    getFileName() {
        return this._fileInfo.fileName;
    }
    getContentType() {
        return this._fileInfo.contentType;
    }
    validate(arg) {
        if (!this._tempFile || this._isMoved)
            throw new Error("This file already moved or not created yet.");
        return true;
    }
    readSync() {
        if (!this._tempFile || this._isMoved)
            throw new Error("This file already moved or not created yet.");
        return _fs.readFileSync(this._tempFile);
    }
    read(next) {
        if (this.validate(this._tempFile))
            return _fs.readFile(this._tempFile, next);
    }
    saveAsSync(absPath) {
        if (this.validate(this._tempFile)) {
            _fs.copyFileSync(this._tempFile, absPath);
            _fs.unlinkSync(this._tempFile);
            delete this._tempFile;
            this._isMoved = true;
        }
    }
    saveAs(absPath, next) {
        if (this.validate(this._tempFile)) {
            fsw.moveFile(this._tempFile, absPath, (err) => {
                delete this._tempFile;
                this._isMoved = true;
                return next(err);
            });
        }
    }
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        if (!this._isMoved && this._tempFile) {
            if (_fs.existsSync(this._tempFile))
                _fs.unlinkSync(this._tempFile);
        }
        // @ts-ignore
        delete this._fileInfo;
        delete this._tempFile;
    }
    clear() {
        this.dispose();
    }
}
const RE_BOUNDARY = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;
class MultipartDataReader extends node_events_1.EventEmitter {
    get forceExit() {
        return this._forceExit;
    }
    destroy() {
        if (this._writeStream && !this._writeStream.destroyed) {
            destroy(this._writeStream);
        }
    }
    exit(reason) {
        this._forceExit = true;
        this.emit("end", new Error(reason));
    }
    constructor() {
        super();
        this._isDisposed = false;
        this._forceExit = false;
    }
    skipFile(fileInfo) {
        return false;
    }
    read(stream, tempDir) {
        let fieldName = "", fileName = "", disposition = "", contentType = "", isFile = false;
        const body = new app_static_1.BufferArray();
        stream.on("header", (header) => {
            for (const [key, value] of Object.entries(header)) {
                if (app_util_1.Util.isArrayLike(value)) {
                    const part = value[0];
                    if (part) {
                        if (key === "content-disposition") {
                            if (part.indexOf("filename") > -1) {
                                fileName = extractBetween(part, "filename=\"", "\"").trim();
                                if (fileName.length === 0) {
                                    return this.exit(`Unable to extract filename form given header: ${part}`);
                                }
                                fieldName = extractBetween(part, "name=\"", ";");
                                isFile = true;
                                disposition = part;
                                continue;
                            }
                            fieldName = extractBetween(part, "name=\"", "\"");
                            continue;
                        }
                        if (key === "content-type") {
                            contentType = part.trim();
                        }
                    }
                }
            }
            if (!isFile) {
                return stream.on("data", (chunk) => {
                    body.push(chunk);
                }).on("end", () => {
                    this.emit("field", fieldName, body.data.toString());
                    body.dispose();
                    this.emit("end");
                }), void 0;
            }
            // no more needed body
            body.dispose();
            if (contentType.length > 0) {
                const fileInfo = new PostedFileInfo(disposition, fieldName.replace(/"/gi, ""), fileName.replace(/"/gi, ""), contentType.replace(/"/gi, ""), _path.resolve(`${tempDir}/${app_util_1.Util.guid()}.temp`));
                if (this.skipFile(fileInfo)) {
                    stream.resume();
                    this.emit("end");
                    return;
                }
                const tempFile = fileInfo.getTempPath();
                if (tempFile) {
                    this._writeStream = (0, node_stream_1.pipeline)(stream, _fs.createWriteStream(tempFile, { flags: 'a' }), (err) => {
                        this.destroy();
                        this.emit("end", err);
                    });
                    this.emit("file", fileInfo);
                }
            }
            else {
                return this.exit("Content type not found in requested file....");
            }
        });
        return void 0;
    }
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        this.removeAllListeners();
        this.destroy();
        delete this._writeStream;
        // @ts-ignore
        delete this._forceExit;
    }
}
class DataParser {
    get files() {
        return this._files;
    }
    get body() {
        return this._body.data;
    }
    constructor(tempDir) {
        this._errors = [];
        this._files = [];
        this._body = new app_static_1.BufferArray();
        this._readers = [];
        this._tempDir = tempDir;
        this._multipartBody = {};
    }
    onRawData(buff) {
        this._body.push(buff);
    }
    getRawData(encoding) {
        let data = this._body.toString(encoding);
        if (Object.keys(this._multipartBody).length > 0) {
            for (const prop in this._multipartBody) {
                data += '&' + prop + '=' + this._multipartBody[prop];
            }
        }
        return data;
    }
    getMultipartBody() {
        return this._multipartBody;
    }
    onPart(stream, next, skipFile) {
        const reader = new MultipartDataReader();
        if (skipFile) {
            reader.skipFile = skipFile;
        }
        reader.on("file", (file) => {
            return this._files.push(file), void 0;
        });
        reader.on("field", (key, data) => {
            this._multipartBody[key] = encodeURIComponent(data);
        });
        reader.on("end", (err) => {
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
    getError() {
        if (this._errors.length > 0) {
            let str = "";
            for (const err of this._errors) {
                str += err.message + "\n";
            }
            return str;
        }
    }
    dispose() {
        dispose(this._readers);
        dispose(this._files);
        this._body.dispose();
        // @ts-ignore
        delete this._body;
        delete this._multipartBody;
        if (this._errors) {
            // @ts-ignore
            delete this._errors;
        }
    }
}
function decode(str) {
    return decodeURIComponent(str.replace(/\+/g, ' '));
}
function decodeBodyBuffer(buff) {
    const outObj = {};
    const decoder = new node_util_1.TextDecoder('utf-8');
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
exports.decodeBodyBuffer = decodeBodyBuffer;
const MaxBuffLength = 1024 * 1024 * 20; // (20mb)
class BodyParser {
    constructor(req, tempDir) {
        this._isDisposed = false;
        this._part = [];
        this._maxBuffLength = MaxBuffLength;
        this._contentType = (0, app_static_1.toString)(req.get("content-type"));
        this._contentLength = (0, app_static_1.ToNumber)(req.get("content-length"));
        if (this._contentType.indexOf(incomingContentType.MULTIPART) > -1) {
            this._contentTypeEnum = ContentType.MULTIPART;
        }
        else if (this._contentType.indexOf(incomingContentType.URL_ENCODE) > -1) {
            this._contentTypeEnum = ContentType.URL_ENCODE;
        }
        else if (this._contentType.indexOf(incomingContentType.APP_JSON) > -1) {
            this._contentTypeEnum = ContentType.APP_JSON;
        }
        else if (this._contentType.indexOf(incomingContentType.RAW_TEXT) > -1) {
            this._contentTypeEnum = ContentType.RAW_TEXT;
        }
        else {
            this._contentTypeEnum = ContentType.UNKNOWN;
        }
        if (this._contentTypeEnum !== ContentType.UNKNOWN) {
            this._parser = new DataParser(tempDir || node_os_1.default.tmpdir());
            this._req = req;
        }
        else {
            this._parser = Object.create(null);
            this._req = Object.create(null);
        }
        this._isReadEnd = false;
    }
    setMaxBuffLength(length) {
        if (length > MaxBuffLength || length <= 0)
            throw new Error(`Max buff length should be between ${MaxBuffLength} and non zero`);
        this._maxBuffLength = length;
        return this;
    }
    isUrlEncoded() {
        return this._contentTypeEnum === ContentType.URL_ENCODE;
    }
    isAppJson() {
        return this._contentTypeEnum === ContentType.APP_JSON;
    }
    isMultipart() {
        return this._contentTypeEnum === ContentType.MULTIPART;
    }
    isRawData() {
        return this._contentTypeEnum === ContentType.RAW_TEXT;
    }
    isValidRequest() {
        return this._contentLength > 0 && this._contentTypeEnum !== ContentType.UNKNOWN;
    }
    validate(isMultipart) {
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
    saveAsSync(outdir) {
        this.validate(true);
        if (!fsw.mkdirSync(outdir))
            throw new Error(`Invalid outdir dir ${outdir}`);
        return this._parser.files.forEach(pf => {
            return pf.saveAsSync(_path.resolve(`${outdir}/${app_util_1.Util.guid()}_${pf.getFileName()}`));
        });
    }
    saveAs(outdir, next, errorHandler) {
        this.validate(true);
        return fsw.mkdir(outdir, "", (err) => {
            return errorHandler(err, () => {
                return this.getFiles((file, done) => {
                    if (!file || !done)
                        return next(null);
                    return file.saveAs(_path.resolve(`${outdir}/${app_util_1.Util.guid()}_${file.getFileName()}`), (serr) => {
                        return errorHandler(serr, () => {
                            return done();
                        });
                    });
                });
            });
        }, errorHandler);
    }
    getUploadFileInfo() {
        this.validate(true);
        const data = [];
        this._parser.files.forEach((file) => {
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
    getFilesSync(next) {
        this.validate(true);
        return this._parser.files.forEach(pf => next(pf));
    }
    getFiles(next) {
        this.validate(true);
        let index = -1;
        const forward = () => {
            index++;
            const pf = this._parser.files[index];
            if (!pf)
                return next();
            return next(pf, () => {
                return forward();
            });
        };
        return forward();
    }
    getJson() {
        this.isValidRequest();
        if (this._contentTypeEnum === ContentType.APP_JSON) {
            return app_util_1.Util.JSON.parse(this._parser.getRawData());
        }
        if (this._contentTypeEnum === ContentType.RAW_TEXT) {
            throw new Error("Raw Text data found. It's can not transform to json.");
        }
        const outObj = decodeBodyBuffer(this._parser.body);
        app_util_1.Util.extend(outObj, this._parser.getMultipartBody());
        return outObj;
    }
    getData() {
        this.validate(false);
        return this._parser.getRawData();
    }
    readDataAsync() {
        return this.parseSync();
    }
    parseSync() {
        return new Promise((resolve, reject) => {
            this.parse((err) => {
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    }
    tryFinish(onReadEnd) {
        if (!this._isReadEnd || this._part.length > 0)
            return void 0;
        const error = this._parser.getError();
        if (error)
            return onReadEnd(new Error(error));
        return onReadEnd();
    }
    skipPart(stream) {
        stream.resume();
    }
    onPart(onReadEnd) {
        return (stream) => {
            this._part.push(1);
            this._parser.onPart(stream, (forceExit) => {
                if (forceExit) {
                    this._part.length = 0;
                    this.skipPart(stream);
                    if (this._multipartParser) {
                        this._multipartParser.removeListener('part', this.onPart);
                        this._multipartParser.on("part", this.skipPart);
                    }
                }
                else {
                    this._part.shift();
                }
                return this.tryFinish(onReadEnd);
            }, this.skipFile);
        };
    }
    finalEvent(ev, onReadEnd) {
        return (err) => {
            if (ev === "close") {
                if (this._isReadEnd)
                    return;
                err = new Error("CLIENET_DISCONNECTED");
            }
            this._isReadEnd = true;
            this._part.length = 0;
            return onReadEnd(err);
        };
    }
    parse(onReadEnd) {
        if (!this.isValidRequest())
            return process.nextTick(() => onReadEnd(new Error("Invalid request defiend....")));
        if (this._contentTypeEnum === ContentType.APP_JSON ||
            this._contentTypeEnum === ContentType.URL_ENCODE ||
            this._contentTypeEnum === ContentType.RAW_TEXT) {
            if (this._contentLength > this._maxBuffLength) {
                return process.nextTick(() => onReadEnd(new Error(`Max buff length max:${this._maxBuffLength} > req:${this._contentLength} exceed for contentent type ${this._contentType}`)));
            }
        }
        if (this._contentTypeEnum === ContentType.URL_ENCODE ||
            this._contentTypeEnum === ContentType.APP_JSON ||
            this._contentTypeEnum === ContentType.RAW_TEXT) {
            this._req.on("data", (chunk) => {
                this._parser.onRawData(chunk);
            });
            this._req.on("end", () => {
                this._isReadEnd = true;
                return onReadEnd();
            });
            return;
        }
        const match = RE_BOUNDARY.exec(this._contentType);
        if (match) {
            this._multipartParser = new dicer_1.Dicer({ boundary: match[1] || match[2] });
            this._multipartParser.on("part", this.onPart(onReadEnd));
            this._multipartParser.on("finish", () => {
                this._isReadEnd = true;
                return this.tryFinish(onReadEnd);
            });
            this._multipartParser.on("error", this.finalEvent("error", onReadEnd));
            this._req.pipe(this._multipartParser);
        }
    }
    readData(onReadEnd) {
        return this.parse(onReadEnd);
    }
    dispose() {
        if (this._isDisposed)
            return;
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
        delete this._req;
        delete this._part;
        // @ts-ignore
        delete this._contentType;
        delete this._contentLength;
    }
    clear() {
        this.dispose();
    }
}
/** @deprecated since v2.0.3 - use `getBodyParser` instead. */
exports.PayloadParser = (() => {
    return { PayloadParser: (0, node_util_1.deprecate)(BodyParser, '`PayloadParser` is depreciated, please use `getBodyParser` instead.', 'v2.0.3:1') };
})().PayloadParser;
BodyParser.prototype.clear = (0, node_util_1.deprecate)(BodyParser.prototype.clear, '`BodyParser.clear` is depreciated, please use `BodyParser.dispose` instead.', 'v2.0.3:2');
BodyParser.prototype.readData = (0, node_util_1.deprecate)(BodyParser.prototype.readData, '`BodyParser.readData` is depreciated, please use `BodyParser.parse` instead.', 'v2.0.3:3');
BodyParser.prototype.readDataAsync = (0, node_util_1.deprecate)(BodyParser.prototype.readDataAsync, '`BodyParser.readDataAsync` is depreciated, please use `BodyParser.parseSync` instead.', 'v2.0.3:4');
PostedFileInfo.prototype.clear = (0, node_util_1.deprecate)(PostedFileInfo.prototype.clear, '`PostedFileInfo.clear` is depreciated, please use `PostedFileInfo.dispose` instead.', 'v2.0.3:5');
function getBodyParser(req, tempDir) {
    return new BodyParser(req, tempDir);
}
exports.getBodyParser = getBodyParser;
// 3:20 PM 5/6/2020
//# sourceMappingURL=body-parser.js.map