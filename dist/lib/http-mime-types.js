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
Object.defineProperty(exports, "__esModule", { value: true });
exports._mimeType = void 0;
exports.getMimeType = getMimeType;
exports.setMimeType = setMimeType;
exports.isValidExtension = isValidExtension;
// 12:04 AM 6/19/2020
// updated at 12:22 AM 11/12/2025
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const app_util_1 = require("./app-util");
class MimeType {
    constructor() {
        this._data = new Map();
        this._loadSync();
    }
    add(extension, value) {
        if (this._data.has(extension)) {
            throw new Error(`This given extension (${extension}) already exists`);
        }
        this._data.set(extension, value);
    }
    type(extension) {
        return this._data.get(extension);
    }
    _loadSync() {
        const libRoot = (0, app_util_1.getAppDir)();
        const absPath = _path.resolve(`${libRoot}/mime-types.json`);
        (0, app_util_1.assert)(_fs.existsSync(absPath), `No mime-type found in ${libRoot}\nPlease re-install cwserver`);
        const data = app_util_1.Util.JSON.parse(_fs.readFileSync(absPath, "utf-8"));
        if (data) {
            for (const prop in data) {
                this._data.set(prop, data[prop]);
            }
        }
    }
}
class MimeTypeStatic {
    static getInstance() {
        if (this._instance === null) {
            this._instance = new MimeType();
        }
        return this._instance;
    }
}
MimeTypeStatic._instance = null;
exports._mimeType = MimeTypeStatic.getInstance();
function setCharset(mimeType) {
    const text = mimeType.split(";")[0];
    if ((/^text\/|^application\/(javascript|json)/).test(text.toLowerCase())) {
        return `${mimeType}; charset=UTF-8`;
    }
    return mimeType;
}
function getMimeType(extension) {
    extension = extension.replace(/^.*[\.\/\\]/gi, '').toLowerCase();
    const mimeType = exports._mimeType.type(extension);
    if (!mimeType)
        throw new Error(`Unsupported extension =>${extension}`);
    return setCharset(mimeType);
}
function setMimeType(extension, value) {
    return exports._mimeType.add(extension, value);
}
function isValidExtension(extension) {
    return exports._mimeType.type(extension) ? true : false;
}
//# sourceMappingURL=http-mime-types.js.map