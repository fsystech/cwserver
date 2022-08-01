import { IContext } from './sow-server';
export declare function assert(condition: any, expr: string): void;
export declare function getLibRoot(): string;
export declare function getAppDir(): string;
export declare function generateRandomString(num: number): string;
declare class JSONW {
    static parse(text: any, reviver?: (this: any, key: string, value: any) => any): any;
    static stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): any;
}
export declare class Util {
    static guid(): string;
    static readonly JSON: typeof JSONW;
    static extend<T>(destination: T, source: any, deep?: boolean): T;
    static clone<T>(source: T): T;
    /** Checks whether the specified value is an object. true if the value is an object; false otherwise. */
    static isPlainObject(obj?: any): obj is {
        [x: string]: any;
    };
    /** Checks whether the specified value is an array object. true if the value is an array object; false otherwise. */
    static isArrayLike<T>(obj?: any): obj is T[];
    static isError(obj: any): obj is Error;
    static throwIfError(obj: any): void;
    static pipeOutputStream(absPath: string, ctx: IContext): void;
    static sendResponse(ctx: IContext, reqPath: string, contentType?: string): void;
    static getExtension(reqPath: string): string | void;
}
export {};
