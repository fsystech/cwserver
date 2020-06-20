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
export class Encryption {
    public static utf8ToHex( str: string ) {
        return Buffer.from( str, 'utf8' ).toString( 'hex' );
    }
    public static hexToUtf8( str: string ) {
        return Buffer.from( str, 'hex' ).toString( 'utf8' );
    }
    public static toMd5( str: string ): string {
        return md5( str );
    }
    public static updateCryptoKeyIV( key: string ): ICryptoInfo {
        const res = new CryptoInfo();
        res.oldKey = key;
        res.md5 = void 0;
        res.md5 = this.toMd5( res.oldKey );
        res.key = CryptoJS.lib.WordArray.create( res.md5 );
        res.iv = CryptoJS.lib.WordArray.create( res.oldKey );
        return res;
    };
    public static encrypt( plainText: string, inf: ICryptoInfo ): string {
        if ( !inf.key ) throw new Error( "Invalid iv and key...." );
        return CryptoJS.AES.encrypt( plainText, inf.key, { iv: inf.iv } ).toString();
    }
    public static decrypt( encryptedText: string, inf: ICryptoInfo ): string {
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
    public static encryptToHex( plainText: string, inf: ICryptoInfo ): string {
        const encryptedText = this.encrypt( plainText, inf );
        return this.utf8ToHex( encryptedText );
    }
    public static decryptFromHex( encryptedText: string, inf: ICryptoInfo ): string {
        encryptedText = this.hexToUtf8( encryptedText );
        return this.decrypt( encryptedText, inf );
    }
    public static encryptUri( plainText: string, inf: ICryptoInfo ): string {
        const encryptedText = this.encrypt( plainText, inf );
        return encodeURIComponent( encryptedText );
    }
    public static decryptUri( encryptedText: string, inf: ICryptoInfo ): string {
        encryptedText = decodeURIComponent( encryptedText );
        return this.decrypt( encryptedText, inf );
    }
}