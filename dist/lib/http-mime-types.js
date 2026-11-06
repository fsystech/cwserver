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
const fsw_1 = require("./fsw");
class MimeType {
    /**
     * Creates the registry and loads the MIME types from the bundled mime-types.json file.
     */
    constructor() {
        this._data = new Map();
        this._loadSync();
    }
    /**
     * Registers a MIME type for an extension. Throws if the extension is already registered.
     *
     * @param extension Extension to register.
     * @param value MIME type string for the extension.
     */
    add(extension, value) {
        if (this._data.has(extension)) {
            throw new Error(`This given extension (${extension}) already exists`);
        }
        this._data.set(extension, value);
    }
    /**
     * Returns the registered MIME type for an extension.
     *
     * @param extension Extension to look up (without a leading dot).
     * @returns The MIME type, or undefined when not registered.
     */
    type(extension) {
        return this._data.get(extension);
    }
    /**
     * Reads mime-types.json from the application directory and fills the registry. Throws if the file is
     * missing or the registry was already populated.
     */
    _loadSync() {
        const absPath = _path.resolve((0, app_util_1.getAppDir)(), "mime-types.json");
        (0, app_util_1.assert)(_fs.existsSync(absPath), `No mime-type found in ${absPath}\nPlease re-install cwserver`);
        const data = (0, fsw_1.readJsonSync)(absPath);
        if (!data) {
            return;
        }
        if (this._data.size) {
            throw new Error("Mime type pre-add is not allowed.");
        }
        this._data = new Map(Object.entries(data));
    }
}
class MimeTypeStatic {
    /**
     * Returns the shared MimeType registry, creating it on first use.
     *
     * @returns The singleton MimeType instance.
     */
    static getInstance() {
        if (this._instance === null) {
            this._instance = new MimeType();
        }
        return this._instance;
    }
}
MimeTypeStatic._instance = null;
exports._mimeType = MimeTypeStatic.getInstance();
/**
 * Appends a UTF-8 charset to text/* and application/javascript or json MIME types that do not already
 * specify one.
 *
 * @param mimeType MIME type to adjust.
 * @returns The MIME type, with a charset appended when applicable.
 */
function setCharset(mimeType) {
    const type = mimeType.toLowerCase();
    if (!type.includes("charset=") &&
        (/^text\/|^application\/(javascript|json)/).test(type)) {
        return `${mimeType}; charset=UTF-8`;
    }
    return mimeType;
}
/**
 * Resolves the MIME type for a file extension or path, taking the part after the last dot or slash in
 * lower case. Throws when the extension is unsupported.
 *
 * @param extension Extension, file name or path to look up.
 * @returns The MIME type, with a charset for text-like types.
 */
function getMimeType(extension) {
    const ext = extension
        .replace(/^.*[./\\]/, "")
        .toLowerCase();
    const mimeType = exports._mimeType.type(ext);
    if (!mimeType) {
        throw new Error(`Unsupported extension => ${ext}`);
    }
    return setCharset(mimeType);
}
/**
 * Registers a new MIME type for an extension. Throws if the extension already exists.
 *
 * @param extension Extension to register.
 * @param value MIME type string for the extension.
 */
function setMimeType(extension, value) {
    return exports._mimeType.add(extension, value);
}
/**
 * Checks whether a MIME type is registered for the given extension.
 *
 * @param extension Extension to check (without a leading dot).
 * @returns True if the extension is registered, otherwise false.
 */
function isValidExtension(extension) {
    return exports._mimeType.type(extension) ? true : false;
}
//# sourceMappingURL=http-mime-types.js.map