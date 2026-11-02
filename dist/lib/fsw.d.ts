import * as _fs from 'node:fs';
import { ErrorHandler } from './app-static';
export declare function statAsync(path: string): Promise<_fs.Stats>;
/** @deprecated Use {@link statAsync} */
export declare function stat(path: string, next: (err?: NodeJS.ErrnoException, stat?: _fs.Stats) => void): void;
/** Move file async */
export declare function moveFileAsync(src: string, dest: string, force?: boolean): Promise<boolean>;
/** @deprecated Use {@link moveFileAsync} */
export declare function moveFile(src: string, dest: string, next: (err?: NodeJS.ErrnoException) => void, force?: boolean): void;
export declare function compareFileAsync(a: string, b: string): Promise<boolean>;
/**
 * compareFile a stat.mtime > b stat.mtime
 * @deprecated Use {@link compareFileAsync}
 */
export declare function compareFile(a: string, b: string, next: (err?: NodeJS.ErrnoException, changed?: boolean) => void, errHandler?: ErrorHandler): void;
/** compareFileSync a stat.mtime > b stat.mtime */
export declare function compareFileSync(a: string, b: string): boolean;
/** @deprecated Use {@link isExistsAsync} */
export declare function isExists(path: string, next: (exists: boolean, url: string) => void): void;
export declare function isExistsAsync(path: string): Promise<{
    exists: boolean;
    url: string;
}>;
export declare function readJsonAsync<T>(absPath: string): Promise<T>;
/** @deprecated Use {@link readJsonAsync} */
export declare function readJson<T>(absPath: string, next: (err?: NodeJS.ErrnoException, json?: T) => void, errHandler?: ErrorHandler): void;
export declare function readJsonSyncUnsafe<T>(absPath: string): T;
export declare function readJsonSync<T>(absPath: string): T;
export declare function mkdirAsyncx(rootDir: string, targetDir?: string): Promise<void>;
/** @deprecated Use {@link mkdirAsyncx} */
export declare function mkdir(rootDir: string, targetDir: string, next: (err?: NodeJS.ErrnoException) => void, errHandler?: ErrorHandler): void;
export declare function mkdirSync(rootDir: string, targetDir?: string): boolean;
/** Remove a file or a directory (recursively). Rejects when `path` does not exist. */
export declare function rmdirAsync(path: string): Promise<void>;
/** @deprecated Use {@link rmdirAsync} */
export declare function rmdir(path: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler?: ErrorHandler): void;
export declare function rmdirSync(path: string): void;
/** @deprecated Use {@link unlinkAsync} */
export declare function unlink(path: string, next: (err: NodeJS.ErrnoException | null) => void): void;
/**
 * Copy `src` file to `dest`. An existing `dest` file is replaced.
 * Both paths must be file paths (with an extension).
 */
export declare function copyFileAsync(src: string, dest: string): Promise<void>;
/** @deprecated Use {@link copyFileAsync} */
export declare function copyFile(src: string, dest: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler?: ErrorHandler): void;
export declare function copyFileSync(src: string, dest: string): void;
/** Copy a file or a directory (recursively) from `src` to `dest`. */
export declare function copyDirAsync(src: string, dest: string): Promise<void>;
/** @deprecated Use {@link copyDirAsync} */
export declare function copyDir(src: string, dest: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler?: ErrorHandler): void;
export declare function copyDirSync(src: string, dest: string): void;
/** Async */
/** opendir async */
export declare function opendirAsync(absolute: string): Promise<_fs.Dir>;
/** Get all file(s) async from given directory */
export declare function getFilesAsync(dir: string, recursive?: boolean): AsyncGenerator<string>;
/** unlink Async */
export declare function unlinkAsync(absolute: string): Promise<void>;
/** WriteFile Async */
export declare function writeFileAsync(absolute: string, data: string | Buffer): Promise<void>;
/** Make Dir Async */
export declare function mkdirAsync(errHandler: ErrorHandler, rootDir: string, targetDir: string): Promise<any>;
/** Check File or Dir is exists */
export declare function existsAsync(path: string): Promise<boolean>;
