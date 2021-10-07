/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:26 PM 9/28/2019
import * as _fs from 'fs';
import * as _path from 'path';
import { IDispose, IBufferArray, BufferArray } from './sow-static';
import * as fsw from './sow-fsw';
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
export class LogTime {
    public static dfo(t: number): string {
        t = t === 0 ? 1 : t;
        return String(t <= 9 ? "0" + t : t);
    }
    public static dfm(t: number): string {
        t += 1;
        return String(t <= 9 ? "0" + t : t);
    }
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
    public static getTime(tz: string): string {
        const date = this.getLocalDateTime(tz);
        return `${date.getFullYear()}-${this.dfm(date.getMonth())}-${this.dfo(date.getDate())} ${this.dfo(date.getHours())}:${this.dfo(date.getMinutes())}:${this.dfo(date.getSeconds())}`;
    }
}
export class ConsoleColor {
    public static Cyan(str: string): string {
        return `\x1b[36m${str}\x1b[0m`;
    };
    public static Yellow(str: string): string {
        return `\x1b[33m${str}\x1b[0m`;
    };
    public static Reset: string = '\x1b[0m';
    public static Bright: string = '\x1b[1m';
    public static Dim: string = '\x1b[2m';
    public static Underscore: string = '\x1b[4m';
    public static Blink: string = '\x1b[5m';
    public static Reverse: string = '\x1b[7m';
    public static Hidden: string = '\x1b[8m';
    public static FgBlack: string = '\x1b[30m';
    public static FgRed: string = '\x1b[31m';
    public static FgGreen: string = '\x1b[32m';
    public static FgYellow: string = '\x1b[33m';
    public static FgBlue: string = '\x1b[34m';
    public static FgMagenta: string = '\x1b[35m';
    public static FgCyan: string = '\x1b[36m';
    public static FgWhite: string = '\x1b[37m';
    public static BgBlack: string = '\x1b[40m';
    public static BgRed: string = '\x1b[41m';
    public static BgGreen: string = '\x1b[42m';
    public static BgYellow: string = '\x1b[43m';
    public static BgBlue: string = '\x1b[44m';
    public static BgMagenta: string = '\x1b[45m';
    public static BgCyan: string = '\x1b[46m';
    public static BgWhite: string = '\x1b[47m';
}
function isString(a: any): a is string {
    return typeof (a) === "string";
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
    constructor(
        dir?: string, name?: string,
        tz?: string, userInteractive?: boolean,
        isDebug?: boolean, maxBlockSize?: number
    ) {
        this._buff = new BufferArray();
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
    public writeToStream(str: string): void {
        if (this._canWrite === false) return void 0;
        this._blockSize += this._buff.push(str);
        if (this._blockSize < this._maxBlockSize) return void 0;
        return this.flush(), void 0;
    }
    public newLine(): void {
        return this.writeToStream(`${'-'.repeat(100)}\r\n`);
    }
    private _write(buffer: any): void {
        const str: string = !isString(buffer) ? buffer.toString() : buffer;
        str.split("\r\n").forEach((line) => {
            if (line && line.trim().length > 0) {
                this.writeToStream(`${LogTime.getTime(this._tz)}\t${line.replace(/\t/gi, "")}\r\n`);
            }
        });
        return void 0;
    }
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
    public write(msg: any, color?: string): ILogger {
        return this._log(color, msg);
    }
    public log(msg: any, color?: string): ILogger {
        if (!this._isDebug) return this;
        return this._log(color, msg);
    }
    public info(msg: any): ILogger {
        if (!this._isDebug) return this;
        return this._log(ConsoleColor.Yellow, msg);
    }
    public success(msg: any): ILogger {
        if (!this._isDebug) return this;
        return this._log(ConsoleColor.FgGreen, msg);
    }
    public error(msg: any): ILogger {
        if (!this._isDebug) return this;
        return this._log(ConsoleColor.FgRed, msg);
    }
    public reset(): ILogger {
        if (!this._isDebug) return this;
        return console.log(ConsoleColor.Reset), this;
    }
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