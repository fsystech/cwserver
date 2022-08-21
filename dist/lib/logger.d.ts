import { IDispose } from './app-static';
export interface ILogger extends IDispose {
    isProduction: boolean;
    newLine(): any;
    write(msg: string, color?: string): ILogger;
    log(msg: string, color?: string): ILogger;
    info(msg: string): ILogger;
    success(msg: string): ILogger;
    error(msg: string): ILogger;
    reset(): ILogger;
    writeToStream(str: string): void;
    flush(): boolean;
    writeBuffer(msg: string): void;
}
export declare class LogTime {
    static dfo(t: number): string;
    static dfm(t: number): string;
    static getLocalDateTime(offset: any): Date;
    static getTime(tz: string): string;
}
declare type IColor = string;
export declare class ConsoleColor {
    static Cyan(str: string): IColor;
    static Yellow(str: string): IColor;
    static Reset: IColor;
    static Bright: IColor;
    static Dim: IColor;
    static Underscore: IColor;
    static Blink: IColor;
    static Reverse: IColor;
    static Hidden: IColor;
    static FgBlack: IColor;
    static FgRed: IColor;
    static FgGreen: IColor;
    static FgYellow: IColor;
    static FgBlue: IColor;
    static FgMagenta: IColor;
    static FgCyan: IColor;
    static FgWhite: IColor;
    static BgBlack: IColor;
    static BgRed: IColor;
    static BgGreen: IColor;
    static BgYellow: IColor;
    static BgBlue: IColor;
    static BgMagenta: IColor;
    static BgCyan: IColor;
    static BgWhite: IColor;
}
export declare class ShadowLogger implements ILogger {
    private _isProduction;
    get isProduction(): boolean;
    constructor();
    writeBuffer(msg: string): void;
    newLine(): void;
    write(msg: string, color?: IColor): ILogger;
    log(msg: string, color?: IColor): ILogger;
    info(msg: string): ILogger;
    success(msg: string): ILogger;
    error(msg: string): ILogger;
    reset(): ILogger;
    writeToStream(str: string): void;
    flush(): boolean;
    dispose(): void;
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
    private _isProduction;
    get isProduction(): boolean;
    constructor(dir?: string, name?: string, tz?: string, userInteractive?: boolean, isDebug?: boolean, maxBlockSize?: number);
    flush(): boolean;
    writeToStream(str: string): void;
    newLine(): void;
    private _write;
    writeBuffer(buffer: string): void;
    private _log;
    write(msg: any, color?: IColor): ILogger;
    log(msg: any, color?: IColor): ILogger;
    info(msg: any): ILogger;
    success(msg: any): ILogger;
    error(msg: any): ILogger;
    reset(): ILogger;
    dispose(): void;
}
export {};
