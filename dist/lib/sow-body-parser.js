"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBodyParser = exports.PayloadParser = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:17 PM 5/5/2020
const events_1 = require("events");
const util_1 = require("util");
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const dicer_1 = __importDefault(require("dicer"));
const stream_1 = require("stream");
const os_1 = __importDefault(require("os"));
const destroy = require("destroy");
const sow_static_1 = require("./sow-static");
const sow_util_1 = require("./sow-util");
const fsw = __importStar(require("./sow-fsw"));
function dispose(data) {
    while (true) {
        const instance = data.shift();
        if (!instance)
            break;
        instance.dispose();
    }
}
const incomingContentType = {
    URL_ENCODE: "application/x-www-form-urlencoded",
    APP_JSON: "application/json",
    MULTIPART: "multipart/form-data"
};
var ContentType;
(function (ContentType) {
    ContentType[ContentType["URL_ENCODE"] = 1] = "URL_ENCODE";
    ContentType[ContentType["APP_JSON"] = 2] = "APP_JSON";
    ContentType[ContentType["MULTIPART"] = 3] = "MULTIPART";
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
        this._fcontentDisposition = disposition;
        this._fname = fname;
        this._fileName = fileName;
        this._fcontentType = fcontentType;
        this._isMoved = false;
        this._isDisposed = false;
        this._tempFile = tempFile;
    }
    getTempPath() {
        return this._tempFile;
    }
    getContentDisposition() {
        return this._fcontentDisposition;
    }
    getName() {
        return this._fname;
    }
    getFileName() {
        return this._fileName;
    }
    getContentType() {
        return this._fcontentType;
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
        delete this._fcontentDisposition;
        delete this._fname;
        delete this._fileName;
        delete this._fcontentType;
        if (this._tempFile)
            delete this._tempFile;
    }
    clear() {
        this.dispose();
    }
}
const RE_BOUNDARY = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;
class MultipartDataReader extends events_1.EventEmitter {
    constructor() {
        super();
        this._isDisposed = false;
        this._forceExit = false;
    }
    get forceExit() {
        return this._forceExit;
    }
    destroy() {
        if (this._writeStream && !this._writeStream.destroyed)
            destroy(this._writeStream);
    }
    exit(reason) {
        this._forceExit = true;
        this.emit("end", new Error(reason));
    }
    read(partStream, tempDir) {
        let fieldName = "", fileName = "", disposition = "", contentType = "", isFile = false, data = "";
        partStream.on("header", (header) => {
            for (const [key, value] of Object.entries(header)) {
                if (sow_util_1.Util.isArrayLike(value)) {
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
                            data += fieldName += "=";
                            continue;
                        }
                        if (key === "content-type") {
                            contentType = part.trim();
                        }
                    }
                }
            }
            if (!isFile) {
                return partStream.on("data", (chunk) => {
                    data += chunk.toString();
                }).on("end", () => {
                    this.emit("field", data);
                    this.emit("end");
                }), void 0;
            }
            if (contentType.length > 0) {
                const tempFile = _path.resolve(`${tempDir}/${sow_util_1.Util.guid()}.temp`);
                this._writeStream = stream_1.pipeline(partStream, _fs.createWriteStream(tempFile, { 'flags': 'a' }), (err) => {
                    this.destroy();
                    this.emit("end", err);
                });
                this.emit("file", new PostedFileInfo(disposition, fieldName.replace(/"/gi, ""), fileName.replace(/"/gi, ""), contentType.replace(/"/gi, ""), tempFile));
            }
            else {
                return this.exit("Content type not found in requested file....");
            }
        });
    }
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        this.removeAllListeners();
        this.destroy();
    }
}
class DataParser {
    constructor(tempDir) {
        this._errors = [];
        this.files = [];
        this.bodyStr = "";
        this._tempDir = tempDir;
        this._readers = [];
    }
    onRawData(buff) {
        this.bodyStr += buff;
    }
    onPart(partStream, next) {
        const reader = new MultipartDataReader();
        reader.on("file", (file) => {
            return this.files.push(file), void 0;
        });
        reader.on("field", (data) => {
            if (this.bodyStr.length > 0) {
                this.bodyStr += "&";
            }
            return this.onRawData(data);
        });
        reader.on("end", (err) => {
            if (err) {
                this._errors.push(err);
            }
            next(reader.forceExit);
            return reader.dispose();
        });
        reader.read(partStream, this._tempDir);
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
    clear() {
        dispose(this._readers);
        dispose(this.files);
        if (this._errors)
            delete this._errors;
    }
}
class BodyParser {
    constructor(req, tempDir) {
        this._isDisposed = false;
        this._part = [];
        this._contentType = req.get("content-type") || "";
        this._contentLength = sow_static_1.ToNumber(req.get("content-length") || 0);
        if (this._contentType.indexOf(incomingContentType.MULTIPART) > -1) {
            this._contentTypeEnum = ContentType.MULTIPART;
        }
        else if (this._contentType.indexOf(incomingContentType.URL_ENCODE) > -1 && this._contentType === incomingContentType.URL_ENCODE) {
            this._contentTypeEnum = ContentType.URL_ENCODE;
        }
        else if (this._contentType.indexOf(incomingContentType.APP_JSON) > -1 && this._contentType === incomingContentType.APP_JSON) {
            this._contentTypeEnum = ContentType.APP_JSON;
        }
        else {
            this._contentTypeEnum = ContentType.UNKNOWN;
        }
        if (this._contentTypeEnum !== ContentType.UNKNOWN) {
            this._parser = new DataParser(tempDir || os_1.default.tmpdir());
            this._req = req;
        }
        else {
            this._parser = Object.create(null);
            this._req = Object.create(null);
        }
        this._isReadEnd = false;
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
            return pf.saveAsSync(_path.resolve(`${outdir}/${sow_util_1.Util.guid()}_${pf.getFileName()}`));
        });
    }
    saveAs(outdir, next, errorHandler) {
        this.validate(true);
        return fsw.mkdir(outdir, "", (err) => {
            return errorHandler(err, () => {
                return this.getFiles((file, done) => {
                    if (!file || !done)
                        return next(null);
                    return file.saveAs(_path.resolve(`${outdir}/${sow_util_1.Util.guid()}_${file.getFileName()}`), (serr) => {
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
        const bodyStr = this.getData();
        if (this._contentTypeEnum === ContentType.APP_JSON) {
            return JSON.parse(bodyStr);
        }
        const outObj = {};
        bodyStr.split("&").forEach((part) => {
            const kv = part.split("=");
            if (kv.length > 0) {
                const val = kv[1];
                outObj[decodeURIComponent(kv[0])] = val ? decodeURIComponent(val) : void 0;
            }
        });
        return outObj;
    }
    getData() {
        this.validate(false);
        return this._parser.bodyStr;
    }
    readDataAsync() {
        return new Promise((resolve, reject) => {
            this.readData((err) => {
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
    skipPart(partStream) {
        partStream.resume();
    }
    onPart(partStream, onReadEnd) {
        this._part.push(1);
        this._parser.onPart(partStream, (forceExit) => {
            if (forceExit) {
                this._part.length = 0;
                this.skipPart(partStream);
                if (this._multipartParser) {
                    this._multipartParser.removeListener('part', this.onPart);
                    this._multipartParser.on("part", this.skipPart);
                }
            }
            else {
                this._part.shift();
            }
            return this.tryFinish(onReadEnd);
        });
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
    readData(onReadEnd) {
        if (!this.isValidRequest())
            return onReadEnd(new Error("Invalid request defiend...."));
        if (this._contentTypeEnum === ContentType.URL_ENCODE || this._contentTypeEnum === ContentType.APP_JSON) {
            this._req.on("data", (chunk) => {
                this._parser.onRawData(chunk.toString());
            });
            this._req.on("end", () => {
                this._isReadEnd = true;
                return onReadEnd();
            });
            this._req.on("close", this.finalEvent("close", onReadEnd));
            return;
        }
        const match = RE_BOUNDARY.exec(this._contentType);
        if (match) {
            this._multipartParser = new dicer_1.default({ boundary: match[1] || match[2] });
            this._multipartParser.on("part", (stream) => {
                this.onPart(stream, onReadEnd);
            });
            this._multipartParser.on("finish", () => {
                this._isReadEnd = true;
                return this.tryFinish(onReadEnd);
            });
            this._multipartParser.on("error", this.finalEvent("error", onReadEnd));
            this._req.on("close", this.finalEvent("close", onReadEnd));
            this._req.pipe(this._multipartParser);
        }
    }
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        if (this._isReadEnd) {
            this._parser.clear();
            delete this._parser;
        }
        if (this._multipartParser) {
            this._req.unpipe(this._multipartParser);
            destroy(this._multipartParser);
            delete this._multipartParser;
        }
        delete this._req;
        delete this._part;
        delete this._contentType;
        delete this._contentLength;
    }
    clear() {
        this.dispose();
    }
}
/** @deprecated since v2.0.3 - use `getBodyParser` instead. */
exports.PayloadParser = (() => {
    return { PayloadParser: util_1.deprecate(BodyParser, '`PayloadParser` is depreciated, please use `getBodyParser` instead.', 'v2.0.3:1') };
})().PayloadParser;
BodyParser.prototype.clear = util_1.deprecate(BodyParser.prototype.clear, '`parser.clear` is depreciated, please use `parser.dispose` instead.', 'v2.0.3:2');
PostedFileInfo.prototype.clear = util_1.deprecate(PostedFileInfo.prototype.clear, '`file.clear` is depreciated, please use `file.dispose` instead.', 'v2.0.3:3');
function getBodyParser(req, tempDir) {
    return new BodyParser(req, tempDir);
}
exports.getBodyParser = getBodyParser;
// 3:20 PM 5/6/2020
//# sourceMappingURL=sow-body-parser.js.map