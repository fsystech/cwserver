import * as _fs from 'node:fs';
import { ErrorHandler } from './app-static';
export declare function stat(path: string, next: (err?: NodeJS.ErrnoException | null, stat?: _fs.Stats) => void): void;
export declare function moveFile(src: string, dest: string, next: (err: NodeJS.ErrnoException | null) => void, force?: boolean): void;
/** compareFile a stat.mtime > b stat.mtime */
export declare function compareFile(a: string, b: string, next: (err: NodeJS.ErrnoException | null, changed: boolean) => void, errHandler: ErrorHandler): void;
/** compareFileSync a stat.mtime > b stat.mtime */
export declare function compareFileSync(a: string, b: string): boolean;
export declare function isExists(path: string, next: (exists: boolean, url: string) => void): void;
export declare function isExistsAsync(path: string): Promise<{
    exists: boolean;
    url: string;
}>;
export declare function readJson<T>(absPath: string, next: (err: NodeJS.ErrnoException | null, json: NodeJS.Dict<T> | void) => void, errHandler: ErrorHandler): void;
export declare function readJsonSync<T>(absPath: string): NodeJS.Dict<T> | void;
export declare function mkdir(rootDir: string, targetDir: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler: ErrorHandler): void;
export declare function mkdirSync(rootDir: string, targetDir?: string): boolean;
export declare function rmdir(path: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler: ErrorHandler): void;
export declare function rmdirSync(path: string): void;
export declare function unlink(path: string, next: (err: NodeJS.ErrnoException | null) => void): void;
export declare function copyFile(src: string, dest: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler: ErrorHandler): void;
export declare function copyFileSync(src: string, dest: string): void;
export declare function copyDir(src: string, dest: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler: ErrorHandler): void;
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
/** Move file async */
export declare function moveFileAsync(src: string, dest: string): Promise<any>;
