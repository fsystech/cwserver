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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultipartDataReader = void 0;
// 10:11 PM 2/7/2026
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const node_stream_1 = require("node:stream");
const node_events_1 = require("node:events");
const destroy_1 = __importDefault(require("destroy"));
const app_util_1 = require("./app-util");
const app_static_1 = require("./app-static");
const posted_file_info_1 = require("./posted-file-info");
class MultipartDataReader extends node_events_1.EventEmitter {
    /**
     * Whether the reader aborted early because of an error.
     *
     * @returns True if a forced exit occurred.
     */
    get forceExit() {
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
    destroy() {
        if (this._writeStream && !this._writeStream.destroyed) {
            (0, destroy_1.default)(this._writeStream);
        }
    }
    /**
     * Marks a forced exit and emits an 'end' event with an error built from the reason.
     *
     * @param reason Message of the error to emit.
     */
    exit(reason) {
        this._forceExit = true;
        this.emit("end", new Error(reason));
    }
    /**
     * Default hook deciding whether to skip an uploaded file; it never skips. DataParser may replace it.
     *
     * @param fileInfo Information about the file being uploaded.
     * @returns False, meaning the file is kept.
     */
    skipFile(fileInfo) {
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
    read(stream, tempDir) {
        let fieldName = "", fileName = "", disposition = "", contentType = "", isFile = false;
        stream.once("header", (header) => {
            for (const [key, value] of Object.entries(header)) {
                if (!app_util_1.Util.isArrayLike(value))
                    continue;
                const part = value[0];
                if (!part)
                    continue;
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
                const body = new app_static_1.BufferArray();
                stream.on("data", (chunk) => {
                    body.push(chunk);
                }).on("end", () => {
                    this.emit("field", fieldName, body.data.toString());
                    body.dispose();
                    this.emit("end");
                });
                return;
            }
            if (contentType.length > 0) {
                const fileInfo = new posted_file_info_1.PostedFileInfo(disposition, fieldName.replace(/"/gi, ""), fileName.replace(/"/gi, ""), contentType.replace(/"/gi, ""), _path.resolve(`${tempDir}/${app_util_1.Util.UUID()}.temp`));
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
    }
    /**
     * Removes all listeners, destroys the write stream and clears state. Safe to call more than once.
     */
    dispose() {
        if (this._isDisposed)
            return;
        this._isDisposed = true;
        this.removeAllListeners();
        this.destroy();
        this._writeStream = null;
        this._forceExit = null;
    }
}
exports.MultipartDataReader = MultipartDataReader;
/**
 * Returns the text between the first occurrence of one separator and the next occurrence of another.
 *
 * @param data Text to search.
 * @param separator1 Separator marking the start.
 * @param separator2 Separator marking the end.
 * @returns The text between the separators, or an empty string if either is not found.
 */
function _extractBetween(data, separator1, separator2) {
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
//# sourceMappingURL=multipart-data-reader.js.map