"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.ShadowLogger = exports.ConsoleColor = exports.LogTime = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:26 PM 9/28/2019
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const sow_static_1 = require("./sow-static");
const fsw = __importStar(require("./sow-fsw"));
class LogTime {
    static dfo(t) {
        t = t === 0 ? 1 : t;
        return String(t <= 9 ? "0" + t : t);
    }
    static dfm(t) {
        t += 1;
        return String(t <= 9 ? "0" + t : t);
    }
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
    static getTime(tz) {
        const date = this.getLocalDateTime(tz);
        return `${date.getFullYear()}-${this.dfm(date.getMonth())}-${this.dfo(date.getDate())} ${this.dfo(date.getHours())}:${this.dfo(date.getMinutes())}:${this.dfo(date.getSeconds())}`;
    }
}
exports.LogTime = LogTime;
class ConsoleColor {
    static Cyan(str) {
        return `\x1b[36m${str}\x1b[0m`;
    }
    ;
    static Yellow(str) {
        return `\x1b[33m${str}\x1b[0m`;
    }
    ;
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
function isString(a) {
    return typeof (a) === "string";
}
class ShadowLogger {
    constructor() {
        this._isProduction = true;
    }
    get isProduction() {
        return this._isProduction;
    }
    writeBuffer(msg) {
        return;
    }
    newLine() {
        return;
    }
    write(msg, color) {
        return this;
    }
    log(msg, color) {
        return this;
    }
    info(msg) {
        return this;
    }
    success(msg) {
        return this;
    }
    error(msg) {
        return this;
    }
    reset() {
        return this;
    }
    writeToStream(str) {
        return;
    }
    flush() {
        return true;
    }
    dispose() {
        return;
    }
}
exports.ShadowLogger = ShadowLogger;
class Logger {
    constructor(dir, name, tz, userInteractive, isDebug, maxBlockSize) {
        this._blockSize = 0;
        this._maxBlockSize = 10485760; /* (Max block size (1024*1024)*10) = 10 MB */
        this._fd = -1;
        this._buff = new sow_static_1.BufferArray();
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
    get isProduction() {
        return this._isProduction;
    }
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
    writeToStream(str) {
        if (this._canWrite === false)
            return void 0;
        this._blockSize += this._buff.push(str);
        if (this._blockSize < this._maxBlockSize)
            return void 0;
        return this.flush(), void 0;
    }
    newLine() {
        return this.writeToStream(`${'-'.repeat(100)}\r\n`);
    }
    _write(buffer) {
        const str = !isString(buffer) ? buffer.toString() : buffer;
        str.split("\r\n").forEach((line) => {
            if (line && line.trim().length > 0) {
                this.writeToStream(`${LogTime.getTime(this._tz)}\t${line.replace(/\t/gi, "")}\r\n`);
            }
        });
        return void 0;
    }
    writeBuffer(buffer) {
        return this._write(Buffer.from(buffer));
    }
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
    write(msg, color) {
        return this._log(color, msg);
    }
    log(msg, color) {
        if (!this._isDebug)
            return this;
        return this._log(color, msg);
    }
    info(msg) {
        if (!this._isDebug)
            return this;
        return this._log(ConsoleColor.Yellow, msg);
    }
    success(msg) {
        if (!this._isDebug)
            return this;
        return this._log(ConsoleColor.FgGreen, msg);
    }
    error(msg) {
        if (!this._isDebug)
            return this;
        return this._log(ConsoleColor.FgRed, msg);
    }
    reset() {
        if (!this._isDebug)
            return this;
        return console.log(ConsoleColor.Reset), this;
    }
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
//# sourceMappingURL=sow-logger.js.map