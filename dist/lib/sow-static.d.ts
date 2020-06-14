/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
export interface ISession {
    isAuthenticated: boolean;
    loginId: string;
    roleId: string;
    userData?: void;
}
export interface IResInfo {
    code: number;
    isValid: boolean;
    isErrorCode: boolean;
    isInternalErrorCode: boolean;
    tryServer: boolean;
}
export declare class Session implements ISession {
    isAuthenticated: boolean;
    loginId: string;
    roleId: string;
    userData?: void;
    constructor();
}
export declare class ResInfo implements IResInfo {
    code: number;
    isValid: boolean;
    isErrorCode: boolean;
    isInternalErrorCode: boolean;
    tryServer: boolean;
    constructor();
}
export declare function ToNumber( obj: any ): number;
export declare function ToResponseTime( timestamp?: number ): string;