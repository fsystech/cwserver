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

/**
 * Computes the MD5 hash of a UTF-8 string.
 *
 * @param contents Text to hash.
 * @returns The MD5 digest as a lowercase hex string.
 */
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

    /**
     * Encodes a UTF-8 string as hexadecimal.
     *
     * @param str Text to encode.
     * @returns The hex representation of the string's UTF-8 bytes.
     */
    public static utf8ToHex(str: string): string {
        return Buffer.from(str, 'utf8').toString('hex');
    }

    /**
     * Decodes a hexadecimal string into UTF-8 text.
     *
     * @param str Hex string to decode.
     * @returns The decoded text.
     */
    public static hexToUtf8(str: string): string {
        return Buffer.from(str, 'hex').toString('utf8');
    }

    /**
     * Computes the MD5 hash of a string; alias for md5.
     *
     * @param str Text to hash.
     * @returns The MD5 digest as a hex string.
     */
    public static toMd5(str: string): string {
        return md5(str);
    }

    /**
     * Derives AES-128 key and IV material from a passphrase: the key is the MD5 digest bytes and the IV is
     * the first 16 UTF-8 bytes of the passphrase, zero-padded.
     *
     * @param key Passphrase to derive the key and IV from.
     * @returns Crypto info holding the original key, its MD5, the 16-byte key and the 16-byte IV.
     */
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

    /**
     * Validates the crypto info and extracts its key and IV. Throws an Error if either is missing or not a
     * 16-byte Buffer.
     *
     * @param inf Crypto info containing the key and IV.
     * @returns Object with the validated key and iv buffers.
     */
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

    /**
     * Encrypts text with AES-128-CBC using the key and IV from the crypto info. Throws if the crypto info
     * is invalid.
     *
     * @param plainText Text to encrypt.
     * @param inf Crypto info with the key and IV.
     * @returns The ciphertext encoded as base64.
     */
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

    /**
     * Decrypts base64 AES-128-CBC ciphertext into UTF-8 text. Never throws: any failure (bad key, corrupt
     * data, invalid UTF-8) yields an empty string.
     *
     * @param encryptedText Base64 ciphertext.
     * @param inf Crypto info with the key and IV.
     * @returns The decrypted text, or an empty string on failure.
     */
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

    /**
     * Encrypts text and hex-encodes the base64 ciphertext.
     *
     * @param plainText Text to encrypt.
     * @param inf Crypto info with the key and IV.
     * @returns The hex-encoded ciphertext.
     */
    public static encryptToHex(
        plainText: string,
        inf: ICryptoInfo
    ): string {
        return this.utf8ToHex(this.encrypt(plainText, inf));
    }

    /**
     * Decrypts hex-encoded ciphertext produced by encryptToHex.
     *
     * @param encryptedText Hex-encoded ciphertext.
     * @param inf Crypto info with the key and IV.
     * @returns The decrypted text, or an empty string on failure.
     */
    public static decryptFromHex(
        encryptedText: string,
        inf: ICryptoInfo
    ): string {
        return this.decrypt(this.hexToUtf8(encryptedText), inf);
    }

    /**
     * Encrypts text and URI-encodes the base64 ciphertext so it is safe in URLs.
     *
     * @param plainText Text to encrypt.
     * @param inf Crypto info with the key and IV.
     * @returns The URI-encoded ciphertext.
     */
    public static encryptUri(
        plainText: string,
        inf: ICryptoInfo
    ): string {
        return encodeURIComponent(this.encrypt(plainText, inf));
    }

    /**
     * Decodes URI-encoded ciphertext and decrypts it. decodeURIComponent may throw on malformed input.
     *
     * @param encryptedText URI-encoded ciphertext.
     * @param inf Crypto info with the key and IV.
     * @returns The decrypted text, or an empty string if decryption fails.
     */
    public static decryptUri(
        encryptedText: string,
        inf: ICryptoInfo
    ): string {
        return this.decrypt(decodeURIComponent(encryptedText), inf);
    }
}