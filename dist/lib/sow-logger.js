"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:26 PM 9/28/2019
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
// tslint:disable-next-line: one-variable-per-declaration
const dfo = (t) => {
    t = t === 0 ? 1 : t;
    return t <= 9 ? "0" + t : t;
}, dfm = (t) => {
    t += 1;
    return t <= 9 ? "0" + t : t;
}, getLocalDateTime = (offset) => {
    // create Date object for current location
    const d = new Date();
    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    // create new Date object for different city
    // using supplied offset
    const nd = new Date(utc + (3600000 * offset));
    // return time as a string
    return nd;
}, getTime = (tz) => {
    const date = getLocalDateTime(tz);
    return `${date.getFullYear()}-${dfm(date.getMonth())}-${dfo(date.getDate())} ${dfo(date.getHours())}:${dfo(date.getMinutes())}:${dfo(date.getSeconds())}`;
};
class ConsoleColor {
}
exports.ConsoleColor = ConsoleColor;
ConsoleColor.Cyan = '\x1b[36m%s\x1b[0m';
ConsoleColor.Yellow = '\x1b[33m%s\x1b[0m';
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
// tslint:disable-next-line: max-classes-per-file
class Logger {
    constructor(dir, name, tz, userInteractive, isDebug) {
        this._userInteractive = typeof (userInteractive) !== "boolean" ? true : userInteractive;
        this._isDebug = typeof (isDebug) !== "boolean" ? true : isDebug === true ? userInteractive === true : isDebug;
        this._canWrite = false;
        this._stream = void 0;
        this._tz = "+6";
        this._isWaiting = false;
        if (!dir)
            return;
        dir = _path.resolve(dir);
        if (!tz)
            tz = '+6';
        this._tz = tz;
        if (_fs.existsSync(dir)) {
            const date = getLocalDateTime(this._tz);
            name = `${name || String(Math.random().toString(36).slice(2) + Date.now())}_${date.getFullYear()}_${dfm(date.getMonth())}_${dfo(date.getDate())}.log`;
            const path = _path.resolve(`${dir}/${name}`);
            const exists = _fs.existsSync(path);
            this._stream = _fs.createWriteStream(path, exists ? { flags: 'a', encoding: 'utf-8' } : { flags: 'w', encoding: 'utf-8' });
            this._canWrite = true;
            if (exists === false) {
                this._stream.write(`Log Genarte On ${getTime(this._tz)}\r\n-------------------------------------------------------------------\r\n`);
            }
            else {
                this.newLine();
            }
        }
    }
    _writeToStream(str) {
        if (this._canWrite === false)
            return void 0;
        if (!this._stream)
            return void 0;
        if (this._isWaiting) {
            if (!this._buffer) {
                return this._buffer = str, void 0;
            }
            return this._buffer += str, void 0;
        }
        if (this._stream.write(str))
            return void 0;
        this._isWaiting = true;
        return this._stream.once("drain", () => {
            if (this._buffer && this._stream) {
                this._stream.write(this._buffer);
                delete this._buffer;
            }
            this._isWaiting = false;
            return;
        }), void 0;
    }
    newLine() {
        return this._writeToStream('-------------------------------------------------------------------\r\n');
    }
    _write(buffer) {
        return this._writeToStream(`${getTime(this._tz)}\t${buffer.replace(/\t/gi, "")}\r\n`);
    }
    _log(color, msg) {
        if (!this._isDebug && !this._userInteractive)
            return this._write(msg), this;
        return !this._userInteractive ? console.log(msg) : console.log(color || ConsoleColor.Yellow, msg), this._write(msg), this;
    }
    write(msg, color) {
        return this._log(color || ConsoleColor.Yellow, msg);
    }
    log(msg, color) {
        if (!this._isDebug)
            return this;
        return this._log(color || ConsoleColor.Yellow, msg);
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
        if (this._canWrite === false)
            return;
        if (this._stream !== undefined) {
            this._stream.end();
            delete this._stream;
        }
        this._canWrite = false;
    }
}
exports.Logger = Logger;
