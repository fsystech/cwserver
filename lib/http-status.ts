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

// 9:10 PM 5/2/2020
// by rajib chy
import { IResInfo } from './app-static';
import { ResInfo, ToNumber } from './app-static';
import { HttpStatusCode } from './http-status-code';
export type Dict<T> = { [K in string | number]: T | undefined };
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