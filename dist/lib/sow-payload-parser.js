"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const sow_static_1 = require("./sow-static");
const sow_util_1 = require("./sow-util");
const guid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
const getLine = (socket, data) => {
    let outstr = '';
    for (;;) {
        let c = socket.read(1);
        if (!c)
            return outstr;
        const str = c.toString();
        switch (str) {
            case '\n':
                outstr += str;
                data.push(c);
                return outstr;
            case '\r':
                outstr += str;
                data.push(c);
                c = socket.read(1);
                if (!c)
                    return outstr;
                outstr += c.toString();
                data.push(c);
                return outstr;
            default:
                outstr += str;
                data.push(c);
        }
    }
};
const getHeader = (headers, key) => {
    const result = headers[key];
    return typeof (result) === "string" ? result === null || result === void 0 ? void 0 : result.toString() : "";
};
const createDir = (tempDir) => {
    if (!_fs.existsSync(tempDir))
        sow_util_1.Util.mkdirSync(tempDir);
};
const incomingContentType = {
    URL_ENCODE: "application/x-www-form-urlencoded",
    MULTIPART: "multipart/form-data"
};
var ContentType;
(function (ContentType) {
    ContentType[ContentType["URL_ENCODE"] = 1] = "URL_ENCODE";
    ContentType[ContentType["MULTIPART"] = 2] = "MULTIPART";
    ContentType[ContentType["UNKNOWN"] = -1] = "UNKNOWN";
})(ContentType = exports.ContentType || (exports.ContentType = {}));
const extractBetween = (data, separator1, separator2) => {
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
};
const parseHeader = (data) => {
    const end = "\r\n";
    let part = data.substring(0, data.indexOf(end));
    const disposition = extractBetween(part, "Content-Disposition: ", ";");
    const name = extractBetween(part, "name=\"", ";");
    let filename = extractBetween(part, "filename=\"", "\"");
    part = data.substring(part.length + end.length);
    const cType = extractBetween(part, "Content-Type: ", "\r\n\r\n");
    filename = decodeURIComponent(filename);
    return new PostedFileInfo(disposition, name, filename, cType);
};
class PostedFileInfo {
    constructor(disposition, fname, fileName, fcontentType) {
        this._fcontentDisposition = disposition;
        this._fname = fname;
        this._fileName = fileName;
        this._fcontentType = fcontentType;
        this._fileSize = 0;
        this._isMoved = false;
        this._isDisposed = false;
    }
    setInfo(tempFile, fileSize) {
        if (tempFile)
            this._tempFile = tempFile;
        if (fileSize)
            this._fileSize = fileSize;
    }
    isEmptyHeader() {
        return this._fcontentType.length === 0;
    }
    getTempPath() {
        return this._tempFile;
    }
    getContentDisposition() {
        return this._fcontentDisposition;
    }
    getFileSize() {
        return this._fileSize;
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
    read() {
        if (!this._tempFile || this._isMoved)
            throw new Error("Method not implemented.");
        return _fs.readFileSync(this._tempFile);
    }
    saveAs(absPath) {
        if (!this._tempFile || this._isMoved === true)
            throw new Error("Method not implemented.");
        _fs.renameSync(this._tempFile, absPath);
        delete this._tempFile;
        this._isMoved = true;
    }
    clear() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        if (!this._isMoved && this._tempFile) {
            _fs.unlinkSync(this._tempFile);
        }
        delete this._fcontentDisposition;
        delete this._fname;
        delete this._fileName;
        delete this._fcontentType;
        if (this._tempFile)
            delete this._tempFile;
    }
}
exports.PostedFileInfo = PostedFileInfo;
class PayloadDataParser {
    constructor(tempDir, contentType, contentTypeEnum) {
        this._blockSize = 0;
        this._maxBlockSize = 10485760;
        this._errors = "";
        this._contentTypeEnum = contentTypeEnum;
        this.files = [];
        this.payloadStr = "";
        this._tempDir = tempDir;
        if (this._contentTypeEnum === ContentType.MULTIPART) {
            const bType = "boundary=";
            this._separator = `--${contentType.substring(contentType.indexOf(bType) + bType.length)}`.trim();
            this._sepLen = this._separator.length;
        }
        else {
            this._separator = "";
            this._sepLen = 0;
        }
        this._isStart = false;
        this._byteCount = 0;
        this._waitCount = 0;
        this._headerInfo = "";
        this._isDisposed = false;
    }
    onRawData(str) {
        this.payloadStr += str;
    }
    drain(force) {
        if (force || (this._blockSize > this._maxBlockSize)) {
            this._blockSize = 0;
            return new Promise((resolve, reject) => {
                if (this._writeStream) {
                    this._writeStream.once("drain", () => {
                        resolve();
                    });
                }
                else {
                    reject(new Error("stream not avilable...."));
                }
            });
        }
    }
    onData(line, buffer) {
        if (this._waitCount === 0 && (line.length < this._sepLen || line.indexOf(this._separator) < 0)) {
            if (!this._isStart)
                return;
            if (this._writeStream) {
                const readLen = buffer.length;
                this._byteCount += readLen;
                this._blockSize += readLen;
                if (this._writeStream.write(buffer))
                    return this.drain(false);
                return this.drain(true);
            }
            return;
        }
        if (this._isStart && this._writeStream) {
            this._writeStream.end();
            this._isStart = false;
            delete this._writeStream;
            if (this._postedFile) {
                this._postedFile.setInfo(void 0, this._byteCount);
                this.files.push(this._postedFile);
                this._postedFile = void 0;
                this._byteCount = 0;
            }
        }
        if (this._waitCount > 2) {
            this._waitCount = 0;
            this._headerInfo += line;
            this._postedFile = parseHeader(this._headerInfo);
            this._headerInfo = "";
            if (this._postedFile.isEmptyHeader()) {
                this._postedFile.clear();
                this._postedFile = void 0;
                return;
            }
            const tempFile = _path.resolve(`${this._tempDir}/${guid()}.temp`);
            this._writeStream = _fs.createWriteStream(tempFile);
            this._postedFile.setInfo(tempFile);
            this._isStart = true;
            return;
        }
        if (this._waitCount === 0) {
            this._headerInfo = "";
            this._waitCount++;
            return;
        }
        if (this._waitCount < 3) {
            this._headerInfo += line;
            this._waitCount++;
            return;
        }
    }
    getError() {
        if (this._errors.length > 0) {
            return this._errors;
        }
    }
    endCurrentStream(exit) {
        if (this._writeStream && this._isStart === true) {
            this._writeStream.end();
            if (this._postedFile) {
                if (exit === false) {
                    this._postedFile.setInfo(void 0, this._byteCount);
                    this.files.push(this._postedFile);
                }
                else {
                    this._postedFile.clear();
                    this._postedFile = Object.create(null);
                }
                this._isStart = false;
                this._byteCount = 0;
                delete this._postedFile;
            }
            delete this._writeStream;
        }
    }
    onEnd() {
        if (this._contentTypeEnum === ContentType.MULTIPART) {
            return this.endCurrentStream(false);
        }
    }
    clear() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        this.files.forEach(pf => pf.clear());
        this.endCurrentStream(true);
        this.files.length = 0;
        if (this._writeStream)
            delete this._writeStream;
        if (this._postedFile)
            delete this._postedFile;
        if (this._errors)
            delete this._errors;
    }
}
class PayloadParser {
    constructor(req, tempDir) {
        this._isDisposed = false;
        createDir(tempDir);
        if (!_fs.statSync(tempDir).isDirectory()) {
            throw new Error(`Invalid temp dir ${tempDir}`);
        }
        this._contentType = getHeader(req.headers, "content-type");
        this._contentLength = sow_static_1.ToNumber(getHeader(req.headers, "content-length"));
        if (this._contentType.indexOf(incomingContentType.MULTIPART) > -1) {
            this._contentTypeEnum = ContentType.MULTIPART;
        }
        else if (this._contentType.indexOf(incomingContentType.URL_ENCODE) > -1) {
            this._contentTypeEnum = ContentType.URL_ENCODE;
        }
        else {
            this._contentTypeEnum = ContentType.UNKNOWN;
        }
        if (this._contentTypeEnum !== ContentType.UNKNOWN) {
            this._payloadDataParser = new PayloadDataParser(tempDir, this._contentType, this._contentTypeEnum);
            this._req = req;
        }
        else {
            this._payloadDataParser = Object.create(null);
            this._req = Object.create(null);
        }
        this._isReadEnd = false;
        this._clientConnected = true;
    }
    isUrlEncoded() {
        return this._contentTypeEnum === ContentType.URL_ENCODE;
    }
    isMultipart() {
        return this._contentTypeEnum === ContentType.MULTIPART;
    }
    isValidRequest() {
        return this._contentLength > 0 && this._contentTypeEnum !== ContentType.UNKNOWN;
    }
    saveAs(outdir) {
        if (!this.isValidRequest())
            throw new Error("Invalid request defiend....");
        if (!this._isReadEnd)
            throw new Error("Data did not read finished yet...");
        createDir(outdir);
        if (!_fs.statSync(outdir).isDirectory()) {
            throw new Error(`Invalid outdir dir ${outdir}`);
        }
        this._payloadDataParser.files.forEach(pf => {
            pf.saveAs(_path.resolve(`${outdir}/${pf.getFileName()}`));
        });
    }
    getFiles(next) {
        if (!this.isValidRequest())
            throw new Error("Invalid request defiend....");
        if (!this._isReadEnd)
            throw new Error("Data did not read finished yet...");
        this._payloadDataParser.files.forEach((pf) => next(pf));
        return void 0;
    }
    getJson() {
        const payLoadStr = this.getData();
        const outObj = {};
        payLoadStr.split("&").forEach(part => {
            const kv = part.split("=");
            if (kv.length === 0)
                return;
            const val = kv[1];
            outObj[decodeURIComponent(kv[0])] = val ? decodeURIComponent(val) : void 0;
        });
        return outObj;
    }
    getData() {
        if (!this.isValidRequest())
            throw new Error("Invalid request defiend....");
        if (!this._isReadEnd)
            throw new Error("Data did not read finished yet...");
        if (this._contentTypeEnum !== ContentType.URL_ENCODE)
            throw new Error("You can invoke this method only URL_ENCODE content type...");
        return this._payloadDataParser.payloadStr;
    }
    readDataAsync() {
        return new Promise((resolve, reject) => {
            this.readData((err) => {
                if (err)
                    return reject(typeof (err) === "string" ? new Error(err) : err);
                return resolve();
            });
        });
    }
    readData(onReadEnd) {
        if (!this.isValidRequest())
            throw new Error("Invalid request defiend....");
        if (this._contentTypeEnum === ContentType.URL_ENCODE) {
            this._req.socket.on("data", (chunk) => {
                return this._payloadDataParser.onRawData(chunk.toString());
            });
        }
        else {
            this._req.socket.on("readable", (...args) => __awaiter(this, void 0, void 0, function* () {
                while (true) {
                    if (!this._clientConnected)
                        break;
                    const buffer = [];
                    const data = getLine(this._req.socket, buffer);
                    if (data === '') {
                        break;
                    }
                    const promise = this._payloadDataParser.onData(data, Buffer.concat(buffer));
                    buffer.length = 0;
                    if (promise) {
                        yield promise;
                    }
                }
            }));
        }
        this._req.socket.on("close", () => {
            this._clientConnected = false;
            if (!this._isReadEnd) {
                this._isReadEnd = true;
                this.clear();
                return onReadEnd("CLIENET_DISCONNECTED");
            }
        });
        this._req.socket.on("end", () => {
            this._payloadDataParser.onEnd();
            this._isReadEnd = true;
            const error = this._payloadDataParser.getError();
            if (error)
                return onReadEnd(new Error(error));
            return onReadEnd();
        });
    }
    clear() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        if (this._isReadEnd) {
            this._payloadDataParser.clear();
            this._payloadDataParser = Object.create(null);
            this._req = Object.create(null);
        }
    }
}
exports.PayloadParser = PayloadParser;
//# sourceMappingURL=sow-payload-parser.js.map