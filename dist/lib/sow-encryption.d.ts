export interface ICryptoInfo {
    oldKey: string;
    md5?: string;
    key: any;
    iv: any;
}
export declare function md5(contents: string): string;
export declare class CryptoInfo implements ICryptoInfo {
    oldKey: string;
    md5?: string;
    key: any;
    iv: any;
    constructor();
}
export declare namespace Encryption {
    function convert(from: string, to: string): (str: string) => string;
    function utf8ToHex(str: string): string;
    function hexToUtf8(str: string): string;
    function toMd5(str: string): string;
    function updateCryptoKeyIV(key: string): ICryptoInfo;
    function encrypt(plainText: string, inf: ICryptoInfo): string;
    function decrypt(encryptedText: string, inf: ICryptoInfo): string;
    function encryptToHex(plainText: string, inf: ICryptoInfo): string;
    function decryptFromHex(encryptedText: string, inf: ICryptoInfo): string;
    function encryptUri(plainText: string, inf: ICryptoInfo): string;
    function decryptUri(encryptedText: string, inf: ICryptoInfo): string;
}
