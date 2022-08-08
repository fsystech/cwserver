// Copyright (c) 2022 Safe Online World Ltd.
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

// 12:04 AM 6/19/2020
// by rajib chy
import * as _fs from 'fs';
import * as _path from 'path';
import { assert, getAppDir, Util } from './sow-util';
export interface IMimeType<T> {
    readonly type: (extension: string) => T | undefined;
    readonly add: (extension: string, val: T) => void;
}
export function loadMimeType<T>(): IMimeType<T> {
    const libRoot: string = getAppDir();
    const absPath: string = _path.resolve(`${libRoot}/mime-types.json`);
    assert(_fs.existsSync(absPath), `No mime-type found in ${libRoot}\nPlease re-install cwserver`);
    const data: NodeJS.Dict<T> = Util.JSON.parse(_fs.readFileSync(absPath, "utf-8"));
    return {
        add: (extension: string, val: T): void => {
            if (data[extension])
                throw new Error(`This given extension (${extension}) already exists`);
            data[extension] = val;
            return void 0;
        },
        type: (extension: string): T | undefined => {
            return data[extension];
        }
    }
}
function setCharset(mimeType: string): string {
    const text: string = mimeType.split(";")[0];
    if ((/^text\/|^application\/(javascript|json)/).test(text.toLowerCase())) {
        return `${mimeType}; charset=UTF-8`;
    }
    return mimeType;
}
export function getMimeType(extension: string): string {
    extension = extension.replace(/^.*[\.\/\\]/gi, '').toLowerCase();
    const mimeType: string | undefined = global.sow.HttpMime.type(extension);
    if (!mimeType)
        throw new Error(`Unsupported extension =>${extension}`);
    return setCharset(mimeType);
}
export function isValidExtension(extension: string): boolean {
    return global.sow.HttpMime.type(extension) ? true : false;
}