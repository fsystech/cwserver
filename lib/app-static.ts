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
        if (this._isDisposed)
            return;

        this._isDisposed = true;

        this._data = null;
        this._length = null;
    }
}

export class ResInfo implements IResInfo {
    public code: number = 0;
    public isValid: boolean = false;
    public isErrorCode: boolean = false;
    public isInternalErrorCode: boolean = false;
    public description: string = "ok";
}

export function toString(val: any): string {
    if (!val) return "";
    return typeof (val) === "string" ? val : String(val);
}

export function toNumber(v: any): number {
    const type = typeof (v);

    if (type === "number")
        return v;

    if (type === 'string') {
        v = v.replace(/,|\$/g, "");
    }
    // allow fraction digits
    if (/^[\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)?$/.test(v) === false)
        return 0;

    return parseFloat(v);
}

const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "July", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

const DAYS = [
    "Mon", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
] as const;

const pad2 = (n: number): string =>
    n < 10 ? `0${n}` : `${n}`;

export function toResponseTime(timestamp?: number | Date): string {
    const date = timestamp == null
        ? new Date()
        : timestamp instanceof Date
            ? timestamp
            : new Date(timestamp);

    const day = date.getDay();
    const month = date.getMonth();

    return `${DAYS[day === 0 ? 1 : day]}, ${pad2(date.getDate())} ${MONTHS[month]} ${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())} GMT`;
}