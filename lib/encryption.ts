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

// 6:22 PM 5/19/2020
// by rajib chy
import CryptoJS from 'crypto-js';
import * as crypto from 'node:crypto';
export interface ICryptoInfo {
    oldKey: string;
    md5?: string;
    key: any;
    iv: any;
}
export function md5(contents: string): string {
    return crypto.createHash('md5').update(contents).digest("hex");
}
export class CryptoInfo implements ICryptoInfo {
    oldKey: string;
    md5?: string;
    key: any;
    iv: any;
    constructor() {
        this.oldKey = ""; this.md5 = "";
        this.key = void 0; this.iv = void 0;
    }
}
export class Encryption {
    public static utf8ToHex(str: string) {
        return Buffer.from(str, 'utf8').toString('hex');
    }
    public static hexToUtf8(str: string) {
        return Buffer.from(str, 'hex').toString('utf8');
    }
    public static toMd5(str: string): string {
        return md5(str);
    }
    public static updateCryptoKeyIV(key: string): ICryptoInfo {
        const res = new CryptoInfo();
        res.oldKey = key;
        res.md5 = this.toMd5(key);
        res.key = CryptoJS.enc.Hex.parse(res.md5);
        res.iv = CryptoJS.enc.Hex.parse(this.utf8ToHex(res.oldKey));
        return res;
    }
    public static encrypt(plainText: string, inf: ICryptoInfo): string {
        if (!inf.key) throw new Error("Invalid iv and key....");
        return CryptoJS.AES.encrypt(plainText, inf.key, { iv: inf.iv }).toString();
    }
    public static decrypt(encryptedText: string, inf: ICryptoInfo): string {
        if (!inf.key) throw new Error("Invalid iv and key....");
        try {
            const dec = CryptoJS.AES.decrypt(CryptoJS.lib.CipherParams.create({
                iv: inf.iv,
                ciphertext: CryptoJS.enc.Base64.parse(encryptedText)
            }), inf.key, {
                iv: inf.iv
            });
            return CryptoJS.enc.Utf8.stringify(dec);
        } catch {
            return "";
        }
    }
    public static encryptToHex(plainText: string, inf: ICryptoInfo): string {
        const encryptedText = this.encrypt(plainText, inf);
        return this.utf8ToHex(encryptedText);
    }
    public static decryptFromHex(encryptedText: string, inf: ICryptoInfo): string {
        encryptedText = this.hexToUtf8(encryptedText);
        return this.decrypt(encryptedText, inf);
    }
    public static encryptUri(plainText: string, inf: ICryptoInfo): string {
        const encryptedText = this.encrypt(plainText, inf);
        return encodeURIComponent(encryptedText);
    }
    public static decryptUri(encryptedText: string, inf: ICryptoInfo): string {
        encryptedText = decodeURIComponent(encryptedText);
        return this.decrypt(encryptedText, inf);
    }
}