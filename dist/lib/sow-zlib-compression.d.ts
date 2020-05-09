/// <reference types="node" />
import { IRequest } from './sow-server-core';
export declare class Gzip {
    static fromString(str: string, next: (error: Error | null, result: Buffer) => void): void;
    static buffer(buffer: Buffer, next: (error: Error | null, result: Buffer) => void): void;
}
export declare class Compression {
    static isAcceptedEncoding(req: IRequest, name: string): boolean;
    static gzip: Gzip;
}
