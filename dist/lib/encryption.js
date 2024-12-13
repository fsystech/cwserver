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
exports.Encryption = exports.CryptoInfo = void 0;
exports.md5 = md5;
// 6:22 PM 5/19/2020
// by rajib chy
const crypto_js_1 = __importDefault(require("crypto-js"));
const crypto = __importStar(require("node:crypto"));
function md5(contents) {
    return crypto.createHash('md5').update(contents).digest("hex");
}
class CryptoInfo {
    constructor() {
        this.oldKey = "";
        this.md5 = "";
        this.key = void 0;
        this.iv = void 0;
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
        res.key = crypto_js_1.default.enc.Hex.parse(res.md5);
        res.iv = crypto_js_1.default.enc.Hex.parse(this.utf8ToHex(res.oldKey));
        return res;
    }
    ;
    static encrypt(plainText, inf) {
        if (!inf.key)
            throw new Error("Invalid iv and key....");
        return crypto_js_1.default.AES.encrypt(plainText, inf.key, { iv: inf.iv }).toString();
    }
    static decrypt(encryptedText, inf) {
        if (!inf.key)
            throw new Error("Invalid iv and key....");
        try {
            const dec = crypto_js_1.default.AES.decrypt(crypto_js_1.default.lib.CipherParams.create({
                iv: inf.iv,
                ciphertext: crypto_js_1.default.enc.Base64.parse(encryptedText)
            }), inf.key, {
                iv: inf.iv
            });
            return crypto_js_1.default.enc.Utf8.stringify(dec);
        }
        catch (_a) {
            return "";
        }
    }
    static encryptToHex(plainText, inf) {
        const encryptedText = this.encrypt(plainText, inf);
        return this.utf8ToHex(encryptedText);
    }
    static decryptFromHex(encryptedText, inf) {
        encryptedText = this.hexToUtf8(encryptedText);
        return this.decrypt(encryptedText, inf);
    }
    static encryptUri(plainText, inf) {
        const encryptedText = this.encrypt(plainText, inf);
        return encodeURIComponent(encryptedText);
    }
    static decryptUri(encryptedText, inf) {
        encryptedText = decodeURIComponent(encryptedText);
        return this.decrypt(encryptedText, inf);
    }
}
exports.Encryption = Encryption;
//# sourceMappingURL=encryption.js.map