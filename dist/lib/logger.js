"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.ShadowLogger = exports.ConsoleColor = exports.LogTime = void 0;
// 11:26 PM 9/28/2019
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const app_static_1 = require("./app-static");
const fsw = __importStar(require("./fsw"));
class LogTime {
    /**
     * Formats a day-of-month, hour, minute or second value as a two-digit string, mapping 0 to 1 and
     * zero-padding single digits.
     *
     * @param t Numeric date or time component.
     * @returns Two-digit string.
     */
    static dfo(t) {
        t = t === 0 ? 1 : t;
        return String(t <= 9 ? "0" + t : t);
    }
    /**
     * Formats a zero-based month index as a one-based, two-digit month string.
     *
     * @param t Zero-based month index as returned by Date.getMonth.
     * @returns Two-digit month string from 01 to 12.
     */
    static dfm(t) {
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
    static getLocalDateTime(offset) {
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
    static getTime(tz) {
        const date = this.getLocalDateTime(tz);
        return `${date.getFullYear()}-${this.dfm(date.getMonth())}-${this.dfo(date.getDate())} ${this.dfo(date.getHours())}:${this.dfo(date.getMinutes())}:${this.dfo(date.getSeconds())}`;
    }
}
exports.LogTime = LogTime;
class ConsoleColor {
    /**
     * Wraps text in ANSI escape codes so it prints in cyan on a console.
     *
     * @param str Text to colorize.
     * @returns The text surrounded by cyan and reset escape sequences.
     */
    static Cyan(str) {
        return `\x1b[36m${str}\x1b[0m`;
    }
    /**
     * Wraps text in ANSI escape codes so it prints in yellow on a console.
     *
     * @param str Text to colorize.
     * @returns The text surrounded by yellow and reset escape sequences.
     */
    static Yellow(str) {
        return `\x1b[33m${str}\x1b[0m`;
    }
}
exports.ConsoleColor = ConsoleColor;
ConsoleColor.Reset = '\x1b[0m';
ConsoleColor.Bright = '\x1b[1m';
ConsoleColor.Dim = '\x1b[2m';
ConsoleColor.Underscore = '\x1b[4m';
ConsoleColor.Blink = '\x1b[5m';
ConsoleColor.Reverse = '\x1b[7m';
ConsoleColor.Hidden = '\x1b[8m';
ConsoleColor.FgBlack = '\x1b[30m';
ConsoleColor.FgRed = '\x1b[31m';
ConsoleColor.FgGreen = '\x1b[32m';
ConsoleColor.FgYellow = '\x1b[33m';
ConsoleColor.FgBlue = '\x1b[34m';
ConsoleColor.FgMagenta = '\x1b[35m';
ConsoleColor.FgCyan = '\x1b[36m';
ConsoleColor.FgWhite = '\x1b[37m';
ConsoleColor.BgBlack = '\x1b[40m';
ConsoleColor.BgRed = '\x1b[41m';
ConsoleColor.BgGreen = '\x1b[42m';
ConsoleColor.BgYellow = '\x1b[43m';
ConsoleColor.BgBlue = '\x1b[44m';
ConsoleColor.BgMagenta = '\x1b[45m';
ConsoleColor.BgCyan = '\x1b[46m';
ConsoleColor.BgWhite = '\x1b[47m';
/**
 * Type guard that checks whether a value is a string.
 *
 * @param a Value to test.
 * @returns True if the value is of type string, otherwise false.
 */
function isString(a) {
    return typeof (a) === "string";
}
class ShadowLogger {
    /**
     * Indicates whether the logger is a production (no-op) logger.
     *
     * @returns Always true for the shadow logger.
     */
    get isProduction() {
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
    writeBuffer(msg) {
        return;
    }
    /**
     * Does nothing; no separator line is written.
     *
     * @returns Nothing (undefined).
     */
    newLine() {
        return;
    }
    /**
     * Does nothing; discards the message and returns the logger for chaining.
     *
     * @param msg Message that is ignored.
     * @param color Optional color that is ignored.
     * @returns This logger instance.
     */
    write(msg, color) {
        return this;
    }
    /**
     * Does nothing; discards the message and returns the logger for chaining.
     *
     * @param msg Message that is ignored.
     * @param color Optional color that is ignored.
     * @returns This logger instance.
     */
    log(msg, color) {
        return this;
    }
    /**
     * Does nothing; discards the informational message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    info(msg) {
        return this;
    }
    /**
     * Does nothing; discards the success message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    success(msg) {
        return this;
    }
    /**
     * Does nothing; discards the error message.
     *
     * @param msg Message that is ignored.
     * @returns This logger instance.
     */
    error(msg) {
        return this;
    }
    /**
     * Does nothing; there is no console state to reset.
     *
     * @returns This logger instance.
     */
    reset() {
        return this;
    }
    /**
     * Does nothing; discards the string instead of writing it to a stream.
     *
     * @param str Text that is ignored.
     */
    writeToStream(str) {
        return;
    }
    /**
     * Does nothing because nothing is buffered.
     *
     * @returns Always true.
     */
    flush() {
        return true;
    }
    /**
     * Does nothing; there are no resources to release.
     */
    dispose() {
        return;
    }
}
exports.ShadowLogger = ShadowLogger;
class Logger {
    /**
     * Indicates whether the logger is a production (no-op) logger.
     *
     * @returns Always false for the file logger.
     */
    get isProduction() {
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
    constructor(dir, name, tz, userInteractive, isDebug, maxBlockSize) {
        this._blockSize = 0;
        this._maxBlockSize = 10485760; /* (Max block size (1024*1024)*10) = 10 MB */
        this._fd = -1;
        this._buff = new app_static_1.BufferArray();
        this._isProduction = false;
        this._userInteractive = typeof (userInteractive) !== "boolean" ? true : userInteractive;
        this._isDebug = typeof (isDebug) !== "boolean" ? true : isDebug === true ? userInteractive === true : isDebug;
        this._canWrite = false;
        this._tz = "+6";
        if (!dir)
            return;
        dir = _path.resolve(dir);
        if (!tz)
            tz = '+6';
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
        }
        else {
            this.newLine();
        }
    }
    /**
     * Appends all buffered log data to the log file and clears the buffer. Throws an Error if the log file
     * has not been opened.
     *
     * @returns True if buffered data was written, false if the buffer was empty.
     */
    flush() {
        if (this._fd < 0) {
            throw new Error("File not open yet....");
        }
        if (this._buff.length === 0)
            return false;
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
    writeToStream(str) {
        if (this._canWrite === false)
            return void 0;
        this._blockSize += this._buff.push(str);
        if (this._blockSize < this._maxBlockSize)
            return void 0;
        return this.flush(), void 0;
    }
    /**
     * Writes a separator line of dashes to the log buffer.
     */
    newLine() {
        return this.writeToStream(`${'-'.repeat(100)}\r\n`);
    }
    /**
     * Splits the content into lines and writes each non-blank line to the log buffer prefixed with a
     * timestamp, with tabs removed.
     *
     * @param buffer String or object (converted with toString) to log.
     */
    _write(buffer) {
        const str = !isString(buffer) ? buffer.toString() : buffer;
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
    writeBuffer(buffer) {
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
    _log(color, msg) {
        if (!this._isDebug && !this._userInteractive)
            return this._write(msg), this;
        if (!this._userInteractive) {
            console.log(msg);
        }
        else {
            this._write(msg);
            if (color) {
                if (typeof (color) === "function") {
                    msg = color(msg);
                }
                else {
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
    write(msg, color) {
        return this._log(color, msg);
    }
    /**
     * Logs a message with an optional color when debug mode is enabled; does nothing otherwise.
     *
     * @param msg Message to log.
     * @param color Optional console color string or function.
     * @returns This logger instance.
     */
    log(msg, color) {
        if (!this._isDebug)
            return this;
        return this._log(color, msg);
    }
    /**
     * Logs an informational message in yellow when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    info(msg) {
        if (!this._isDebug)
            return this;
        return this._log(ConsoleColor.Yellow, msg);
    }
    /**
     * Logs a success message in green when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    success(msg) {
        if (!this._isDebug)
            return this;
        return this._log(ConsoleColor.FgGreen, msg);
    }
    /**
     * Logs an error message in red when debug mode is enabled.
     *
     * @param msg Message to log.
     * @returns This logger instance.
     */
    error(msg) {
        if (!this._isDebug)
            return this;
        return this._log(ConsoleColor.FgRed, msg);
    }
    /**
     * Prints the console reset color code when debug mode is enabled.
     *
     * @returns This logger instance.
     */
    reset() {
        if (!this._isDebug)
            return this;
        return console.log(ConsoleColor.Reset), this;
    }
    /**
     * Flushes buffered data, closes the log file and disables further file writing, then disposes the
     * internal buffer.
     */
    dispose() {
        if (this._fd > 0) {
            this.flush();
            _fs.closeSync(this._fd);
            this._fd = -1;
            this._canWrite = false;
        }
        this._buff.dispose();
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map