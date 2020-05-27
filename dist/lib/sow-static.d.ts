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
export declare function ToNumber(obj: any): number;
export declare function ToResponseTime(timestamp?: number): string;
