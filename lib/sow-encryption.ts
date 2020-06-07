/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import CryptoJS from 'crypto-js';
import * as crypto from 'crypto';

export interface ICryptoInfo {
    oldKey: string;
    md5?: string;
    key: any;
    iv: any;
}
export function md5( contents: string ): string {
    return crypto.createHash( 'md5' ).update( contents ).digest( "hex" );
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
export namespace Encryption {
    export function utf8ToHex( str: string) {
        return Buffer.from( str, 'utf8' ).toString( 'hex' );
    }
    export function hexToUtf8( str: string ) {
        return Buffer.from( str, 'hex' ).toString( 'utf8' );
    }
    export function toMd5( str: string ): string {
        return md5( str );
    }
    export function updateCryptoKeyIV( key: string ): ICryptoInfo {
        const res = new CryptoInfo();
        res.oldKey = key;
        res.md5 = void 0;
        res.md5 = toMd5( res.oldKey );
        res.key = CryptoJS.lib.WordArray.create( res.md5 );
        res.iv = CryptoJS.lib.WordArray.create( res.oldKey );
        return res;
    };
    export function encrypt( plainText: string, inf: ICryptoInfo ): string {
        if ( !inf.key ) throw new Error( "Invalid iv and key...." );
        return CryptoJS.AES.encrypt( plainText, inf.key, { iv: inf.iv } ).toString();
    }
    export function decrypt( encryptedText: string, inf: ICryptoInfo ): string {
        if ( !inf.key ) throw new Error( "Invalid iv and key...." );
        const dec = CryptoJS.AES.decrypt( {
            iv: inf.iv,
            salt: "",
            ciphertext: CryptoJS.enc.Base64.parse( encryptedText )
        }, inf.key, {
            iv: inf.iv
        } );
        return CryptoJS.enc.Utf8.stringify( dec );
    }
    export function encryptToHex( plainText: string, inf: ICryptoInfo ): string {
        const encryptedText = encrypt( plainText, inf );
        return utf8ToHex( encryptedText );
    }
    export function decryptFromHex( encryptedText: string, inf: ICryptoInfo ): string {
        encryptedText = hexToUtf8( encryptedText );
        return decrypt( encryptedText, inf );
    }
    export function encryptUri( plainText: string, inf: ICryptoInfo ): string {
        const encryptedText = encrypt( plainText, inf );
        return encodeURIComponent( encryptedText );
    }
    export function decryptUri( encryptedText: string, inf: ICryptoInfo ): string {
        encryptedText = decodeURIComponent( encryptedText );
        return decrypt( encryptedText, inf );
    }
}