import * as _fs from 'node:fs';
import { ErrorHandler } from './app-static';
/**
 * Gets file system stats for a path.
 *
 * @param path Path of the file or directory.
 * @returns Promise resolving to the fs.Stats object; rejects if the path does not exist.
 */
export declare function statAsync(path: string): Promise<_fs.Stats>;
/** @deprecated Use {@link statAsync} */
export declare function stat(path: string, next: (err?: NodeJS.ErrnoException, stat?: _fs.Stats) => void): void;
/** Move file async */
export declare function moveFileAsync(src: string, dest: string, force?: boolean): Promise<boolean>;
/** @deprecated Use {@link moveFileAsync} */
export declare function moveFile(src: string, dest: string, next: (err?: NodeJS.ErrnoException) => void, force?: boolean): void;
/**
 * Compares the modification times of two files.
 *
 * @param a Path of the first file.
 * @param b Path of the second file.
 * @returns Promise resolving to true if file a was modified later than file b.
 */
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
/**
 * Checks whether a path exists and resolves it to an absolute path. Never rejects.
 *
 * @param path Path to check.
 * @returns Promise resolving to an object with exists and the resolved absolute url.
 */
export declare function isExistsAsync(path: string): Promise<{
    exists: boolean;
    url: string;
}>;
/**
 * Reads a file and parses it as JSON, removing a leading BOM.
 *
 * @param absPath Absolute path of the JSON file.
 * @returns Promise resolving to the parsed data, or null if the file is empty; rejects on read or parse errors.
 */
export declare function readJsonAsync<T>(absPath: string): Promise<T>;
/** @deprecated Use {@link readJsonAsync} */
export declare function readJson<T>(absPath: string, next: (err?: NodeJS.ErrnoException, json?: T) => void, errHandler?: ErrorHandler): void;
/**
 * Synchronously reads a JSON file, removing a BOM, comments and blank lines before parsing. Throws on
 * read or parse errors.
 *
 * @param absPath Absolute path of the JSON file.
 * @returns The parsed JSON data.
 */
export declare function readJsonSyncUnsafe<T>(absPath: string): T;
/**
 * Synchronously reads a JSON file (comments allowed), swallowing any error.
 *
 * @param absPath Absolute path of the JSON file.
 * @returns The parsed data, or null if reading or parsing failed.
 */
export declare function readJsonSync<T>(absPath: string): T;
/**
 * Creates a directory path, including missing parent directories. Throws if arguments are missing,
 * targetDir starts with a dot, the path exists as a non-directory, or the path has a file extension.
 *
 * @param rootDir Root directory, or the full directory path when targetDir is omitted.
 * @param targetDir Optional sub-path to create under rootDir.
 * @returns Promise that resolves once the directories exist or already existed.
 */
export declare function mkdirAsyncx(rootDir: string, targetDir?: string): Promise<void>;
/** @deprecated Use {@link mkdirAsyncx} */
export declare function mkdir(rootDir: string, targetDir: string, next: (err?: NodeJS.ErrnoException) => void, errHandler?: ErrorHandler): void;
/**
 * Synchronously creates a directory path including missing parents. Throws if targetDir starts with a
 * dot; returns false for an empty root or a path with a file extension.
 *
 * @param rootDir Root directory, or the full directory path when targetDir is omitted.
 * @param targetDir Optional sub-path to create under rootDir.
 * @returns True if the target directory exists afterwards, otherwise false.
 */
export declare function mkdirSync(rootDir: string, targetDir?: string): boolean;
/** Remove a file or a directory (recursively). Rejects when `path` does not exist. */
export declare function rmdirAsync(path: string): Promise<void>;
/** @deprecated Use {@link rmdirAsync} */
export declare function rmdir(path: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler?: ErrorHandler): void;
/**
 * Synchronously deletes a file, or a directory with all its contents. Does nothing if the path does
 * not exist.
 *
 * @param path Path of the file or directory to remove.
 */
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
/**
 * Synchronously copies a file, replacing an existing destination. Throws if either path lacks an
 * extension or the source does not exist.
 *
 * @param src Source file path.
 * @param dest Destination file path.
 */
export declare function copyFileSync(src: string, dest: string): void;
/** Copy a file or a directory (recursively) from `src` to `dest`. */
export declare function copyDirAsync(src: string, dest: string): Promise<void>;
/** @deprecated Use {@link copyDirAsync} */
export declare function copyDir(src: string, dest: string, next: (err: NodeJS.ErrnoException | null) => void, errHandler?: ErrorHandler): void;
/**
 * Synchronously copies a file or a directory tree. Does nothing if the source does not exist.
 *
 * @param src Source file or directory path.
 * @param dest Destination path; created if missing.
 */
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
