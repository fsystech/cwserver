import { IResInfo } from './sow-static';
export declare const HttpStatusCode: {
    [x: string]: number;
};
export declare class HttpStatus {
    static get statusCode(): {
        [x: string]: number;
    };
    static getDescription(statusCode: number): string;
    static fromPath(path: string | any, statusCode: any): number;
    static isValidCode(statusCode: number): boolean;
    static getResInfo(path: string | number, code: any): IResInfo;
    static isErrorCode(code: any): boolean;
}
