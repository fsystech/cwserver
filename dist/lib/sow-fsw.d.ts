/// <reference types="node" />
import * as _fs from 'fs';
export declare type ErrorHandler = (err: NodeJS.ErrnoException | Error | null | undefined, next: () => void) => void;
export declare function stat(path: string, next: (err?: NodeJS.ErrnoException | null, stat?: _fs.Stats) => void, errHandler: ErrorHandler): void;
export declare function compairFile(a: string, b: string, next: (err: NodeJS.ErrnoException | null, changed: boolean) => void, errHandler: ErrorHandler): void;
export declare function isExists(path: string, next: (exists: boolean, url: string) => void): void;
export declare function readJson<T>(absPath: string, next: (err: NodeJS.ErrnoException | null, json: NodeJS.Dict<T> | void) => void, errHandler: ErrorHandler): void;
export declare function mkdir(rootDir: string, targetDir: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler: ErrorHandler): void;
export declare function rmdir(path: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler: ErrorHandler): void;
export declare function unlink(path: string, next: (err: NodeJS.ErrnoException | null) => void): void;
export declare function copyFile(src: string, dest: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler: ErrorHandler): void;
export declare function copyDir(src: string, dest: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler: ErrorHandler): void;
/** compair a stat.mtime > b stat.mtime */
export declare function compairFileSync(a: string, b: string): boolean;
export declare function readJsonAsync<T>(absPath: string): NodeJS.Dict<T> | void;
export declare function copyFileSync(src: string, dest: string): void;
export declare function rmdirSync(path: string): void;
export declare function copySync(src: string, dest: string): void;
export declare function mkdirSync(rootDir: string, targetDir?: string): boolean;
