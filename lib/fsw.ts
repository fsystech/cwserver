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

// 5:17 PM 6/15/2020
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import type { PathLike, RmOptions, NoParamCallback } from 'node:fs';
import { ErrorHandler } from './app-static';

const _fsp = _fs.promises;

const _fsRmdirSync = typeof (_fs.rmSync) === "function" ? _fs.rmSync : _fs.rmdirSync;

function _fsRmdir(path: PathLike, options: RmOptions, callback: NoParamCallback) {

    if (typeof (_fs.rm) === "function") {
        return _fs.rm(path, options, callback);
    }

    return _fs.rmdir(path, callback);
}

export async function statAsync(path: string): Promise<_fs.Stats> {
    return await _fsp.stat(path);
}

export function stat(
    path: string,
    next: (err?: NodeJS.ErrnoException, stat?: _fs.Stats) => void
): void {
    statAsync(path).then(rs => next(null, rs)).catch(ex => next(ex));
}

function isSameDrive(src: string, dest: string): boolean {
    const aroot: string = _path.parse(src).root;
    const broot: string = _path.parse(dest).root;
    return aroot.substring(0, aroot.indexOf(":")) === broot.substring(0, broot.indexOf(":"));
}

/** Move file async */
export async function moveFileAsync(
    src: string, dest: string, force: boolean = false
): Promise<boolean> {

    if (force !== true && isSameDrive(src, dest)) {
        return await _fsp.rename(src, dest), true;
    }

    await _fsp.copyFile(src, dest);
    await _fsp.unlink(src);

    return true;
}

export function moveFile(
    src: string, dest: string,
    next: (err?: NodeJS.ErrnoException) => void,
    force?: boolean
): void {

    moveFileAsync(src, dest, force).then(
        () => next()
    ).catch((ex) => next(ex));

}

export async function compareFileAsync(a: string, b: string): Promise<boolean> {

    const [astat, bstat] = await Promise.all([
        _fsp.stat(a),
        _fsp.stat(b)
    ]);

    return astat.mtime.getTime() > bstat.mtime.getTime();
}

/** compareFile a stat.mtime > b stat.mtime */
export function compareFile(
    a: string, b: string,
    next: (err?: NodeJS.ErrnoException, changed?: boolean) => void,
    errHandler: ErrorHandler
): void {

    compareFileAsync(a, b).then(
        r => errHandler(null, () => next(null, r))
    ).catch(
        ex => errHandler(ex, () => next(ex))
    );
}
/** compareFileSync a stat.mtime > b stat.mtime */
export function compareFileSync(a: string, b: string): boolean {
    const astat = _fs.statSync(a);
    const bstat = _fs.statSync(b);
    if (astat.mtime.getTime() > bstat.mtime.getTime()) return true;
    return false;
}

export function isExists(
    path: string,
    next: (exists: boolean, url: string) => void
): void {

    isExistsAsync(path).then(rs => {
        return next(rs.exists, rs.url)
    });
}

export async function isExistsAsync(path: string): Promise<{ exists: boolean, url: string }> {

    const url = _path.resolve(path);

    try {
        await _fsp.stat(url);
        return { exists: true, url }

    } catch (ex) {
        return { exists: false, url }
    }
}

export async function readJsonAsync<T>(
    absPath: string
) {

    const data: Buffer = await _fsp.readFile(absPath);

    return JSON.parse(
        data.toString("utf8").replace(/^\uFEFF/, '')
    );
}

export function readJson<T>(
    absPath: string,
    next: (err?: NodeJS.ErrnoException, json?: NodeJS.Dict<T>) => void,
    errHandler: ErrorHandler
): void {

    readJsonAsync(absPath).then(rs => {
        errHandler(null, () => next(null, rs));
    }).catch(ex => errHandler(ex, () => next(ex)));
}

export function readJsonSync<T>(absPath: string): NodeJS.Dict<T> {

    try {

        const jsonstr = _fs.readFileSync(absPath, "utf8").replace(/^\uFEFF/, '').replace(
            /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, ""
        ).replace(/^\s*$(?:\r\n?|\n)/gm, "");

        return JSON.parse(jsonstr);

    } catch {
        return null;
    }
}

async function mkdirCheckAndCreateAsync(path: string) {
    if (!path)
        return false;

    try {
        await _fsp.stat(path);
        return true;
    } catch {
        try {
            await _fsp.mkdir(path);
            return true;
        } catch { }
    }

    return false;
}

export async function mkdirAsyncx(
    rootDir: string,
    targetDir?: string
): Promise<void> {

    if (!rootDir || rootDir.length === 0) {
        throw new Error("Argument missing...");
    }

    let fullPath: string = "";
    let sep: string = "";

    if (targetDir && targetDir.length > 0) {

        if (targetDir.charAt(0) === '.')
            new Error("No need to defined start point....");

        fullPath = _path.join(rootDir, targetDir);
        sep = "/";

    } else {

        fullPath = _path.resolve(rootDir);
        // so we've to start form drive:\
        targetDir = fullPath;
        sep = _path.sep;
        rootDir = _path.isAbsolute(targetDir) ? sep : '';

    }

    let rootState: _fs.Stats = null;

    try {
        rootState = await _fsp.stat(fullPath);

        if (rootState.isDirectory())
            return;

    } catch { }

    if (rootState !== null) {
        throw new Error("Invalid path found...");
    }

    if (_path.parse(fullPath).ext)
        throw new Error("Directory should be end without extension....");

    const tobeCreate: string[] = [];
    targetDir.split(sep).reduce((parentDir: string, childDir: string): string => {
        const curDir: string = _path.resolve(parentDir, childDir);
        tobeCreate.push(curDir);
        return curDir;
    }, rootDir);

    for (const part of tobeCreate) {
        await mkdirCheckAndCreateAsync(part);
    }

}

export function mkdir(
    rootDir: string,
    targetDir: string,
    next: (err?: NodeJS.ErrnoException) => void,
    errHandler: ErrorHandler
): void {

    mkdirAsyncx(
        rootDir, targetDir
    ).then(
        () => errHandler(null, () => next(null))
    ).catch(
        ex => errHandler(ex, () => next(ex))
    );
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
        return process.nextTick(() => next(new Error("Source file path required....")));
    if (!_path.parse(dest).ext)
        return process.nextTick(() => next(new Error("Dest file path required....")));
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
    return await _fsp.opendir(absolute);
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
    await _fsp.unlink(absolute);
}

/** WriteFile Async */
export async function writeFileAsync(absolute: string, data: string | Buffer): Promise<void> {
    await _fsp.writeFile(absolute, data, { flag: 'w' });
}

/** Make Dir Async */
export async function mkdirAsync(errHandler: ErrorHandler, rootDir: string, targetDir: string): Promise<any> {
    try {
        await mkdirAsyncx(rootDir, targetDir);
    } catch (ex) {
        errHandler(
            ex as any, () => { }
        )
    }
}

/** Check File or Dir is exists */
export async function existsAsync(path: string): Promise<boolean> {
    return (await isExistsAsync(path)).exists;
}