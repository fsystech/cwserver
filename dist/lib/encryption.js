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
exports.Encryption = exports.CryptoInfo = void 0;
exports.md5 = md5;
// 6:22 PM 5/19/2020
// by rajib chy
const crypto = __importStar(require("node:crypto"));
const node_util_1 = require("node:util");
function md5(contents) {
    return crypto
        .createHash('md5')
        .update(contents, 'utf8')
        .digest('hex');
}
class CryptoInfo {
    constructor() {
        this.oldKey = '';
        this.md5 = undefined;
        this.key = null;
        this.iv = null;
    }
}
exports.CryptoInfo = CryptoInfo;
class Encryption {
    static utf8ToHex(str) {
        return Buffer.from(str, 'utf8').toString('hex');
    }
    static hexToUtf8(str) {
        return Buffer.from(str, 'hex').toString('utf8');
    }
    static toMd5(str) {
        return md5(str);
    }
    static updateCryptoKeyIV(key) {
        const res = new CryptoInfo();
        res.oldKey = key;
        res.md5 = this.toMd5(key);
        // MD5 hex digest produces a 16-byte AES-128 key.
        res.key = Buffer.from(res.md5, 'hex');
        // Preserve the legacy UTF-8 IV bytes.
        // CryptoJS accepts IVs of arbitrary length; Node requires 16 bytes.
        // Copying into a zero-filled buffer preserves the legacy behavior
        // of zero-padding short IVs and ignoring bytes beyond 16.
        res.iv = Buffer.alloc(16);
        Buffer.from(key, 'utf8').copy(res.iv, 0, 0, 16);
        return res;
    }
    static getCryptoParams(inf) {
        if (!inf.key || !inf.iv ||
            !Buffer.isBuffer(inf.key) ||
            !Buffer.isBuffer(inf.iv) ||
            inf.key.length !== 16 ||
            inf.iv.length !== 16) {
            throw new Error('Invalid IV and key.');
        }
        return {
            key: inf.key,
            iv: inf.iv
        };
    }
    static encrypt(plainText, inf) {
        const { key, iv } = this.getCryptoParams(inf);
        const cipher = crypto.createCipheriv(this.AES_ALGORITHM, key, iv);
        return Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final()
        ]).toString('base64');
    }
    static decrypt(encryptedText, inf) {
        try {
            const { key, iv } = this.getCryptoParams(inf);
            const decipher = crypto.createDecipheriv(this.AES_ALGORITHM, key, iv);
            const decrypted = Buffer.concat([
                decipher.update(encryptedText, 'base64'),
                decipher.final()
            ]);
            // CryptoJS throws on malformed UTF-8; Buffer.toString()
            // replaces invalid sequences, so use a strict decoder.
            return this.UTF8_DECODER.decode(decrypted);
        }
        catch (_a) {
            return '';
        }
    }
    static encryptToHex(plainText, inf) {
        return this.utf8ToHex(this.encrypt(plainText, inf));
    }
    static decryptFromHex(encryptedText, inf) {
        return this.decrypt(this.hexToUtf8(encryptedText), inf);
    }
    static encryptUri(plainText, inf) {
        return encodeURIComponent(this.encrypt(plainText, inf));
    }
    static decryptUri(encryptedText, inf) {
        return this.decrypt(decodeURIComponent(encryptedText), inf);
    }
}
exports.Encryption = Encryption;
Encryption.AES_ALGORITHM = 'aes-128-cbc';
Encryption.UTF8_DECODER = new node_util_1.TextDecoder('utf-8', { fatal: true });
//# sourceMappingURL=encryption.js.map