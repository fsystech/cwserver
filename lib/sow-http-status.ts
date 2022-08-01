/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:10 PM 5/2/2020
// by rajib chy
import { IResInfo } from './sow-static';
import { ResInfo, ToNumber } from './sow-static';
export type Dict<T> = { [K in string | number]: T | undefined };
// Copy from https://github.com/nodejs/node/blob/master/lib/_http_server.js
const HttpStatusCode: { [id: number]: string } = {
    100: 'Continue',                   // RFC 7231 6.2.1
    101: 'Switching Protocols',        // RFC 7231 6.2.2
    102: 'Processing',                 // RFC 2518 10.1 (obsoleted by RFC 4918)
    103: 'Early Hints',                // RFC 8297 2
    200: 'OK',                         // RFC 7231 6.3.1
    201: 'Created',                    // RFC 7231 6.3.2
    202: 'Accepted',                   // RFC 7231 6.3.3
    203: 'Non-Authoritative Information', // RFC 7231 6.3.4
    204: 'No Content',                 // RFC 7231 6.3.5
    205: 'Reset Content',              // RFC 7231 6.3.6
    206: 'Partial Content',            // RFC 7233 4.1
    207: 'Multi-Status',               // RFC 4918 11.1
    208: 'Already Reported',           // RFC 5842 7.1
    226: 'IM Used',                    // RFC 3229 10.4.1
    300: 'Multiple Choices',           // RFC 7231 6.4.1
    301: 'Moved Permanently',          // RFC 7231 6.4.2
    302: 'Found',                      // RFC 7231 6.4.3
    303: 'See Other',                  // RFC 7231 6.4.4
    304: 'Not Modified',               // RFC 7232 4.1
    305: 'Use Proxy',                  // RFC 7231 6.4.5
    307: 'Temporary Redirect',         // RFC 7231 6.4.7
    308: 'Permanent Redirect',         // RFC 7238 3
    400: 'Bad Request',                // RFC 7231 6.5.1
    401: 'Unauthorized',               // RFC 7235 3.1
    402: 'Payment Required',           // RFC 7231 6.5.2
    403: 'Forbidden',                  // RFC 7231 6.5.3
    404: 'Not Found',                  // RFC 7231 6.5.4
    405: 'Method Not Allowed',         // RFC 7231 6.5.5
    406: 'Not Acceptable',             // RFC 7231 6.5.6
    407: 'Proxy Authentication Required', // RFC 7235 3.2
    408: 'Request Timeout',            // RFC 7231 6.5.7
    409: 'Conflict',                   // RFC 7231 6.5.8
    410: 'Gone',                       // RFC 7231 6.5.9
    411: 'Length Required',            // RFC 7231 6.5.10
    412: 'Precondition Failed',        // RFC 7232 4.2
    413: 'Payload Too Large',          // RFC 7231 6.5.11
    414: 'URI Too Long',               // RFC 7231 6.5.12
    415: 'Unsupported Media Type',     // RFC 7231 6.5.13
    416: 'Range Not Satisfiable',      // RFC 7233 4.4
    417: 'Expectation Failed',         // RFC 7231 6.5.14
    418: 'I\'m a Teapot',              // RFC 7168 2.3.3
    421: 'Misdirected Request',        // RFC 7540 9.1.2
    422: 'Unprocessable Entity',       // RFC 4918 11.2
    423: 'Locked',                     // RFC 4918 11.3
    424: 'Failed Dependency',          // RFC 4918 11.4
    425: 'Too Early',                  // RFC 8470 5.2
    426: 'Upgrade Required',           // RFC 2817 and RFC 7231 6.5.15
    428: 'Precondition Required',      // RFC 6585 3
    429: 'Too Many Requests',          // RFC 6585 4
    431: 'Request Header Fields Too Large', // RFC 6585 5
    451: 'Unavailable For Legal Reasons', // RFC 7725 3
    500: 'Internal Server Error',      // RFC 7231 6.6.1
    501: 'Not Implemented',            // RFC 7231 6.6.2
    502: 'Bad Gateway',                // RFC 7231 6.6.3
    503: 'Service Unavailable',        // RFC 7231 6.6.4
    504: 'Gateway Timeout',            // RFC 7231 6.6.5
    505: 'HTTP Version Not Supported', // RFC 7231 6.6.6
    506: 'Variant Also Negotiates',    // RFC 2295 8.1
    507: 'Insufficient Storage',       // RFC 4918 11.5
    508: 'Loop Detected',              // RFC 5842 7.2
    509: 'Bandwidth Limit Exceeded',
    510: 'Not Extended',               // RFC 2774 7
    511: 'Network Authentication Required' // RFC 6585 6
};
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
    static get statusCode(): { [id: number]: string } { return HttpStatusCode; }
    static getDescription(statusCode: number): string {
        const desc: string | undefined = HttpStatusCode[statusCode];
        if (desc) return desc;
        throw new Error(`Invalid ==> ${statusCode}...`);
    }
    static fromPath(path: string | any, statusCode: any): number {
        const outStatusCode = statusCode;
        let index = path.lastIndexOf("/");
        if (index < 0) index = path.lastIndexOf("\\");
        if (index < 0) return outStatusCode;
        const file = path.substring(index + 1);
        index = file.lastIndexOf(".");
        if (index < 0) return outStatusCode;
        const code = file.substring(0, index);
        // check is valid server status code here...
        statusCode = ToNumber(code);
        if (statusCode === 0) return outStatusCode;
        return statusCode;
    }
    static isValidCode(statusCode: number): boolean {
        return HttpStatusCode[statusCode] ? true : false;
    }
    static getResInfo(path: string | number, code: any): IResInfo {
        code = ToNumber(code);
        const out: IResInfo = new ResInfo();
        out.code = typeof (path) === "number" ? path : this.fromPath(path, code);
        out.isValid = false;
        out.isErrorCode = false;
        out.isInternalErrorCode = false;
        if (out.code > 0) {
            out.isValid = this.isValidCode(out.code);
        } else {
            out.isValid = false;
        }
        if (out.isValid) out.isErrorCode = this.isErrorCode(out.code);
        if (out.isErrorCode) {
            out.description = this.getDescription(out.code);
            out.isInternalErrorCode = out.code === 500;
        }
        return out;
    }
    static isErrorFileName(name: string): boolean {
        if (/^\d*$/.test(name) === false) return false;
        const inf: GroupType | undefined = _group[name.charAt(0)];
        if (!inf || (inf && inf.error === false)) return false;
        const statusCode: number = ToNumber(name);
        return this.isValidCode(statusCode);
    }
    static isErrorCode(code: any): boolean {
        const inf: GroupType | undefined = _group[String(code).charAt(0)];
        if (!inf)
            throw new Error(`Invalid http status code ${code}...`);
        return inf.error;
    }
}