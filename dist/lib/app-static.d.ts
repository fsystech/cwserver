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
     * Adds a buffer or string to the buffer array.
     *
     * @param buff The buffer or string to add.
     * @returns The length of the added buffer.
     */
    push(buff: Buffer | string): number;
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
     * Adds a buffer or string to the buffer array.
     *
     * @param buff The buffer or string to add.
     * @returns The length of the added buffer.
     *
     * @throws Error if the instance has been disposed.
     */
    push(buff: Buffer | string): number;
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
/**
 * Interface representing a user session.
 *
 * This interface defines the structure and required methods for managing user session data.
 */
export interface ISession {
    /**
     * Indicates whether the user is authenticated.
     */
    isAuthenticated: boolean;
    /**
     * Unique identifier for the logged-in user.
     */
    readonly loginId: string;
    /**
     * Role identifier assigned to the user.
     */
    readonly roleId: string;
    /**
     * Additional user-specific data.
     */
    readonly userData?: any;
    /**
     * IP segment or part of the user's IP address.
     */
    readonly ipPart?: string;
    /**
     * Converts the session object to a JSON string.
     *
     * @returns A JSON string representing the session data.
     */
    toJson(): string;
    /**
     * Clears the session data.
     */
    clear(): void;
    /**
     * A dictionary for storing arbitrary session-related data.
     */
    readonly data: NodeJS.Dict<any>;
}
/**
 * Class representing a user session.
 *
 * Implements the ISession interface to manage session states, user authentication,
 * roles, and additional metadata associated with a session.
 */
export declare class Session implements ISession {
    /**
     * Retrieves the login identifier of the user.
     */
    get loginId(): string;
    /**
     * Checks whether the user is authenticated.
     */
    get isAuthenticated(): boolean;
    /**
     * Updates the authentication status of the user.
     */
    set isAuthenticated(value: boolean);
    /**
     * Retrieves additional user data.
     */
    get userData(): NodeJS.Dict<any>;
    /**
     * Retrieves the user's IP segment.
     */
    get ipPart(): string;
    /**
     * Retrieves the primary role identifier assigned to the user.
     */
    get roleId(): string;
    /**
     * Retrieves the session data as a dictionary.
     */
    get data(): {
        [key: string]: any;
        roleIds: Array<string>;
        loginId: string;
        roleId: string;
        isAuthenticated: boolean;
        userData: NodeJS.Dict<any>;
        ipPart: string;
    };
    /**
     * Internal storage object for session data.
     */
    private _obj;
    /**
     * Constructs a new Session instance with default values.
     */
    constructor();
    /**
     * Converts the session data to a JSON string.
     *
     * @returns A JSON string representing the session.
     */
    toJson(): string;
    /**
     * Checks if the user has a specific role.
     *
     * @param roleId The role identifier to check.
     * @returns True if the user has the specified role; otherwise, false.
     */
    isInRole(roleId: string): boolean;
    /**
     * Parses a JSON string and updates the session data accordingly.
     *
     * @param jsonStr A JSON string representing session data.
     * @returns The updated session instance.
     */
    parse(jsonStr: string): ISession;
    /**
     * Retrieves a value from the session data.
     *
     * @param key The key of the data to retrieve.
     * @param prop An optional property to access within the stored data.
     * @returns The value associated with the key, or undefined if not found.
     */
    getData(key: string, prop?: string): any;
    /**
     * Updates a value in the session data.
     *
     * @param key The key of the data to update.
     * @param obj The new object data to store under the specified key.
     */
    updateData(key: string, obj: NodeJS.Dict<any>): void;
    /**
     * Clears the session data, effectively resetting the session.
     */
    clear(): void;
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
export declare function ToNumber(obj: any): number;
export declare function ToResponseTime(timestamp?: number | Date): string;
