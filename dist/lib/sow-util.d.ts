import { IContext } from './sow-server';
import { IRequest, IResponse } from './sow-server-core';
export declare namespace Util {
    function guid(): string;
    function extend(destination: any, source: any, deep?: boolean): {
        [x: string]: any;
    };
    function clone(source: {
        [x: string]: any;
    }): {
        [x: string]: any;
    };
    /** Checks whether the specified value is an object. true if the value is an object; false otherwise.*/
    function isPlainObject(obj?: any): obj is {
        [x: string]: any;
    };
    /** Checks whether the specified value is an array object. true if the value is an array object; false otherwise.*/
    function isArrayLike(obj?: any): obj is [];
    /** compair a stat.mtime > b stat.mtime */
    function compairFile(a: string, b: string): boolean;
    function pipeOutputStream(absPath: string, ctx: IContext): void;
    function readJsonAsync(absPath: string): {
        [id: string]: any;
    } | void;
    function rmdirSync(path: string): void;
    function copySync(src: string, dest: string): void;
    function isExists(path: string, next?: (code?: number | undefined, transfer?: boolean) => void): string | boolean;
    function mkdirSync(rootDir: string, targetDir?: string): boolean;
    function sendResponse(req: IRequest, res: IResponse, next: (code?: number | undefined, transfer?: boolean) => void, reqPath: string): void;
    function getExtension(reqPath: string): string | void;
}
