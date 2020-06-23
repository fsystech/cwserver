/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:10 PM 5/2/2020
import { IResInfo } from './sow-static';
import { ResInfo, ToNumber } from './sow-static';
export type Dict<T> = { [K in string | number]: T | undefined };
const HttpStatusCode: Dict<number> = {
    continue: 100,
    switchingprotocols: 101,
    ok: 200,
    created: 201,
    accepted: 202,
    nonauthoritativeinformation: 203,
    nocontent: 204,
    resetcontent: 205,
    partialcontent: 206,
    multiplechoices: 300,
    ambiguous: 300,
    movedpermanently: 301,
    moved: 301,
    found: 302,
    redirect: 302,
    seeother: 303,
    redirectmethod: 303,
    notmodified: 304,
    useproxy: 305,
    unused: 306,
    temporaryredirect: 307,
    redirectkeepverb: 307,
    badrequest: 400,
    unauthorized: 401,
    paymentrequired: 402,
    forbidden: 403,
    notfound: 404,
    methodnotallowed: 405,
    notacceptable: 406,
    proxyauthenticationrequired: 407,
    requesttimeout: 408,
    conflict: 409,
    gone: 410,
    lengthrequired: 411,
    preconditionfailed: 412,
    requestentitytoolarge: 413,
    requesturitoolong: 414,
    unsupportedmediatype: 415,
    requestedrangenotsatisfiable: 416,
    expectationfailed: 417,
    upgraderequired: 426,
    internalservererror: 500,
    notimplemented: 501,
    badgateway: 502,
    serviceunavailable: 503,
    gatewaytimeout: 504,
    httpversionnotsupported: 505
}
const ReverseHttpStatusCode: Dict<string> = ( () => {
    const rhsc: Dict<string> = {};
    for ( const [key, value] of Object.entries( HttpStatusCode ) ) {
        if ( value ) rhsc[value] = key;
    }
    return rhsc;
} )();
type GroupType = { type: string, error: boolean };
const _group: Dict<GroupType> = {
    "1": {
        type: "Informational",
        error: false
    },
    "2": {
        type: "Success",
        error: false
    },
    "3": {
        type: "Redirection",
        error: false
    },
    "4": {
        type: "Client Error",
        error: true
    },
    "5": {
        type: "Server Error",
        error: true
    }
};
export class HttpStatus {
    static get statusCode(): Dict<number> { return HttpStatusCode; }
    static getDescription( statusCode: number ): string {
        const desc: string | undefined = ReverseHttpStatusCode[statusCode];
        if ( desc ) return desc;
        throw new Error( `Invalid ==> ${statusCode}...` );
    }
    static fromPath( path: string | any, statusCode: any ): number {
        const outStatusCode = statusCode;
        let index = path.lastIndexOf( "/" );
        if ( index < 0 ) index = path.lastIndexOf( "\\" );
        if ( index < 0 ) return outStatusCode;
        const file = path.substring( index + 1 );
        index = file.lastIndexOf( "." );
        if ( index < 0 ) return outStatusCode;
        const code = file.substring( 0, index );
        // check is valid server status code here...
        statusCode = ToNumber( code );
        if ( statusCode === 0 ) return outStatusCode;
        // if ( this.isValidCode( statusCode ) ) return outStatusCode;
        return statusCode;
    }
    static isValidCode( statusCode: number ): boolean {
        return ReverseHttpStatusCode[statusCode] ? true : false;
    }
    static getResInfo( path: string | number, code: any ): IResInfo {
        code = ToNumber( code );
        const out: IResInfo = new ResInfo();
        out.code = typeof ( path ) === "number" ? path : this.fromPath( path, code );
        out.isValid = false;
        out.isErrorCode = false;
        out.isInternalErrorCode = false;
        if ( out.code > 0 ) {
            out.isValid = this.isValidCode( out.code );
        } else {
            out.isValid = false;
        }
        if ( out.isValid ) out.isErrorCode = this.isErrorCode( out.code );
        if ( out.isErrorCode ) {
            out.description = this.getDescription( out.code );
            out.isInternalErrorCode = out.code === 500;
        }
        // console.log( out );
        return out;
    }
    static isErrorCode( code: any ): boolean {
        const inf: GroupType | undefined = _group[String( code ).charAt( 0 )];
        if ( !inf )
            throw new Error( `Invalid http status code ${code}...` );
        return inf.error;
    }
}