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
import { ErrorHandler } from './app-static';

const _fsp = _fs.promises;

const _fsRmdirSync = typeof (_fs.rmSync) === "function" ? _fs.rmSync : _fs.rmdirSync;

export async function statAsync(path: string): Promise<_fs.Stats> {
    return await _fsp.stat(path);
}

/** @deprecated Use {@link statAsync} */
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

/** @deprecated Use {@link moveFileAsync} */
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

/**
 * compareFile a stat.mtime > b stat.mtime
 * @deprecated Use {@link compareFileAsync}
 */
export function compareFile(
    a: string, b: string,
    next: (err?: NodeJS.ErrnoException, changed?: boolean) => void,
    errHandler?: ErrorHandler
): void {

    const handle = errHandler ?? ((_err, cb: () => void) => cb());

    compareFileAsync(a, b).then(
        r => handle(null, () => next(null, r))
    ).catch(
        ex => handle(ex, () => next(ex))
    );
}
/** compareFileSync a stat.mtime > b stat.mtime */
export function compareFileSync(a: string, b: string): boolean {
    const astat = _fs.statSync(a);
    const bstat = _fs.statSync(b);
    if (astat.mtime.getTime() > bstat.mtime.getTime()) return true;
    return false;
}

/** @deprecated Use {@link isExistsAsync} */
export function isExists(
    path: string,
    next: (exists: boolean, url: string) => void
): void {

    isExistsAsync(path).then(
        rs => next(rs.exists, rs.url)
    );
}

export async function isExistsAsync(
    path: string
): Promise<{ exists: boolean, url: string }> {

    const url = _path.resolve(path);

    try {
        await _fsp.stat(url);
        return { exists: true, url };

    } catch (ex) {
        return { exists: false, url };
    }
}

export async function readJsonAsync<T>(
    absPath: string
): Promise<T> {

    const data: Buffer = await _fsp.readFile(absPath);

    if (!data || data.length === 0)
        return null;

    return JSON.parse(
        data.toString("utf8").replace(/^\uFEFF/, '')
    ) as T;
}

/** @deprecated Use {@link readJsonAsync} */
export function readJson<T>(
    absPath: string,
    next: (err?: NodeJS.ErrnoException, json?: T) => void,
    errHandler?: ErrorHandler
): void {

    const handle = errHandler ?? ((_err, cb: () => void) => cb());

    readJsonAsync<T>(absPath).then(rs => {
        handle(null, () => next(null, rs));
    }).catch(ex => handle(ex, () => next(ex)));
}

export function readJsonSyncUnsafe<T>(absPath: string): T {

    const jsonstr = _fs.readFileSync(absPath, "utf8").replace(/^\uFEFF/, '').replace(
        /\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, ""
    ).replace(/^\s*$(?:\r\n?|\n)/gm, "");

    return JSON.parse(jsonstr);
}

export function readJsonSync<T>(absPath: string): T {

    try {
        return readJsonSyncUnsafe(absPath);
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
            throw new Error("No need to defined start point....");

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

/** @deprecated Use {@link mkdirAsyncx} */
export function mkdir(
    rootDir: string,
    targetDir: string,
    next: (err?: NodeJS.ErrnoException) => void,
    errHandler?: ErrorHandler
): void {

    const handle = errHandler ?? ((_err, cb: () => void) => cb());

    mkdirAsyncx(
        rootDir, targetDir
    ).then(
        () => handle(null, () => next(null))
    ).catch(
        ex => handle(ex, () => next(ex))
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

/** Remove a file or a directory (recursively). Rejects when `path` does not exist. */
export async function rmdirAsync(path: string): Promise<void> {
    const stats = await _fsp.stat(path);

    if (stats.isDirectory()) {
        return await _fsp.rm(path, { recursive: true, force: true });
    }

    await _fsp.unlink(path);
}

/** @deprecated Use {@link rmdirAsync} */
export function rmdir(
    path: string,
    next: (err: NodeJS.ErrnoException | null) => void,
    errHandler?: ErrorHandler
): void {
    rmdirAsync(path).then(() => next(null), (ex) => next(ex));
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

/** @deprecated Use {@link unlinkAsync} */
export function unlink(
    path: string,
    next: (err: NodeJS.ErrnoException | null) => void
): void {
    _fsp.unlink(path).then(() => next(null), (ex) => next(ex));
}

/**
 * Copy `src` file to `dest`. An existing `dest` file is replaced.
 * Both paths must be file paths (with an extension).
 */
export async function copyFileAsync(src: string, dest: string): Promise<void> {
    if (!_path.parse(src).ext)
        throw new Error("Source file path required....");

    if (!_path.parse(dest).ext)
        throw new Error("Dest file path required....");

    try {
        await _fsp.stat(src);
    } catch {
        throw new Error(`Source directory not found ${src}`);
    }

    await _fsp.rm(dest, { force: true });
    await _fsp.copyFile(src, dest);
}

/** @deprecated Use {@link copyFileAsync} */
export function copyFile(
    src: string, dest: string,
    next: (err: NodeJS.ErrnoException | null) => void,
    errHandler?: ErrorHandler
): void {
    copyFileAsync(src, dest).then(() => next(null), (ex) => next(ex));
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

/** Copy a file or a directory (recursively) from `src` to `dest`. */
export async function copyDirAsync(src: string, dest: string): Promise<void> {
    const stats = await _fsp.stat(src);

    if (!stats.isDirectory()) {
        await _fsp.copyFile(src, dest);
        return;
    }

    await mkdirAsyncx(dest);

    const files = await _fsp.readdir(src);

    await Promise.all(files.map(
        (name) => copyDirAsync(_path.join(src, name), _path.join(dest, name))
    ));
}

/** @deprecated Use {@link copyDirAsync} */
export function copyDir(
    src: string,
    dest: string,
    next: (err: NodeJS.ErrnoException | null) => void,
    errHandler?: ErrorHandler
): void {
    copyDirAsync(src, dest).then(() => next(null), (ex) => next(ex));
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
        } else {
            if (d.isFile()) yield entry;
        }
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
        );
    }
}

/** Check File or Dir is exists */
export async function existsAsync(path: string): Promise<boolean> {
    return (await isExistsAsync(path)).exists;
}