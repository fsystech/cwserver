/// <reference types="node" />
import { Stats } from 'fs';
import { IContext } from './sow-server';
export declare namespace Streamer {
    function stream(ctx: IContext, absPath: string, mimeType: string, fstat: Stats): void;
}
