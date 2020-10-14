/// <reference types="node" />
import * as _fs from 'fs';
import { ErrorHandler } from './sow-static';
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
