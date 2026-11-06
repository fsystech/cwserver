// Copyright (c) 2022 FSys Tech Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// 11:26 PM 9/28/2019
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import { IDispose, IBufferArray, BufferArray } from './app-static';
import * as fsw from './fsw';
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
export class LogTime {
    /**
     * Formats a day-of-month, hour, minute or second value as a two-digit string, mapping 0 to 1 and
     * zero-padding single digits.
     *
     * @param t Numeric date or time component.
     * @returns Two-digit string.
     */
    public static dfo(t: number): string {
        t = t === 0 ? 1 : t;
        return String(t <= 9 ? "0" + t : t);
    }
    /**
     * Formats a zero-based month index as a one-based, two-digit month string.
     *
     * @param t Zero-based month index as returned by Date.getMonth.
     * @returns Two-digit month string from 01 to 12.
     */
    public static dfm(t: number): string {
        t += 1;
        return String(t <= 9 ? "0" + t : t);
    }
    /**
     * Builds a Date shifted to the given UTC offset by converting the current time to UTC and adding the
     * offset in hours.
     *
     * @param offset UTC offset in hours (for example +6 or -5).
     * @returns Date object whose local fields represent the time at the given offset.
     */
    public static getLocalDateTime(offset: any): Date {
        // create Date object for current location
        const d = new Date();
        // convert to msec
        // subtract local time zone offset
        // get UTC time in msec
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        // create new Date object for different city
        // using supplied offset
        const nd = new Date(utc + (3600000 * offset));
        // return date
        return nd;
    }
    /**
     * Formats the current time at the given UTC offset as a yyyy-MM-dd HH:mm:ss string.
     *
     * @param tz UTC offset in hours used to compute the local time.
     * @returns Formatted date-time string.
     */
    public static getTime(tz: string): string {
        const date = this.getLocalDateTime(tz);
        return `${date.getFullYear()}-${this.dfm(date.getMonth())}-${this.dfo(date.getDate())} ${this.dfo(date.getHours())}:${this.dfo(date.getMinutes())}:${this.dfo(date.getSeconds())}`;
    }
}
declare type IColor = string;
export class ConsoleColor {
    /**
     * Wraps text in ANSI escape codes so it prints in cyan on a console.
     *
     * @param str Text to colorize.
     * @returns The text surrounded by cyan and reset escape sequences.
     */
    public static Cyan(str: string): IColor {
        return `\x1b[36m${str}\x1b[0m`;
    }
    /**
     * Wraps text in ANSI escape codes so it prints in yellow on a console.
     *
     * @param str Text to colorize.
     * @returns The text surrounded by yellow and reset escape sequences.
     */
    public static Yellow(str: string): IColor {
        return `\x1b[33m${str}\x1b[0m`;
    }
    public static Reset: IColor = '\x1b[0m';
    public static Bright: IColor = '\x1b[1m';
    public static Dim: IColor = '\x1b[2m';
    public static Underscore: IColor = '\x1b[4m';
    public static Blink: IColor = '\x1b[5m';
    public static Reverse: IColor = '\x1b[7m';
    public static Hidden: IColor = '\x1b[8m';
    public static FgBlack: IColor = '\x1b[30m';
    public static FgRed: IColor = '\x1b[31m';
    public static FgGreen: IColor = '\x1b[32m';
    public static FgYellow: IColor = '\x1b[33m';
    public static FgBlue: IColor = '\x1b[34m';
    public static FgMagenta: IColor = '\x1b[35m';
    public static FgCyan: IColor = '\x1b[36m';
    public static FgWhite: IColor = '\x1b[37m';
    public static BgBlack: IColor = '\x1b[40m';
    public static BgRed: IColor = '\x1b[41m';
    public static BgGreen: IColor = '\x1b[42m';
    public static BgYellow: IColor = '\x1b[43m';
    public static BgBlue: IColor = '\x1b[44m';
    public static BgMagenta: IColor = '\x1b[45m';
    public static BgCyan: IColor = '\x1b[46m';
    public static BgWhite: IColor = '\x1b[47m';
}
/**
 * Type guard that checks whether a value is a string.
 *
 * @param a Value to test.
 * @returns True if the value is of type string, otherwise false.
 */
