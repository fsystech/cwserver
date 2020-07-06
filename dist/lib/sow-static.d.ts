/// <reference types="node" />
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
    description: string;
}
export interface IDispose {
    dispose(): void;
}
export interface IBufferArray extends IDispose {
    readonly data: Buffer;
    readonly length: number;
    push(buff: Buffer | string): number;
    clear(): void;
    toString(encoding?: BufferEncoding): string;
}
export declare class BufferArray implements IBufferArray {
    private _data;
    private _length;
    private _isDisposed;
    get data(): Buffer;
    get length(): number;
    constructor();
    private isDisposed;
    push(buff: Buffer | string): number;
    clear(): void;
    toString(encoding?: BufferEncoding): string;
    dispose(): void;
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
    description: string;
    constructor();
}
export declare function toString(val: any): string;
export declare function ToNumber(obj: any): number;
export declare function ToResponseTime(timestamp?: number | Date): string;
