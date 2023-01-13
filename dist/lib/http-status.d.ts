import { IResInfo } from './app-static';
export type Dict<T> = {
    [K in string | number]: T | undefined;
};
export declare class HttpStatus {
    static get statusCode(): {
        [id: number]: string;
    };
    static getDescription(statusCode: number): string;
    static fromPath(path: string | any, statusCode: any): number;
    static isValidCode(statusCode: number): boolean;
    static getResInfo(path: string | number, code: any): IResInfo;
    static isErrorFileName(name: string): boolean;
    static isErrorCode(code: any): boolean;
}