function isString(a: any): a is string {
    return typeof (a) === "string";
}
export class ShadowLogger implements ILogger {
    private _isProduction: boolean;
    /**
     * Indicates whether the logger is a production (no-op) logger.
     *
     * @returns Always true for the shadow logger.
     */
    public get isProduction() {
        return this._isProduction;
    }
    /**
     * Creates a no-op logger and marks it as production.
     */
    constructor() {
        this._isProduction = true;
    }
    /**
     * Does nothing; discards the supplied buffer message.
     *
     * @param msg Message that is ignored.
     */
    writeBuffer(msg: string): void {
        return;
    }
    /**
     * Does nothing; no separator line is written.
     *
     * @returns Nothing (undefined).
     */
    public newLine(): any {
        return;
    }

    /**
     * Does nothing; discards the message and returns the logger for chaining.
     *
     * @param msg Message that is ignored.
     * @param color Optional color that is ignored.
     * @returns This logger instance.
     */
    public write(msg: string, color?: IColor): ILogger {
        return this;
    }

    /**
     * Does nothing; discards the message and returns the logger for chaining.
     *
     * @param msg Message that is ignored.
     * @param color Optional color that is ignored.
     * @returns This logger instance.
     */
    public log(msg: string, color?: IColor): ILogger {
        return this;
    }

    /**
     * Does nothing; discards the informational message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    public info(msg: string): ILogger {
        return this;
    }

    /**
     * Does nothing; discards the success message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    public success(msg: string): ILogger {
        return this;
    }

    /**
     * Does nothing; discards the error message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    public error(msg: string): ILogger {
        return this;
    }

    /**
     * Does nothing; there is no console state to reset.
     *
     * @returns This logger instance.
     */
    public reset(): ILogger {
        return this;
    }

    /**
     * Does nothing; discards the string instead of writing it to a stream.
     *
     * @param str Text that is ignored.
     */
    public writeToStream(str: string): void {
        return;
    }

    /**
     * Does nothing because nothing is buffered.
     *
     * @returns Always true.
     */
    public flush(): boolean {
        return true;
    }

