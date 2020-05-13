"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
const crypto_js_1 = __importDefault(require("crypto-js"));
const js_base64_1 = require("js-base64");
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
// tslint:disable-next-line: max-classes-per-file
// tslint:disable-next-line: no-namespace
var Encryption;
(function (Encryption) {
    function convert(from, to) {
        return str => Buffer.from(str, from).toString(to);
    }
    Encryption.convert = convert;
    function utf8ToHex(str) {
        return Buffer.from(str, 'utf8').toString('hex');
    }
    Encryption.utf8ToHex = utf8ToHex;
    function hexToUtf8(str) {
        return Buffer.from(str, 'hex').toString('utf8');
    }
    Encryption.hexToUtf8 = hexToUtf8;
    function toMd5(str) {
        return md5(str);
    }
    Encryption.toMd5 = toMd5;
    function updateCryptoKeyIV(key) {
        const res = new CryptoInfo();
        res.oldKey = key;
        res.md5 = void 0;
        res.md5 = toMd5(res.oldKey);
        res.key = crypto_js_1.default.lib.WordArray.create(res.md5);
        res.iv = crypto_js_1.default.lib.WordArray.create(res.oldKey);
        return res;
    }
    Encryption.updateCryptoKeyIV = updateCryptoKeyIV;
    ;
    function encrypt(plainText, inf) {
        if (!inf.key)
            throw new Error("Invalid iv and key....");
        crypto_js_1.default.SHA3("Message", undefined, { outputLength: 512 });
        return crypto_js_1.default.AES.encrypt(plainText, inf.key, { iv: inf.iv }).toString();
    }
    Encryption.encrypt = encrypt;
    function decrypt(encryptedText, inf) {
        if (!inf.key)
            throw new Error("Invalid iv and key....");
        try {
            const dec = crypto_js_1.default.AES.decrypt({
                iv: inf.iv,
                salt: "",
                ciphertext: crypto_js_1.default.enc.Base64.parse(encryptedText)
            }, inf.key, {
                iv: inf.iv
            });
            return crypto_js_1.default.enc.Utf8.stringify(dec);
        }
        catch (e) {
            return "";
        }
    }
    Encryption.decrypt = decrypt;
    function encryptToHex(plainText, inf) {
        const encryptedText = encrypt(plainText, inf);
        return utf8ToHex(encryptedText);
    }
    Encryption.encryptToHex = encryptToHex;
    function decryptFromHex(encryptedText, inf) {
        encryptedText = hexToUtf8(encryptedText);
        return decrypt(encryptedText, inf);
    }
    Encryption.decryptFromHex = decryptFromHex;
    function encryptUri(plainText, inf) {
        const encryptedText = encrypt(plainText, inf);
        return encodeURIComponent(encryptedText);
    }
    Encryption.encryptUri = encryptUri;
    function decryptUri(encryptedText, inf) {
        encryptedText = decodeURIComponent(encryptedText);
        return decrypt(encryptedText, inf);
    }
    Encryption.decryptUri = decryptUri;
    function base64Encode(decoded) {
        return js_base64_1.Base64.atob(decoded);
    }
    Encryption.base64Encode = base64Encode;
    function base64Decode(encoded) {
        return js_base64_1.Base64.btoa(encoded);
    }
    Encryption.base64Decode = base64Decode;
})(Encryption = exports.Encryption || (exports.Encryption = {}));
//# sourceMappingURL=sow-encryption.js.map