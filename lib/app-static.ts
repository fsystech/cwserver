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

// 9:01 PM 5/2/2020
// by rajib chy

/**
 * Interface representing response information, including status codes and descriptions.
 */
export interface IResInfo {
    /**
     * The numerical response code.
     */
    code: number;

    /**
     * Indicates whether the response is valid.
     */
    isValid: boolean;

    /**
     * Indicates whether the response represents an error.
     */
    isErrorCode: boolean;

    /**
     * Indicates whether the response represents an internal error.
     */
    isInternalErrorCode: boolean;

    /**
     * A textual description of the response.
     */
    description: string;
}

/**
 * Type definition for an error handler function.
 * 
 * This function processes errors and calls the next function in the chain.
 */
export type ErrorHandler = (
    /**
     * The error object, if any.
     */
    err: NodeJS.ErrnoException | Error | null | undefined,

    /**
     * The callback function to continue execution.
     */
    next: () => void
) => void;

/**
 * Interface representing a disposable resource.
 */
export interface IDispose {
    /**
     * Releases resources associated with the implementing object.
     */
    dispose(): void;
}
/**
 * Interface representing a buffer array that supports adding, clearing,
 * and converting buffer data to a string format.
 */
export interface IBufferArray extends IDispose {
    /**
     * The concatenated buffer data.
     */
    readonly data: Buffer;

    /**
     * The total length of the buffer array.
     */
    readonly length: number;

    /**
     * Appends buffer data into the internal buffer collection.
     *
     * Supports Buffer, string, and array of Buffer values.
     * Updates the total byte length and returns the number of bytes added.
     *
     * @param {Buffer | Array<Buffer> | string} buff
     * Buffer data to append.
     *
     * @returns {number}
     * Total bytes added.
     */
    push(buff: Buffer | Array<Buffer> | string): number;

    /**
     * Clears the buffer array.
     */
    clear(): void;

    /**
     * Converts the buffer data to a string with optional encoding.
     * 
     * @param encoding The encoding to use (default is UTF-8).
     * @returns The string representation of the buffer data.
     */
    toString(encoding?: BufferEncoding): string;
}

/**
 * Class implementing a buffer array with dynamic buffer management.
 */
export class BufferArray implements IBufferArray {
    /**
     * Internal storage for buffer segments.
     */
    private _data: Buffer[];

    /**
     * Tracks the total length of the buffer array.
     */
    private _length: number;

    /**
     * Indicates whether the instance has been disposed.
     */
    private _isDisposed: boolean;

    /**
     * Retrieves the concatenated buffer data.
     * 
     * @throws Error if the instance has been disposed.
     */
    public get data(): Buffer {
        this.shouldNotDisposed();
        return Buffer.concat(this._data, this.length);
    }

    /**
     * Retrieves the total length of the buffer array.
     * 
     * @throws Error if the instance has been disposed.
     */
    public get length(): number {
        this.shouldNotDisposed();
        return this._length;
    }

    /**
     * Initializes a new instance of the `BufferArray` class.
     */
    constructor() {
        this._data = [];
        this._isDisposed = false;
        this._length = 0;
    }

    /**
     * Ensures that the instance is not disposed before accessing data.
     * 
     * @throws Error if the instance has been disposed.
     */
    private shouldNotDisposed(): void {
        if (this._isDisposed)
            throw new Error("This `BufferArray` instance already disposed.");
    }

    /**
     * Appends buffer data into the internal buffer collection.
     *
     * Supports Buffer, string, and array of Buffer values.
     * Updates the total byte length and returns the number of bytes added.
     *
     * @param {Buffer | Array<Buffer> | string} buff
     * Buffer data to append.
     *
     * @returns {number}
     * Total bytes added.
     */
    public push(buff: Buffer | Array<Buffer> | string): number {

        this.shouldNotDisposed();

        if (Array.isArray(buff)) {

            let length = 0;

            for (const item of buff) {

                if (!Buffer.isBuffer(item)) {
                    throw new TypeError("Array item must be Buffer.");
                }

                length += item.length;
                this._data.push(item);
            }

            this._length += length;

            return length;
        }

        if (Buffer.isBuffer(buff)) {
            this._length += buff.length;
            this._data.push(buff);
            return buff.length;
        }

        const nBuff: Buffer = Buffer.from(buff);
        this._length += nBuff.length;
        this._data.push(nBuff);

        return nBuff.length;
    }

    /**
     * Clears the buffer array by resetting stored data.
     * 
     * @throws Error if the instance has been disposed.
     */
    public clear(): void {
        this.shouldNotDisposed();
        this._data.length = 0;
        this._length = 0;
    }

    /**
     * Converts the buffer data to a string with optional encoding.
     * 
     * @param encoding The encoding to use (default is UTF-8).
     * @returns The string representation of the buffer data.
     */
    public toString(encoding?: BufferEncoding): string {
        return this.data.toString(encoding);
    }

    /**
     * Disposes of the buffer array, releasing stored data.
     */
    public dispose(): void {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._data.length = 0;
            // @ts-ignore
            delete this._data;
            delete this._length;
        }
        return void 0;
    }
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
export function toString(val: any): string {
    if (!val) return "";
    return typeof (val) === "string" ? val : String(val);
}
export function toNumber(obj: any): number {
    if (!obj) return 0;
    if (typeof (obj) === "number") return obj;
    if (isNaN(obj)) return 0;
    return parseFloat(obj);
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
const dfo = (t: number): string => {
    t = t === 0 ? 1 : t;
    return _map.day[t];
};

const dfon = (t: number): any => {
    t = t === 0 ? 1 : t;
    return t <= 9 ? "0" + t : t;
};

const dfm = (t: number): string => {
    t += 1;
    return _map.month[t];
};

export function toResponseTime(timestamp?: number | Date): string {
    // Thu, 01 May 2020 23:34:07 GMT
    let date: Date;
    if (timestamp) {
        if (typeof (timestamp) === "number") {
            date = new Date(timestamp);
        } else {
            date = timestamp;
        }
    } else {
        date = new Date();
    }
    return `${dfo(date.getDay())}, ${dfon(date.getDate())} ${dfm(date.getMonth())} ${date.getFullYear()} ${dfon(date.getHours())}:${dfon(date.getMinutes())}:${dfon(date.getSeconds())} GMT`;
}