    /**
     * Does nothing; there are no resources to release.
     */
    public dispose(): void {
        return;
    }

}
export class Logger implements ILogger {
    private _userInteractive: boolean;
    private _isDebug: boolean;
    private _canWrite: boolean;
    private _tz: string;
    private _buff: IBufferArray;
    private _blockSize: number = 0;
    private _maxBlockSize: number = 10485760; /* (Max block size (1024*1024)*10) = 10 MB */
    private _fd: number = -1;
    private _isProduction: boolean;
    /**
     * Indicates whether the logger is a production (no-op) logger.
     *
     * @returns Always false for the file logger.
     */
    public get isProduction() {
        return this._isProduction;
    }
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
    constructor(
        dir?: string, name?: string,
        tz?: string, userInteractive?: boolean,
        isDebug?: boolean, maxBlockSize?: number
    ) {
        this._buff = new BufferArray(); this._isProduction = false;
        this._userInteractive = typeof (userInteractive) !== "boolean" ? true : userInteractive;
        this._isDebug = typeof (isDebug) !== "boolean" ? true : isDebug === true ? userInteractive === true : isDebug;
        this._canWrite = false; this._tz = "+6";
        if (!dir) return;
        dir = _path.resolve(dir);
        if (!tz) tz = '+6';
        this._tz = tz;
        if (!_fs.existsSync(dir)) {
            fsw.mkdirSync(dir);
        }
        if (typeof (maxBlockSize) === "number") {
            this._maxBlockSize = maxBlockSize;
        }
        const date = LogTime.getLocalDateTime(this._tz);
        name = `${name || String(Math.random().toString(36).slice(2) + Date.now())}_${date.getFullYear()}_${LogTime.dfm(date.getMonth())}_${LogTime.dfo(date.getDate())}.log`;
        const path = _path.resolve(`${dir}/${name}`);
        const exists = _fs.existsSync(path);
        this._fd = _fs.openSync(path, 'a');
        this._canWrite = true;
        if (exists === false) {
            this.writeToStream(`Log Genarte On ${LogTime.getTime(this._tz)}\r\n${'-'.repeat(100)}\r\n`);
        } else {
            this.newLine();
        }
    }
    /**
     * Appends all buffered log data to the log file and clears the buffer. Throws an Error if the log file
     * has not been opened.
     *
     * @returns True if buffered data was written, false if the buffer was empty.
     */
    public flush(): boolean {
        if (this._fd < 0) {
            throw new Error("File not open yet....");
        }
        if (this._buff.length === 0) return false;
        _fs.appendFileSync(this._fd, this._buff.data);
        this._buff.clear();
        this._blockSize = 0;
        return true;
    }
    /**
     * Adds text to the in-memory buffer when file writing is enabled and flushes to disk once the buffer
     * reaches the maximum block size.
     *
     * @param str Raw text to append to the log buffer.
     */
    public writeToStream(str: string): void {
        if (this._canWrite === false) return void 0;
        this._blockSize += this._buff.push(str);
        if (this._blockSize < this._maxBlockSize) return void 0;
        return this.flush(), void 0;
    }
    /**
     * Writes a separator line of dashes to the log buffer.
     */
    public newLine(): void {
        return this.writeToStream(`${'-'.repeat(100)}\r\n`);
    }
    /**
     * Splits the content into lines and writes each non-blank line to the log buffer prefixed with a
     * timestamp, with tabs removed.
     *
     * @param buffer String or object (converted with toString) to log.
     */
    private _write(buffer: any): void {
        const str: string = !isString(buffer) ? buffer.toString() : buffer;
        str.split("\r\n").forEach((line) => {
            if (line && line.trim().length > 0) {
                this.writeToStream(`${LogTime.getTime(this._tz)}\t${line.replace(/\t/gi, "")}\r\n`);
            }
        });
        return void 0;
    }
    /**
     * Converts the string to a Buffer and writes it to the log file buffer as timestamped lines.
     *
     * @param buffer Text to write to the log.
     */
    public writeBuffer(buffer: string): void {
        return this._write(Buffer.from(buffer));
    }
    /**
     * Internal logging routine that writes the message to the file and/or console depending on interactive
     * and debug settings, applying the optional color on the console output.
     *
     * @param color ANSI color string or function that transforms the message into a colored string.
     * @param msg Message to log.
     * @returns This logger instance.
     */
    private _log(color?: string | ((str: string) => string), msg?: any): ILogger {
        if (!this._isDebug && !this._userInteractive) return this._write(msg), this;
        if (!this._userInteractive) {
            console.log(msg);
        } else {
            this._write(msg);
            if (color) {
                if (typeof (color) === "function") {
                    msg = color(msg);
                } else {
                    msg = `${color}${msg}`;
                }
            }
            console.log(`${ConsoleColor.FgMagenta}cwserver ${msg}${ConsoleColor.Reset}`);
        }
        return this;
    }
    /**
     * Logs a message regardless of debug mode, to the file and console as configured.
     *
     * @param msg Message to log.
     * @param color Optional console color string or function.
     * @returns This logger instance.
     */
    public write(msg: any, color?: IColor): ILogger {
        return this._log(color, msg);
    }
    /**
     * Logs a message with an optional color when debug mode is enabled; does nothing otherwise.
     *
     * @param msg Message to log.
     * @param color Optional console color string or function.
     * @returns This logger instance.
     */
    public log(msg: any, color?: IColor): ILogger {
        if (!this._isDebug) return this;
        return this._log(color, msg);
    }
    /**
     * Logs an informational message in yellow when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    public info(msg: any): ILogger {
        if (!this._isDebug) return this;
        return this._log(ConsoleColor.Yellow, msg);
    }
    /**
     * Logs a success message in green when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    public success(msg: any): ILogger {
        if (!this._isDebug) return this;
        return this._log(ConsoleColor.FgGreen, msg);
    }
    /**
     * Logs an error message in red when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    public error(msg: any): ILogger {
        if (!this._isDebug) return this;
        return this._log(ConsoleColor.FgRed, msg);
    }
    /**
     * Prints the console reset color code when debug mode is enabled.
     *
     * @returns This logger instance.
     */
    public reset(): ILogger {
        if (!this._isDebug) return this;
        return console.log(ConsoleColor.Reset), this;
    }
    /**
     * Flushes buffered data, closes the log file and disables further file writing, then disposes the
     * internal buffer.
     */
    public dispose() {
        if (this._fd > 0) {
            this.flush();
            _fs.closeSync(this._fd);
            this._fd = -1;
            this._canWrite = false;
        }
        this._buff.dispose();
    }
}