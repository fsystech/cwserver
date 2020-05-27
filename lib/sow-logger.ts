/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:26 PM 9/28/2019
import * as _fs from 'fs';
import * as _path from 'path';
export interface ILogger {
    newLine(): any;
    write( msg: string, color?: string ): ILogger;
    log( msg: string, color?: string ): ILogger;
    info( msg: string ): ILogger;
    success( msg: string ): ILogger;
    error( msg: string ): ILogger;
    reset(): ILogger;
    dispose(): any;
}
// tslint:disable-next-line: one-variable-per-declaration
const dfo = ( t: any ) => {
    t = t === 0 ? 1 : t;
    return t <= 9 ? "0" + t : t;
}, dfm = ( t: any ) => {
    t += 1;
    return t <= 9 ? "0" + t : t;
}, getLocalDateTime = ( offset: any ) => {
    // create Date object for current location
    const d = new Date();
    // convert to msec
    // subtract local time zone offset
    // get UTC time in msec
    const utc = d.getTime() + ( d.getTimezoneOffset() * 60000 );
    // create new Date object for different city
    // using supplied offset
    const nd = new Date( utc + ( 3600000 * offset ) );
    // return time as a string
    return nd;
}, getTime = ( tz: string ) => {
    const date = getLocalDateTime( tz );
    return `${date.getFullYear()}-${dfm( date.getMonth() )}-${dfo( date.getDate() )} ${dfo( date.getHours() )}:${dfo( date.getMinutes() )}:${dfo( date.getSeconds() )}`;
};
export class ConsoleColor {
    public static Cyan: string = '\x1b[36m%s\x1b[0m';
    public static Yellow: string = '\x1b[33m%s\x1b[0m';
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
// tslint:disable-next-line: max-classes-per-file
export class Logger implements ILogger {
    private _userInteractive: boolean;
    private _isDebug: boolean;
    private _canWrite: boolean;
    private _tz: string;
    private _stream?: _fs.WriteStream;
    private _isWaiting: boolean;
    private _buffer?: string;
    constructor( dir?: string, name?: string, tz?: string, userInteractive?: boolean, isDebug?: boolean ) {
        this._userInteractive = typeof ( userInteractive ) !== "boolean" ? true : userInteractive;
        this._isDebug = typeof ( isDebug ) !== "boolean" ? true : isDebug === true ? userInteractive === true : isDebug;
        this._canWrite = false;
        this._stream = void 0; this._tz = "+6";
        this._isWaiting = false;
        if ( !dir ) return;
        dir = _path.resolve( dir );
        if ( !tz ) tz = '+6';
        this._tz = tz;
        if ( _fs.existsSync( dir ) ) {
            const date = getLocalDateTime( this._tz );
            name = `${name || String( Math.random().toString( 36 ).slice( 2 ) + Date.now() )}_${date.getFullYear()}_${dfm( date.getMonth() )}_${dfo( date.getDate() )}.log`;
            const path = _path.resolve( `${dir}/${name}` );
            const exists = _fs.existsSync( path );
            // const fd = _fs.openSync( path, 'a' );
            // _fs.appendFileSync( fd, `\n`);
            this._stream = _fs.createWriteStream( path, exists ? { flags: 'a', encoding: 'utf-8' } : { flags: 'w', encoding: 'utf-8' } );
            this._canWrite = true;
            if ( exists === false ) {
                this._stream.write( `Log Genarte On ${getTime( this._tz )}\r\n-------------------------------------------------------------------\r\n` );
            } else {
                this.newLine();
            }
        }
    }
    private _writeToStream( str: string ): void {
        if ( this._canWrite === false ) return void 0;
        if ( !this._stream ) return void 0;
        if ( this._isWaiting ) {
            if ( !this._buffer ) {
                return this._buffer = str, void 0;
            }
            return this._buffer += str, void 0;
        }
        if ( this._stream.write( str ) ) return void 0;
        this._isWaiting = true;
        return this._stream.once( "drain", () => {
            if ( this._buffer && this._stream ) {
                this._stream.write( this._buffer );
                delete this._buffer;
            }
            this._isWaiting = false;
            return;
        } ), void 0;

    }
    public newLine(): void {
        return this._writeToStream( '-------------------------------------------------------------------\r\n' );
    }
    private _write( buffer: any ): void {
        return this._writeToStream( `${getTime( this._tz )}\t${buffer.replace( /\t/gi, "" )}\r\n` );
    }
    private _log( color?: string, msg?: any ): ILogger {
        if ( !this._isDebug && !this._userInteractive ) return this._write( msg ), this;
        return !this._userInteractive ? console.log( msg ) : console.log( color || ConsoleColor.Yellow, msg ), this._write( msg ), this;
    }
    public write( msg: any, color?: string ): ILogger {
        return this._log( color || ConsoleColor.Yellow, msg );
    }
    public log( msg: any, color?: string ): ILogger {
        if ( !this._isDebug ) return this;
        return this._log( color || ConsoleColor.Yellow, msg );
    }
    public info( msg: any ): ILogger {
        if ( !this._isDebug ) return this;
        return this._log( ConsoleColor.Yellow, msg );
    }
    public success( msg: any ): ILogger {
        if ( !this._isDebug ) return this;
        return this._log( ConsoleColor.FgGreen, msg );
    }
    public error( msg: any ): ILogger {
        if ( !this._isDebug ) return this;
        return this._log( ConsoleColor.FgRed, msg );
    }
    public reset(): ILogger {
        if ( !this._isDebug ) return this;
        return console.log( ConsoleColor.Reset ), this;
    }
    public dispose() {
        if ( this._canWrite === false ) return;
        if ( this._stream !== undefined ) {
            this._stream.end(); delete this._stream;
        }
        this._canWrite = false;
    }
}