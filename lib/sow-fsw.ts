/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 5:17 PM 6/15/2020
// by rajib chy
import * as _fs from 'fs';
import * as _path from 'path';
import { ErrorHandler } from './sow-static';
const _fsRmdir = typeof (_fs.rm) === "function" ? _fs.rm : _fs.rmdir;
const _fsRmdirSync = typeof (_fs.rmSync) === "function" ? _fs.rmSync : _fs.rmdirSync;
export function stat(
    path: string,
    next: (err?: NodeJS.ErrnoException | null, stat?: _fs.Stats) => void
): void {
    return _fs.stat(path, (err: NodeJS.ErrnoException | null, stats: _fs.Stats) => {
        if (err) return next(err);
        return next(null, stats);
    });
}
function isSameDrive(src: string, dest: string): boolean {
    const aroot: string = _path.parse(src).root;
    const broot: string = _path.parse(dest).root;
    return aroot.substring(0, aroot.indexOf(":")) === broot.substring(0, broot.indexOf(":"));
}
export function moveFile(
    src: string, dest: string,
    next: (err: NodeJS.ErrnoException | null) => void,
    force?: boolean
): void {
    if (force !== true && isSameDrive(src, dest)) {
        return _fs.rename(src, dest, (err: NodeJS.ErrnoException | null): void => {
            return next(err);
        });
    }
    return _fs.copyFile(src, dest, (err: NodeJS.ErrnoException | null): void => {
        if (err) return next(err);
        return _fs.unlink(src, (uerr: NodeJS.ErrnoException | null): void => {
            return next(uerr);
        });
    });
}
/** compairFile a stat.mtime > b stat.mtime */
export function compairFile(
    a: string, b: string,
    next: (err: NodeJS.ErrnoException | null, changed: boolean) => void,
    errHandler: ErrorHandler
): void {
    return _fs.stat(a, (err: NodeJS.ErrnoException | null, astat: _fs.Stats) => {
        return errHandler(err, () => {
            return _fs.stat(b, (serr: NodeJS.ErrnoException | null, bstat: _fs.Stats) => {
                return errHandler(serr, () => {
                    return next(null, astat.mtime.getTime() > bstat.mtime.getTime());
                });
            });
        });
    });
}
/** compairFileSync a stat.mtime > b stat.mtime */
export function compairFileSync(a: string, b: string): boolean {
    const astat = _fs.statSync(a);
    const bstat = _fs.statSync(b);
    if (astat.mtime.getTime() > bstat.mtime.getTime()) return true;
    return false;
}
export function isExists(
    path: string,
    next: (exists: boolean, url: string) => void
): void {
    const url = _path.resolve(path);
    return _fs.stat(url, (err: NodeJS.ErrnoException | null, stats: _fs.Stats): void => {
        return next(err ? false : true, url);
    });
}
export function readJson<T>(
    absPath: string,
    next: (err: NodeJS.ErrnoException | null, json: NodeJS.Dict<T> | void) => void,
    errHandler: ErrorHandler
): void {
    return _fs.readFile(absPath, (err: NodeJS.ErrnoException | null, data: Buffer) => {
        return errHandler(err, () => {
            try {
                return next(null, JSON.parse(data.toString("utf8").replace(/^\uFEFF/, '')));
            } catch (e: any) {
                return next(e);
            }
        });
    });
}
export function readJsonSync<T>(absPath: string): NodeJS.Dict<T> | void {
    const jsonstr = _fs.readFileSync(absPath, "utf8").replace(/^\uFEFF/, '').replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "").replace(/^\s*$(?:\r\n?|\n)/gm, "");
    try {
        return JSON.parse(jsonstr);
    } catch (e) {
        return void 0;
    }
}
function mkdirCheckAndCreate(
    errHandler: ErrorHandler,
    fnext: (done: boolean) => void,
    path?: string
) {
    if (!path) return fnext(true);
    return _fs.stat(path, (err: NodeJS.ErrnoException | null, stats: _fs.Stats): void => {
        if (!err) return fnext(false);
        return _fs.mkdir(path, (merr: NodeJS.ErrnoException | null): void => {
            return errHandler(merr, () => {
                fnext(false);
            });
        });
    });
}
export function mkdir(
    rootDir: string,
    targetDir: string,
    next: (err: NodeJS.ErrnoException | null) => void,
    errHandler: ErrorHandler
): void {
    if (rootDir.length === 0) return next(new Error("Argument missing..."));
    let fullPath: string = "";
    let sep: string = "";
    if (targetDir && targetDir.length > 0) {
        if (targetDir.charAt(0) === '.') return next(new Error("No need to defined start point...."));
        fullPath = _path.join(rootDir, targetDir);
        sep = "/";
    } else {
        fullPath = _path.resolve(rootDir);
        // so we've to start form drive:\
        targetDir = fullPath;
        sep = _path.sep;
        rootDir = _path.isAbsolute(targetDir) ? sep : '';
    }
    return _fs.stat(fullPath, (err: NodeJS.ErrnoException | null, stats: _fs.Stats): void => {
        if (!err) {
            return next(stats.isDirectory() ? null : new Error("Invalid path found..."));
        }
        if (_path.parse(fullPath).ext) return next(new Error("Directory should be end without extension...."));
        const tobeCreate: string[] = [];
        targetDir.split(sep).reduce((parentDir: string, childDir: string): string => {
            const curDir: string = _path.resolve(parentDir, childDir);
            tobeCreate.push(curDir);
            return curDir;
        }, rootDir);
        function doNext(done: boolean): void {
            if (done) {
                return next(null);
            }
            return mkdirCheckAndCreate(errHandler, doNext, tobeCreate.shift());
        }
        return doNext(false);
    });
}
export function mkdirSync(rootDir: string, targetDir?: string): boolean {
    if (rootDir.length === 0) return false;
    let fullPath: string = "";
    let sep: string = "";
    if (targetDir) {
        if (targetDir.charAt(0) === '.') throw new Error("No need to defined start point....");
        fullPath = _path.join(rootDir, targetDir);
        sep = "/";
    } else {
        fullPath = _path.resolve(rootDir);
        // so we've to start form drive:\
        targetDir = fullPath;
        sep = _path.sep;
        rootDir = _path.isAbsolute(targetDir) ? sep : '';
    }
    if (_fs.existsSync(fullPath)) {
        return _fs.statSync(fullPath).isDirectory();
    }
    if (_path.parse(fullPath).ext) return false;
    targetDir.split(sep).reduce((parentDir, childDir) => {
        if (!childDir) return parentDir;
        const curDir = _path.resolve(parentDir, childDir);
        if (!_fs.existsSync(curDir)) {
            _fs.mkdirSync(curDir);
        }
        return curDir;
    }, rootDir);
    return _fs.existsSync(fullPath);
}
export function rmdir(
    path: string,
    next: (err: NodeJS.ErrnoException | null) => void,
    errHandler: ErrorHandler
): void {
    return _fs.stat(path, (err: NodeJS.ErrnoException | null, stats: _fs.Stats) => {
        if (err) return next(err);
        if (stats.isDirectory()) {
            return _fs.readdir(path, (rerr: NodeJS.ErrnoException | null, files: string[]): void => {
                return errHandler(err, () => {
                    const forward = (): void => {
                        const npath: string | undefined = files.shift();
                        if (!npath) {
                            return _fsRmdir(path, { recursive: true, force: true }, (rmerr: NodeJS.ErrnoException | null): void => {
                                return next(rmerr);
                            });
                        }
                        rmdir(_path.join(path, npath), (ferr: NodeJS.ErrnoException | null): void => {
                            return errHandler(ferr, () => {
                                return forward();
                            });
                        }, errHandler);
                    };
                    return forward();
                });
            });
        }
        return _fs.unlink(path, (uerr: NodeJS.ErrnoException | null): void => {
            return next(uerr);
        });
    });
}
export function rmdirSync(path: string): void {
    if (!_fs.existsSync(path)) return;
    const stats: _fs.Stats = _fs.statSync(path);
    if (stats.isDirectory()) {
        _fs.readdirSync(path).forEach((nextItem: string) => {
            rmdirSync(
                _path.join(path, nextItem)
            );
        });
        _fsRmdirSync(path, { recursive: true, force: true });
    } else {
        _fs.unlinkSync(path);
    }
}
export function unlink(
    path: string,
    next: (err: NodeJS.ErrnoException | null) => void
): void {
    return _fs.unlink(path, (err: NodeJS.ErrnoException | null): void => {
        return next(err);
    });
}
export function copyFile(
    src: string, dest: string,
    next: (err: NodeJS.ErrnoException | null) => void,
    errHandler: ErrorHandler
): void {
    if (!_path.parse(src).ext)
        return next(new Error("Source file path required...."));
    if (!_path.parse(dest).ext)
        return next(new Error("Dest file path required...."));
    return _fs.stat(src, (errs: NodeJS.ErrnoException | null, stats: _fs.Stats): void => {
        if (errs)
            return next(new Error(`Source directory not found ${src}`));
        return unlink(dest, (err: NodeJS.ErrnoException | null): void => {
            return errHandler(err, () => {
                return _fs.copyFile(src, dest, (cerr: NodeJS.ErrnoException | null): void => {
                    return next(cerr);
                });
            });
        });
    });
}
export function copyFileSync(src: string, dest: string): void {
    let parse = _path.parse(src);
    if (!parse.ext)
        throw new Error("Source file path required....");
    parse = _path.parse(dest);
    if (!parse.ext)
        throw new Error("Dest file path required....");
    if (!_fs.existsSync(src))
        throw new Error(`Source directory not found ${src}`);
    if (_fs.existsSync(dest))
        _fs.unlinkSync(dest);
    _fs.copyFileSync(src, dest);
}
export function copyDir(
    src: string,
    dest: string,
    next: (err: NodeJS.ErrnoException | null) => void,
    errHandler: ErrorHandler
): void {
    return _fs.stat(src, (err: NodeJS.ErrnoException | null, stats: _fs.Stats) => {
        if (err) return next(err);
        return errHandler(err, () => {
            if (stats.isDirectory()) {
                return mkdir(dest, "", (merr: NodeJS.ErrnoException | null): void => {
                    return errHandler(merr, () => {
                        return _fs.readdir(src, (rerr: NodeJS.ErrnoException | null, files: string[]): void => {
                            return errHandler(rerr, () => {
                                const forward = (): void => {
                                    const npath: string | undefined = files.shift();
                                    if (!npath) return next(null);
                                    return copyDir(_path.join(src, npath), _path.join(dest, npath), (copyErr: NodeJS.ErrnoException | null): void => {
                                        return errHandler(copyErr, () => {
                                            return forward();
                                        });
                                    }, errHandler);
                                };
                                return forward();
                            });
                        });
                    });
                }, errHandler);
            }
            return _fs.copyFile(src, dest, (cerr: NodeJS.ErrnoException | null): void => {
                return next(cerr);
            });
        });
    });
}
export function copyDirSync(src: string, dest: string): void {
    if (!_fs.existsSync(src)) return;
    const stats: _fs.Stats = _fs.statSync(src);
    if (stats.isDirectory()) {
        if (!_fs.existsSync(dest))
            _fs.mkdirSync(dest);
        _fs.readdirSync(src).forEach((nextItem: string) => {
            copyDirSync(
                _path.join(src, nextItem),
                _path.join(dest, nextItem)
            );
        });
    } else {
        _fs.copyFileSync(src, dest);
    }
}
/** Async */
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
            return resolve(true);
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
            resolve(true);
        }, true);
    });
}