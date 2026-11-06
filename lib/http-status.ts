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
import type { IResInfo } from './app-static';
import { ResInfo, toNumber } from './app-static';
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
    /**
     * Exposes the table of HTTP status codes and their descriptions.
     *
     * @returns Map from status code number to description text.
     */
    static get statusCode(): { [id: number]: string } { return HttpStatusCode; }
    /**
     * Returns the description text for an HTTP status code. Throws if the code is unknown.
     *
     * @param statusCode HTTP status code.
     * @returns The description of the status code.
     */
    static getDescription(statusCode: number): string {
        const desc: string | undefined = HttpStatusCode[statusCode];
        if (desc) return desc;
        throw new Error(`Invalid ==> ${statusCode}...`);
    }
    /**
     * Extracts a status code from a file name in a path, for example error page names like 404.html. Falls
     * back to the given code when none can be derived.
     *
     * @param path File path whose base name (without extension) may be a status code.
     * @param statusCode Fallback status code returned when the path has no numeric name.
     * @returns The status code parsed from the file name, or the fallback.
     */
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
        statusCode = toNumber(code);
        if (statusCode === 0) return outStatusCode;
        return statusCode;
    }
    /**
     * Checks whether the code is a known HTTP status code.
     *
     * @param statusCode HTTP status code to check.
     * @returns True if the code is known, otherwise false.
     */
    static isValidCode(statusCode: number): boolean {
        return HttpStatusCode[statusCode] ? true : false;
    }
    /**
     * Builds a response info object for a status code taken from a number or a file path, flagging whether
     * it is valid, an error code, or a 500 error, and adding a description for error codes.
     *
     * @param path Status code number, or a file path from which the code is derived.
     * @param code Fallback status code used when the path yields none.
     * @returns Response info with code, validity, error flags and description.
     */
    static getResInfo(path: string | number, code: any): IResInfo {
        code = toNumber(code);
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
    /**
     * Checks whether a file name is a numeric valid HTTP error status code such as 404.
     *
     * @param name File name (without extension) to test.
     * @returns True if the name is a valid 4xx or 5xx status code, otherwise false.
     */
    static isErrorFileName(name: string): boolean {
        if (/^\d*$/.test(name) === false) return false;
        const inf: GroupType | undefined = _group[name.charAt(0)];
        if (!inf || (inf && inf.error === false)) return false;
        const statusCode: number = toNumber(name);
        return this.isValidCode(statusCode);
    }
    /**
     * Checks whether a status code belongs to an error class (client or server error). Throws if the
     * code's class is not recognised.
     *
     * @param code HTTP status code to test.
     * @returns True for error codes, otherwise false.
     */
    static isErrorCode(code: any): boolean {
        const inf: GroupType | undefined = _group[String(code).charAt(0)];
        if (!inf)
            throw new Error(`Invalid http status code ${code}...`);
        return inf.error;
    }
}