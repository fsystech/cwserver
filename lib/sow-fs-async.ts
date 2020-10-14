/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:43 PM 10/13/2020
import * as _fs from 'fs';
import * as _path from 'path';
import { ErrorHandler } from './sow-static';
import { mkdir, isExists, moveFile } from './sow-fsw';
/** opendir async */
export async function opendirAsync(absolute: string): Promise<_fs.Dir> {
    return new Promise((resolve, reject) => {
        return _fs.opendir(absolute, (err, dir) => {
            if (err) return reject(err);
            return resolve(dir);
        });
    })
}
/** Get all file(s) async from given directory */
export async function* getFilesAsync(dir: string, recursive?: boolean): AsyncGenerator<string> {
    for await (const d of await opendirAsync(dir)) {
        const entry = _path.join(dir, d.name);
        if (d.isDirectory()) {
            if (recursive)
                yield* await getFilesAsync(entry, recursive);
        }
        else if (d.isFile()) yield entry;
    }
}
/** unlink Async */
export async function unlinkAsync(absolute: string): Promise<void> {
    return new Promise((resolve, reject) => {
        return _fs.unlink(absolute, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
}
/** WriteFile Async */
export async function writeFileAsync(absolute: string, data: string | Buffer): Promise<void> {
    return new Promise(async (resolve, reject) => {
        _fs.writeFile(absolute, data, { flag: 'w' }, (err) => {
            if (err) return reject(err);
            return resolve();
        });
    });
}

/** Make Dir Async */
export async function mkdirAsync(errHandler: ErrorHandler, rootDir: string, targetDir: string): Promise<any> {
    return new Promise((resolve, reject) => {
        mkdir(rootDir, targetDir, (err) => {
            return resolve();
        }, errHandler);
    });
}
/** Check File or Dir is exists */
export async function existsAsync(path: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        return isExists(path, (exists) => {
            resolve(exists);
        });
    });
}
/** Move file async */
export async function moveFileAsync(src: string, dest: string): Promise<any> {
    return new Promise((resolve, reject) => {
        return moveFile(src, dest, (err) => {
            if (err) return reject(err);
            resolve();
        }, true);
    });
}