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
    function isPlainObject(obj?: any): obj is {
        [x: string]: any;
    };
    function isArrayLike(obj?: any): obj is [];
    function isFileModified(a: string, b: string): boolean;
    function isExists(path: string, next?: (code: number | undefined, transfer?: boolean) => void): string | boolean;
    function sendResponse(req: IRequest, res: IResponse, next: (code: number | undefined, transfer?: boolean) => void, reqPath: string): void;
    function getExtension(reqPath: string): string | void;
}
