/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { IResInfo } from './sow-static';
export declare const HttpStatusCode: {
    [x: string]: number;
};
export declare class HttpStatus {
    static get statusCode(): {
        [x: string]: number;
    };
    static getDescription( statusCode: number ): string;
    static fromPath( path: string | any, statusCode: any ): number;
    static isValidCode( statusCode: number ): boolean;
    static getResInfo( path: string, code: any ): IResInfo;
    static isErrorCode( code: any ): boolean;
}