export interface ICryptoInfo {
    oldKey: string;
    md5?: string;
    key: Buffer | null;
    iv: Buffer | null;
}
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
    static utf8ToHex(str: string): string;
    static hexToUtf8(str: string): string;
    static toMd5(str: string): string;
    static updateCryptoKeyIV(key: string): ICryptoInfo;
    private static getCryptoParams;
    static encrypt(plainText: string, inf: ICryptoInfo): string;
    static decrypt(encryptedText: string, inf: ICryptoInfo): string;
    static encryptToHex(plainText: string, inf: ICryptoInfo): string;
    static decryptFromHex(encryptedText: string, inf: ICryptoInfo): string;
    static encryptUri(plainText: string, inf: ICryptoInfo): string;
    static decryptUri(encryptedText: string, inf: ICryptoInfo): string;
}
