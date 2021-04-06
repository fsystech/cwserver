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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidExtension = exports.getMimeType = exports.loadMimeType = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 12:04 AM 6/19/2020
/// <reference types="node" />
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const sow_util_1 = require("./sow-util");
function loadMimeType() {
    const libRoot = sow_util_1.getLibRoot();
    const absPath = _path.resolve(`${libRoot}/mime-types.json`);
    sow_util_1.assert(_fs.existsSync(absPath), `No mime-type found in ${libRoot}\nPlease re-install cwserver`);
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