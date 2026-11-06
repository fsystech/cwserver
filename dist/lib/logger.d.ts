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
    /**
     * Formats a day-of-month, hour, minute or second value as a two-digit string, mapping 0 to 1 and
     * zero-padding single digits.
     *
     * @param t Numeric date or time component.
     * @returns Two-digit string.
     */
    static dfo(t: number): string;
    /**
     * Formats a zero-based month index as a one-based, two-digit month string.
     *
     * @param t Zero-based month index as returned by Date.getMonth.
     * @returns Two-digit month string from 01 to 12.
     */
    static dfm(t: number): string;
    /**
     * Builds a Date shifted to the given UTC offset by converting the current time to UTC and adding the
     * offset in hours.
     *
     * @param offset UTC offset in hours (for example +6 or -5).
     * @returns Date object whose local fields represent the time at the given offset.
     */
    static getLocalDateTime(offset: any): Date;
    /**
     * Formats the current time at the given UTC offset as a yyyy-MM-dd HH:mm:ss string.
     *
     * @param tz UTC offset in hours used to compute the local time.
     * @returns Formatted date-time string.
     */
    static getTime(tz: string): string;
}
declare type IColor = string;
export declare class ConsoleColor {
    /**
     * Wraps text in ANSI escape codes so it prints in cyan on a console.
     *
     * @param str Text to colorize.
     * @returns The text surrounded by cyan and reset escape sequences.
     */
    static Cyan(str: string): IColor;
    /**
     * Wraps text in ANSI escape codes so it prints in yellow on a console.
     *
     * @param str Text to colorize.
     * @returns The text surrounded by yellow and reset escape sequences.
     */
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
    /**
     * Indicates whether the logger is a production (no-op) logger.
     *
     * @returns Always true for the shadow logger.
     */
    get isProduction(): boolean;
    /**
     * Creates a no-op logger and marks it as production.
     */
    constructor();
    /**
     * Does nothing; discards the supplied buffer message.
     *
     * @param msg Message that is ignored.
     */
    writeBuffer(msg: string): void;
    /**
     * Does nothing; no separator line is written.
     *
     * @returns Nothing (undefined).
     */
    newLine(): any;
    /**
     * Does nothing; discards the message and returns the logger for chaining.
     *
     * @param msg Message that is ignored.
     * @param color Optional color that is ignored.
     * @returns This logger instance.
     */
    write(msg: string, color?: IColor): ILogger;
    /**
     * Does nothing; discards the message and returns the logger for chaining.
     *
     * @param msg Message that is ignored.
     * @param color Optional color that is ignored.
     * @returns This logger instance.
     */
    log(msg: string, color?: IColor): ILogger;
    /**
     * Does nothing; discards the informational message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    info(msg: string): ILogger;
    /**
     * Does nothing; discards the success message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    success(msg: string): ILogger;
    /**
     * Does nothing; discards the error message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    error(msg: string): ILogger;
    /**
     * Does nothing; there is no console state to reset.
     *
     * @returns This logger instance.
     */
    reset(): ILogger;
    /**
     * Does nothing; discards the string instead of writing it to a stream.
     *
     * @param str Text that is ignored.
     */
    writeToStream(str: string): void;
    /**
     * Does nothing because nothing is buffered.
     *
     * @returns Always true.
     */
    flush(): boolean;
    /**
     * Does nothing; there are no resources to release.
     */
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
    /**
     * Indicates whether the logger is a production (no-op) logger.
     *
     * @returns Always false for the file logger.
     */
    get isProduction(): boolean;
    /**
     * Creates a logger that writes to the console and, when a directory is given, to a dated log file
     * opened in append mode. Creates the directory if missing and writes a header for a new file; without
     * a directory no file output is enabled.
     *
     * @param dir Directory for the log file; when omitted file logging is disabled.
     * @param name Base name of the log file; a random name is used if omitted. The date and .log extension are
     *   appended.
     * @param tz UTC offset in hours used for timestamps and file date, defaults to +6.
     * @param userInteractive Whether to print to the console as well as the file; defaults to true.
     * @param isDebug Enables debug-level methods (log, info, success, error, reset); defaults to true and, when true, is
     *   effective only if userInteractive is true.
     * @param maxBlockSize Buffered size in bytes at which the buffer is flushed to disk; defaults to 10 MB.
     */
    constructor(dir?: string, name?: string, tz?: string, userInteractive?: boolean, isDebug?: boolean, maxBlockSize?: number);
    /**
     * Appends all buffered log data to the log file and clears the buffer. Throws an Error if the log file
     * has not been opened.
     *
     * @returns True if buffered data was written, false if the buffer was empty.
     */
    flush(): boolean;
    /**
     * Adds text to the in-memory buffer when file writing is enabled and flushes to disk once the buffer
     * reaches the maximum block size.
     *
     * @param str Raw text to append to the log buffer.
     */
    writeToStream(str: string): void;
    /**
     * Writes a separator line of dashes to the log buffer.
     */
    newLine(): void;
    /**
     * Splits the content into lines and writes each non-blank line to the log buffer prefixed with a
     * timestamp, with tabs removed.
     *
     * @param buffer String or object (converted with toString) to log.
     */
    private _write;
    /**
     * Converts the string to a Buffer and writes it to the log file buffer as timestamped lines.
     *
     * @param buffer Text to write to the log.
     */
    writeBuffer(buffer: string): void;
    /**
     * Internal logging routine that writes the message to the file and/or console depending on interactive
     * and debug settings, applying the optional color on the console output.
     *
     * @param color ANSI color string or function that transforms the message into a colored string.
     * @param msg Message to log.
     * @returns This logger instance.
     */
    private _log;
    /**
     * Logs a message regardless of debug mode, to the file and console as configured.
     *
     * @param msg Message to log.
     * @param color Optional console color string or function.
     * @returns This logger instance.
     */
    write(msg: any, color?: IColor): ILogger;
    /**
     * Logs a message with an optional color when debug mode is enabled; does nothing otherwise.
     *
     * @param msg Message to log.
     * @param color Optional console color string or function.
     * @returns This logger instance.
     */
    log(msg: any, color?: IColor): ILogger;
    /**
     * Logs an informational message in yellow when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    info(msg: any): ILogger;
    /**
     * Logs a success message in green when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    success(msg: any): ILogger;
    /**
     * Logs an error message in red when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    error(msg: any): ILogger;
    /**
     * Prints the console reset color code when debug mode is enabled.
     *
     * @returns This logger instance.
     */
    reset(): ILogger;
    /**
     * Flushes buffered data, closes the log file and disables further file writing, then disposes the
     * internal buffer.
     */
    dispose(): void;
}
export {};
