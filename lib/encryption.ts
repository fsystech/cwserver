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

import * as crypto from 'node:crypto';
import { TextDecoder } from 'node:util';

export interface ICryptoInfo {
    oldKey: string;
    md5?: string;
    key: Buffer | null;
    iv: Buffer | null;
}

export function md5(contents: string): string {
    return crypto
        .createHash('md5')
        .update(contents, 'utf8')
        .digest('hex');
}

export class CryptoInfo implements ICryptoInfo {
    public oldKey: string = '';
    public md5?: string = undefined;
    public key: Buffer | null = null;
    public iv: Buffer | null = null;
}

export class Encryption {
    private static readonly AES_ALGORITHM = 'aes-128-cbc';

    private static readonly UTF8_DECODER = new TextDecoder(
        'utf-8',
        { fatal: true }
    );

    public static utf8ToHex(str: string): string {
        return Buffer.from(str, 'utf8').toString('hex');
    }

    public static hexToUtf8(str: string): string {
        return Buffer.from(str, 'hex').toString('utf8');
    }

    public static toMd5(str: string): string {
        return md5(str);
    }

    public static updateCryptoKeyIV(key: string): ICryptoInfo {
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

    private static getCryptoParams(
        inf: ICryptoInfo
    ): { key: Buffer; iv: Buffer } {
        if (
            !inf.key || !inf.iv ||
            !Buffer.isBuffer(inf.key) ||
            !Buffer.isBuffer(inf.iv) ||
            inf.key.length !== 16 ||
            inf.iv.length !== 16
        ) {
            throw new Error('Invalid IV and key.');
        }

        return {
            key: inf.key,
            iv: inf.iv
        };
    }

    public static encrypt(
        plainText: string,
        inf: ICryptoInfo
    ): string {
        const { key, iv } = this.getCryptoParams(inf);

        const cipher = crypto.createCipheriv(
            this.AES_ALGORITHM,
            key,
            iv
        );

        return Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final()
        ]).toString('base64');
    }

    public static decrypt(
        encryptedText: string,
        inf: ICryptoInfo
    ): string {
        try {
            const { key, iv } = this.getCryptoParams(inf);

            const decipher = crypto.createDecipheriv(
                this.AES_ALGORITHM,
                key,
                iv
            );

            const decrypted = Buffer.concat([
                decipher.update(encryptedText, 'base64'),
                decipher.final()
            ]);

            // CryptoJS throws on malformed UTF-8; Buffer.toString()
            // replaces invalid sequences, so use a strict decoder.
            return this.UTF8_DECODER.decode(decrypted);
        } catch {
            return '';
        }
    }

    public static encryptToHex(
        plainText: string,
        inf: ICryptoInfo
    ): string {
        return this.utf8ToHex(this.encrypt(plainText, inf));
    }

    public static decryptFromHex(
        encryptedText: string,
        inf: ICryptoInfo
    ): string {
        return this.decrypt(this.hexToUtf8(encryptedText), inf);
    }

    public static encryptUri(
        plainText: string,
        inf: ICryptoInfo
    ): string {
        return encodeURIComponent(this.encrypt(plainText, inf));
    }

    public static decryptUri(
        encryptedText: string,
        inf: ICryptoInfo
    ): string {
        return this.decrypt(decodeURIComponent(encryptedText), inf);
    }
}