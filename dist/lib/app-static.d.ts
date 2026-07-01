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
next: () => void) => void;
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
export declare class BufferArray implements IBufferArray {
    /**
     * Internal storage for buffer segments.
     */
    private _data;
    /**
     * Tracks the total length of the buffer array.
     */
    private _length;
    /**
     * Indicates whether the instance has been disposed.
     */
    private _isDisposed;
    /**
     * Retrieves the concatenated buffer data.
     *
     * @throws Error if the instance has been disposed.
     */
    get data(): Buffer;
    /**
     * Retrieves the total length of the buffer array.
     *
     * @throws Error if the instance has been disposed.
     */
    get length(): number;
    /**
     * Initializes a new instance of the `BufferArray` class.
     */
    constructor();
    /**
     * Ensures that the instance is not disposed before accessing data.
     *
     * @throws Error if the instance has been disposed.
     */
    private shouldNotDisposed;
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
     * Clears the buffer array by resetting stored data.
     *
     * @throws Error if the instance has been disposed.
     */
    clear(): void;
    /**
     * Converts the buffer data to a string with optional encoding.
     *
     * @param encoding The encoding to use (default is UTF-8).
     * @returns The string representation of the buffer data.
     */
    toString(encoding?: BufferEncoding): string;
    /**
     * Disposes of the buffer array, releasing stored data.
     */
    dispose(): void;
}
export declare class ResInfo implements IResInfo {
    code: number;
    isValid: boolean;
    isErrorCode: boolean;
    isInternalErrorCode: boolean;
    description: string;
    constructor();
}
export declare function toString(val: any): string;
export declare function toNumber(obj: any): number;
export declare function toResponseTime(timestamp?: number | Date): string;
