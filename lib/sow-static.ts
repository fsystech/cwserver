/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 9:01 PM 5/2/2020
export interface ISession {
    isAuthenticated: boolean;
    loginId: string;
    roleId: string;
    userData?: void
}
export interface IResInfo {
    code: number;
    isValid: boolean;
    isErrorCode: boolean;
    isInternalErrorCode: boolean;
    description: string;
}
export type ErrorHandler = (
    err: NodeJS.ErrnoException | Error | null | undefined,
    next: () => void
) => void;
export interface IDispose {
    dispose(): void;
}
export interface IBufferArray extends IDispose {
    readonly data: Buffer;
    readonly length: number;
    push( buff: Buffer | string ): number;
    clear(): void;
    toString( encoding?: BufferEncoding ): string;
}
export class BufferArray implements IBufferArray {
    private _data: Buffer[];
    private _length: number;
    private _isDisposed: boolean;
    public get data(): Buffer {
        this.isDisposed();
        return Buffer.concat( this._data, this.length );
    }
    public get length(): number {
        this.isDisposed();
        return this._length;
    }
    constructor() {
        this._data = []; this._isDisposed = false;
        this._length = 0;
    }
    private isDisposed(): void {
        if ( this._isDisposed )
            throw new Error( "This `BufferArray` instance already disposed." );
    }
    public push( buff: Buffer | string ): number {
        this.isDisposed();
        if ( Buffer.isBuffer( buff ) ) {
            this._length += buff.length;
            this._data.push( buff );
            return buff.length;
        }
        const nBuff: Buffer = Buffer.from( buff );
        this._length += nBuff.length;
        this._data.push( nBuff );
        return nBuff.length;
    }
    public clear(): void {
        this.isDisposed();
        this._data.length = 0;
        this._length = 0;
    }
    public toString( encoding?: BufferEncoding ): string {
        return this.data.toString( encoding );
    }
    public dispose(): void {
        if ( !this._isDisposed ) {
            this._isDisposed = true;
            this._data.length = 0;
            delete this._data;
            delete this._length;
        }
        return void 0;
    }
}
export class Session implements ISession {
    isAuthenticated: boolean;
    loginId: string;
    roleId: string;
    userData?: void;
    constructor() {
        this.isAuthenticated = false;
        this.loginId = "";
        this.roleId = "";
        this.userData = void 0;
    };
}
export class ResInfo implements IResInfo {
    code: number;
    isValid: boolean;
    isErrorCode: boolean;
    isInternalErrorCode: boolean;
    description: string;
    constructor() {
        this.code = 0; this.isValid = false;
        this.isErrorCode = false;
        this.isInternalErrorCode = false;
        this.description = "Ok";
    };
}
export function toString( val: any ): string {
    if ( !val ) return "";
    return typeof ( val ) === "string" ? val : String( val );
}
export function ToNumber( obj: any ): number {
    if ( !obj ) return 0;
    if ( typeof ( obj ) === "number" ) return obj;
    if ( isNaN( obj ) ) return 0;
    return parseFloat( obj );
}
const _map: {
    month: { [key: number]: string },
    day: { [key: number]: string }
} = {
    month: {
        1: 'Jan',
        2: 'Feb',
        3: 'Mar',
        4: 'Apr',
        5: 'May',
        6: 'Jun',
        7: 'July',
        8: 'Aug',
        9: 'Sep',
        10: 'Oct',
        11: 'Nov',
        12: 'Dec'
    },
    day: {
        0: "Sun",
        1: "Mon",
        2: "Tue",
        3: "Wed",
        4: "Thu",
        5: "Fri",
        6: "Sat"
    }
};
const dfo = ( t: number ): string => {
    t = t === 0 ? 1 : t;
    return _map.day[t];
};
const dfon = ( t: number ): any => {
    t = t === 0 ? 1 : t;
    return t <= 9 ? "0" + t : t;
};
const dfm = ( t: number ): string => {
    t += 1;
    return _map.month[t];
};
export function ToResponseTime( timestamp?: number | Date ): string {
    // Thu, 01 May 2020 23:34:07 GMT
    let date: Date;
    if ( timestamp ) {
        if ( typeof ( timestamp ) === "number" ) {
            date = new Date( timestamp );
        } else {
            date = timestamp;
        }
    } else {
        date = new Date();
    }
    return `${dfo( date.getDay() )}, ${dfon( date.getDate() )} ${dfm( date.getMonth() )} ${date.getFullYear()} ${dfon( date.getHours() )}:${dfon( date.getMinutes() )}:${dfon( date.getSeconds() )} GMT`;
}