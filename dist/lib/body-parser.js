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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeBodyBuffer = decodeBodyBuffer;
exports.getBodyParser = getBodyParser;
// 11:17 PM 5/5/2020
// by rajib chy
const node_util_1 = require("node:util");
const _path = __importStar(require("node:path"));
const dicer_1 = require("./dicer");
const node_os_1 = __importDefault(require("node:os"));
const destroy_1 = __importDefault(require("destroy"));
const app_static_1 = require("./app-static");
const app_util_1 = require("./app-util");
const fsw = __importStar(require("./fsw"));
const data_parser_1 = require("./data-parser");
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
const RE_BOUNDARY = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;
/**
 * Decodes a URL-encoded component after converting plus signs to spaces.
 *
 * @param str The URL-encoded string to decode.
 * @returns The decoded string. Throws URIError if the input contains malformed percent-encoding.
 */
function decode(str) {
    return decodeURIComponent(str.replace(/\+/g, ' '));
}
/**
 * Parses a URL-encoded request body buffer into a flat key/value object, decoding keys and values.
 * Pairs with an empty value are skipped.
 *
 * @param buff Buffer holding the application/x-www-form-urlencoded body, decoded as UTF-8.
 * @returns An object mapping each decoded key to its decoded non-empty value.
 */
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
const MaxBuffLength = 1024 * 1024 * 20; // (20mb)
class BodyParser {
    /**
     * Creates a body parser for a request, detecting the content type (multipart, URL-encoded, JSON or raw
     * text) from the content-type header and reading the content-length. Unsupported content types leave
     * the parser in an invalid state.
     *
     * @param req The incoming request whose headers and stream are used.
     * @param tempDir Directory used to store uploaded files temporarily; defaults to the OS temp directory.
     */
    constructor(req, tempDir) {
        this._isDisposed = false;
        this._part = [];
        this._maxBuffLength = MaxBuffLength;
        this._contentType = (0, app_static_1.toString)(req.get("content-type"));
        this._contentLength = (0, app_static_1.toNumber)(req.get("content-length"));
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
            this._parser = new data_parser_1.DataParser(tempDir || node_os_1.default.tmpdir());
            this._req = req;
        }
        else {
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
    setMaxBuffLength(length) {
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
    isUrlEncoded() {
        return this._contentTypeEnum === ContentType.URL_ENCODE;
    }
    /**
     * Checks whether the request content type is JSON.
     *
     * @returns True if the body is application/json.
     */
    isAppJson() {
        return this._contentTypeEnum === ContentType.APP_JSON;
    }
    /**
     * Checks whether the request content type is multipart.
     *
     * @returns True if the body is multipart form data.
     */
    isMultipart() {
        return this._contentTypeEnum === ContentType.MULTIPART;
    }
    /**
     * Checks whether the request content type is raw text.
     *
     * @returns True if the body is raw text data.
     */
    isRawData() {
        return this._contentTypeEnum === ContentType.RAW_TEXT;
    }
    /**
     * Checks whether the request has a positive content length and a supported content type.
     *
     * @returns True if the request body can be parsed.
     */
    isValidRequest() {
        return this._contentLength > 0 && this._contentTypeEnum !== ContentType.UNKNOWN;
    }
    /**
     * Verifies the parser is ready to expose parsed data. Throws an Error if the parser is disposed, the
     * request is invalid, the body has not finished reading, or multipart is required but the request is
     * not multipart.
     *
     * @param isMultipart Whether the request must be multipart form data.
     */
    validate(isMultipart) {
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
    saveAsSync(outdir) {
        this.validate(true);
        if (!fsw.mkdirSync(outdir))
            throw new Error(`Invalid outdir dir ${outdir}`);
        return this._parser.files.forEach(pf => {
            return pf.saveAsSync(_path.resolve(`${outdir}/${app_util_1.Util.UUID()}_${pf.getFileName()}`));
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
    saveAsAsync(outdir) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validate(true);
            yield fsw.mkdirAsyncx(outdir);
            yield Promise.all(this._parser.files.map(pf => pf.saveAsAsync(_path.resolve(`${outdir}/${app_util_1.Util.UUID()}_${pf.getFileName()}`))));
        });
    }
    /**
     * Callback-style wrapper around saveAsAsync that saves all uploaded files to a directory.
     *
     * @param outdir Destination directory path for the uploaded files.
     * @param next Callback invoked with null after all files are saved.
     * @param errorHandler Handler called with the error and the next callback when saving fails.
     */
    saveAs(outdir, next, errorHandler) {
        this.saveAsAsync(outdir).then(() => next(null)).catch(ex => errorHandler(ex, next));
    }
    /**
     * Returns metadata for every uploaded file in a multipart request. Throws if the parser state is
     * invalid or the request is not multipart.
     *
     * @returns An array of objects with content type, field name, file name, content disposition and temp path for
     *   each file.
     */
    getUploadFileInfo() {
        this.validate(true);
        return this._parser.files.map(file => ({
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
    getFilesSync(next) {
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
    getFilesAsync(next) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validate(true);
            const files = this._parser.files;
            if (files.length === 0)
                return;
            const promises = [];
            for (const file of files) {
                promises.push(next(file));
            }
            yield Promise.all(promises);
        });
    }
    /**
     * Iterates the uploaded files sequentially, advancing to the next file when the callback calls done.
     * The callback is called with no arguments once all files have been visited.
     *
     * @param next Callback receiving each file and a done function to move on, or no arguments at the end.
     */
    getFiles(next) {
        this.validate(true);
        let index = -1;
        /**
         * Advances to the next uploaded file and passes it, with a continuation, to the callback; calls the
         * callback without arguments when no files remain.
         */
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
    /**
     * Builds an object of the request data. For JSON bodies it parses the raw data; for URL-encoded or
     * multipart bodies it merges decoded body fields with multipart fields. Throws if the body is raw
     * text.
     *
     * @returns An object containing the parsed request data.
     */
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
    /**
     * Returns the raw request body as a string. Throws if the parser state is invalid or the body is not
     * fully read.
     *
     * @returns The raw body text, including any multipart fields appended as key=value pairs.
     */
    getData() {
        this.validate(false);
        return this._parser.getRawData();
    }
    /**
     * Reads the request body. Resolves when the whole body has been read
     * and rejects on a read/parse error or when the client disconnects.
     */
    parseAsync() {
        return new Promise((resolve, reject) => {
            this._read((err) => {
                err ? reject(err) : resolve();
            });
        });
    }
    /** @deprecated Use {@link parseAsync} */
    parse(onReadEnd) {
        this.parseAsync().then(() => onReadEnd(), (err) => onReadEnd(err));
    }
    /**
     * Completes reading when the body has ended and no parts are pending, reporting any parser error or
     * success to the callback.
     *
     * @param onReadEnd Callback invoked with an Error on failure or with no arguments on success.
     */
    tryFinish(onReadEnd) {
        if (!this._isReadEnd || this._part.length > 0)
            return void 0;
        const error = this._parser.getError();
        if (error)
            return onReadEnd(new Error(error));
        return onReadEnd();
    }
    /**
     * Discards a multipart part by resuming its stream.
     *
     * @param stream The part stream to drain.
     */
    skipPart(stream) {
        stream.resume();
    }
    /**
     * Creates the handler for multipart 'part' events. It tracks pending parts, delegates each to the data
     * parser and, on forced exit, stops further parts and finishes.
     *
     * @param onReadEnd Callback invoked when reading finishes or fails.
     * @returns A function that processes one part stream.
     */
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
    /**
     * Creates a handler for stream close or error events that marks reading as finished and reports the
     * result. A close before the body completed is reported as a client disconnect.
     *
     * @param ev The event type being handled, close or error.
     * @param onReadEnd Callback invoked with the resulting error, if any.
     * @returns A function that receives the optional error and finishes reading.
     */
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
    /**
     * Starts reading the request body. For JSON, URL-encoded and raw text it buffers data events; for
     * multipart it pipes the request into a Dicer parser. Reports errors for disposed or invalid state,
     * oversized bodies and a bad content-type boundary.
     *
     * @param onReadEnd Callback invoked with an Error on failure or with no arguments when reading completes.
     */
    _read(onReadEnd) {
        if (this._isDisposed)
            return onReadEnd(new Error("BodyParser is disposed state"));
        if (!this.isValidRequest()) {
            return process.nextTick(() => onReadEnd(new Error("Invalid request defiend....")));
        }
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
        if (!match) {
            return process.nextTick(() => {
                onReadEnd(new Error(`Invalid or incomplete Content-Type header: ${this._contentType}`));
            });
        }
        this._multipartParser = new dicer_1.Dicer({
            boundary: match[1] || match[2]
        });
        this._multipartParser.on("part", this.onPart(onReadEnd));
        this._multipartParser.on("finish", () => {
            this._isReadEnd = true;
            return this.tryFinish(onReadEnd);
        });
        this._multipartParser.on("error", this.finalEvent("error", onReadEnd));
        this._req.pipe(this._multipartParser);
    }
    /**
     * Releases the parser, its data parser, the multipart stream and request references. Safe to call more
     * than once.
     */
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        if (this._isReadEnd) {
            this._parser.dispose();
            this._parser = null;
        }
        if (this._multipartParser) {
            this._req.unpipe(this._multipartParser);
            (0, destroy_1.default)(this._multipartParser);
            this._multipartParser = null;
        }
        this._req = null;
        this._part = null;
        this._contentType = null;
        this._contentLength = null;
    }
}
BodyParser.prototype.parse = (0, node_util_1.deprecate)(BodyParser.prototype.parse, '`BodyParser.parse` is depreciated, please use `BodyParser.parseAsync` instead.', '4.1.2');
/**
 * Creates a body parser for the given request.
 *
 * @param req The incoming request to parse.
 * @param tempDir Optional directory for temporary uploaded files.
 * @returns A new body parser instance.
 */
function getBodyParser(req, tempDir) {
    return new BodyParser(req, tempDir);
}
// 3:20 PM 5/6/2020
//# sourceMappingURL=body-parser.js.map