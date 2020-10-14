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
exports.Encryption = exports.CryptoInfo = exports.md5 = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
const crypto_js_1 = __importDefault(require("crypto-js"));
const crypto = __importStar(require("crypto"));
function md5(contents) {
    return crypto.createHash('md5').update(contents).digest("hex");
}
exports.md5 = md5;
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
//# sourceMappingURL=sow-encryption.js.map