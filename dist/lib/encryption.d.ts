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
export declare function md5(contents: string): string;
export declare class CryptoInfo implements ICryptoInfo {
    oldKey: string;
    md5?: string;
    key: Buffer | null;
    iv: Buffer | null;
}
export declare class Encryption {
    private static readonly AES_ALGORITHM;
    private static readonly UTF8_DECODER;
    /**
     * Encodes a UTF-8 string as hexadecimal.
     *
     * @param str Text to encode.
     * @returns The hex representation of the string's UTF-8 bytes.
     */
    static utf8ToHex(str: string): string;
    /**
     * Decodes a hexadecimal string into UTF-8 text.
     *
     * @param str Hex string to decode.
     * @returns The decoded text.
     */
    static hexToUtf8(str: string): string;
    /**
     * Computes the MD5 hash of a string; alias for md5.
     *
     * @param str Text to hash.
     * @returns The MD5 digest as a hex string.
     */
    static toMd5(str: string): string;
    /**
     * Derives AES-128 key and IV material from a passphrase: the key is the MD5 digest bytes and the IV is
     * the first 16 UTF-8 bytes of the passphrase, zero-padded.
     *
     * @param key Passphrase to derive the key and IV from.
     * @returns Crypto info holding the original key, its MD5, the 16-byte key and the 16-byte IV.
     */
    static updateCryptoKeyIV(key: string): ICryptoInfo;
    /**
     * Validates the crypto info and extracts its key and IV. Throws an Error if either is missing or not a
     * 16-byte Buffer.
     *
     * @param inf Crypto info containing the key and IV.
     * @returns Object with the validated key and iv buffers.
     */
    private static getCryptoParams;
    /**
     * Encrypts text with AES-128-CBC using the key and IV from the crypto info. Throws if the crypto info
     * is invalid.
     *
     * @param plainText Text to encrypt.
     * @param inf Crypto info with the key and IV.
     * @returns The ciphertext encoded as base64.
     */
    static encrypt(plainText: string, inf: ICryptoInfo): string;
    /**
     * Decrypts base64 AES-128-CBC ciphertext into UTF-8 text. Never throws: any failure (bad key, corrupt
     * data, invalid UTF-8) yields an empty string.
     *
     * @param encryptedText Base64 ciphertext.
     * @param inf Crypto info with the key and IV.
     * @returns The decrypted text, or an empty string on failure.
     */
    static decrypt(encryptedText: string, inf: ICryptoInfo): string;
    /**
     * Encrypts text and hex-encodes the base64 ciphertext.
     *
     * @param plainText Text to encrypt.
     * @param inf Crypto info with the key and IV.
     * @returns The hex-encoded ciphertext.
     */
    static encryptToHex(plainText: string, inf: ICryptoInfo): string;
    /**
     * Decrypts hex-encoded ciphertext produced by encryptToHex.
     *
     * @param encryptedText Hex-encoded ciphertext.
     * @param inf Crypto info with the key and IV.
     * @returns The decrypted text, or an empty string on failure.
     */
    static decryptFromHex(encryptedText: string, inf: ICryptoInfo): string;
    /**
     * Encrypts text and URI-encodes the base64 ciphertext so it is safe in URLs.
     *
     * @param plainText Text to encrypt.
     * @param inf Crypto info with the key and IV.
     * @returns The URI-encoded ciphertext.
     */
    static encryptUri(plainText: string, inf: ICryptoInfo): string;
    /**
     * Decodes URI-encoded ciphertext and decrypts it. decodeURIComponent may throw on malformed input.
     *
     * @param encryptedText URI-encoded ciphertext.
     * @param inf Crypto info with the key and IV.
     * @returns The decrypted text, or an empty string if decryption fails.
     */
    static decryptUri(encryptedText: string, inf: ICryptoInfo): string;
}
