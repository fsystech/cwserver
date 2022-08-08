"use strict";
// Copyright (c) 2022 Safe Online World Ltd.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidExtension = exports.getMimeType = exports.loadMimeType = void 0;
// 12:04 AM 6/19/2020
// by rajib chy
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const sow_util_1 = require("./sow-util");
function loadMimeType() {
    const libRoot = (0, sow_util_1.getAppDir)();
    const absPath = _path.resolve(`${libRoot}/mime-types.json`);
    (0, sow_util_1.assert)(_fs.existsSync(absPath), `No mime-type found in ${libRoot}\nPlease re-install cwserver`);
    const data = sow_util_1.Util.JSON.parse(_fs.readFileSync(absPath, "utf-8"));
    return {
        add: (extension, val) => {
            if (data[extension])
                throw new Error(`This given extension (${extension}) already exists`);
            data[extension] = val;
            return void 0;
        },
        type: (extension) => {
            return data[extension];
        }
    };
}
exports.loadMimeType = loadMimeType;
function setCharset(mimeType) {
    const text = mimeType.split(";")[0];
    if ((/^text\/|^application\/(javascript|json)/).test(text.toLowerCase())) {
        return `${mimeType}; charset=UTF-8`;
    }
    return mimeType;
}
function getMimeType(extension) {
    extension = extension.replace(/^.*[\.\/\\]/gi, '').toLowerCase();
    const mimeType = global.sow.HttpMime.type(extension);
    if (!mimeType)
        throw new Error(`Unsupported extension =>${extension}`);
    return setCharset(mimeType);
}
exports.getMimeType = getMimeType;
function isValidExtension(extension) {
    return global.sow.HttpMime.type(extension) ? true : false;
}
exports.isValidExtension = isValidExtension;
//# sourceMappingURL=sow-http-mime-types.js.map