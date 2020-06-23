/// <reference types="node" />
import { IResInfo } from './sow-static';
export declare const HttpStatusCode: NodeJS.Dict<number>;
export declare class HttpStatus {
    static get statusCode(): NodeJS.Dict<number>;
    static getDescription(statusCode: number): string;
    static fromPath(path: string | any, statusCode: any): number;
    static isValidCode(statusCode: number): boolean;
    static getResInfo(path: string | number, code: any): IResInfo;
    static isErrorCode(code: any): boolean;
}
