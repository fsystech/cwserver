import { IDispose } from './sow-static';
export interface ILogger extends IDispose {
    newLine(): any;
    write(msg: string, color?: string): ILogger;
    log(msg: string, color?: string): ILogger;
    info(msg: string): ILogger;
    success(msg: string): ILogger;
    error(msg: string): ILogger;
    reset(): ILogger;
    writeToStream(str: string): void;
    flush(): boolean;
}
export declare class LogTime {
    static dfo(t: number): string;
    static dfm(t: number): string;
    static getLocalDateTime(offset: any): Date;
    static getTime(tz: string): string;
}
export declare class ConsoleColor {
    static Cyan(str: string): string;
    static Yellow(str: string): string;
    static Reset: string;
    static Bright: string;
    static Dim: string;
    static Underscore: string;
    static Blink: string;
    static Reverse: string;
    static Hidden: string;
    static FgBlack: string;
    static FgRed: string;
    static FgGreen: string;
    static FgYellow: string;
    static FgBlue: string;
    static FgMagenta: string;
    static FgCyan: string;
    static FgWhite: string;
    static BgBlack: string;
    static BgRed: string;
    static BgGreen: string;
    static BgYellow: string;
    static BgBlue: string;
    static BgMagenta: string;
    static BgCyan: string;
    static BgWhite: string;
}
export declare class Logger implements ILogger {
    private _userInteractive;
    private _isDebug;
    private _canWrite;
    private _tz;
    private _buff;
    private _blockSize;
    private _maxBlockSize;
    private _fd;
    constructor(dir?: string, name?: string, tz?: string, userInteractive?: boolean, isDebug?: boolean, maxBlockSize?: number);
    flush(): boolean;
    writeToStream(str: string): void;
    newLine(): void;
    private _write;
    private _log;
    write(msg: any, color?: string): ILogger;
    log(msg: any, color?: string): ILogger;
    info(msg: any): ILogger;
    success(msg: any): ILogger;
    error(msg: any): ILogger;
    reset(): ILogger;
    dispose(): void;
}
