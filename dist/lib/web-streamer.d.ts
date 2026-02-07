import { Stats } from 'node:fs';
import type { IContext } from './context';
export declare class Streamer {
    static stream(ctx: IContext, absPath: string, mimeType: string, fstat: Stats): void;
}
