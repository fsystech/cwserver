/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 12:04 AM 6/19/2020
/// <reference types="node" />
import * as _fs from 'fs';
import * as _path from 'path';
import { assert, getLibRoot } from './sow-util';
export interface IMimeType<T> {
    readonly type: (extension: string) => T | undefined;
    readonly add: (extension: string, val: T) => void;
}
export function loadMimeType<T>(): IMimeType<T> {
    const libRoot: string = getLibRoot();
    const absPath: string = _path.resolve(`${libRoot}/mime-types.json`);
    assert(_fs.existsSync(absPath), `No mime-type found in ${libRoot}\nPlease re-install cwserver`);
    const data: NodeJS.Dict<T> = JSON.parse(_fs.readFileSync(absPath, "utf-8"));
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