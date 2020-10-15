"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpStatus = void 0;
const sow_static_1 = require("./sow-static");
// Copy from https://github.com/nodejs/node/blob/master/lib/_http_server.js
const HttpStatusCode = {
    100: 'Continue',
    101: 'Switching Protocols',
    102: 'Processing',
    103: 'Early Hints',
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    203: 'Non-Authoritative Information',
    204: 'No Content',
    205: 'Reset Content',
    206: 'Partial Content',
    207: 'Multi-Status',
    208: 'Already Reported',
    226: 'IM Used',
    300: 'Multiple Choices',
    301: 'Moved Permanently',
    302: 'Found',
    303: 'See Other',
    304: 'Not Modified',
    305: 'Use Proxy',
    307: 'Temporary Redirect',
    308: 'Permanent Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required',
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed',
    413: 'Payload Too Large',
    414: 'URI Too Long',
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable',
    417: 'Expectation Failed',
    418: 'I\'m a Teapot',
    421: 'Misdirected Request',
    422: 'Unprocessable Entity',
    423: 'Locked',
    424: 'Failed Dependency',
    425: 'Too Early',
    426: 'Upgrade Required',
    428: 'Precondition Required',
    429: 'Too Many Requests',
    431: 'Request Header Fields Too Large',
    451: 'Unavailable For Legal Reasons',
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates',
    507: 'Insufficient Storage',
    508: 'Loop Detected',
    509: 'Bandwidth Limit Exceeded',
    510: 'Not Extended',
    511: 'Network Authentication Required' // RFC 6585 6
};
const _group = {
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
class HttpStatus {
    static get statusCode() { return HttpStatusCode; }
    static getDescription(statusCode) {
        const desc = HttpStatusCode[statusCode];
        if (desc)
            return desc;
        throw new Error(`Invalid ==> ${statusCode}...`);
    }
    static fromPath(path, statusCode) {
        const outStatusCode = statusCode;
        let index = path.lastIndexOf("/");
        if (index < 0)
            index = path.lastIndexOf("\\");
        if (index < 0)
            return outStatusCode;
        const file = path.substring(index + 1);
        index = file.lastIndexOf(".");
        if (index < 0)
            return outStatusCode;
        const code = file.substring(0, index);
        // check is valid server status code here...
        statusCode = sow_static_1.ToNumber(code);
        if (statusCode === 0)
            return outStatusCode;
        return statusCode;
    }
    static isValidCode(statusCode) {
        return HttpStatusCode[statusCode] ? true : false;
    }
    static getResInfo(path, code) {
        code = sow_static_1.ToNumber(code);
        const out = new sow_static_1.ResInfo();
        out.code = typeof (path) === "number" ? path : this.fromPath(path, code);
        out.isValid = false;
        out.isErrorCode = false;
        out.isInternalErrorCode = false;
        if (out.code > 0) {
            out.isValid = this.isValidCode(out.code);
        }
        else {
            out.isValid = false;
        }
        if (out.isValid)
            out.isErrorCode = this.isErrorCode(out.code);
        if (out.isErrorCode) {
            out.description = this.getDescription(out.code);
            out.isInternalErrorCode = out.code === 500;
        }
        return out;
    }
    static isErrorFileName(name) {
        if (/^\d*$/.test(name) === false)
            return false;
        const inf = _group[name.charAt(0)];
        if (!inf || (inf && inf.error === false))
            return false;
        const statusCode = sow_static_1.ToNumber(name);
        return this.isValidCode(statusCode);
    }
    static isErrorCode(code) {
        const inf = _group[String(code).charAt(0)];
        if (!inf)
            throw new Error(`Invalid http status code ${code}...`);
        return inf.error;
    }
}
exports.HttpStatus = HttpStatus;
//# sourceMappingURL=sow-http-status.js.map