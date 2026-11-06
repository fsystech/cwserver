import type { IResInfo } from './app-static';
export type Dict<T> = {
    [K in string | number]: T | undefined;
};
export declare class HttpStatus {
    /**
     * Exposes the table of HTTP status codes and their descriptions.
     *
     * @returns Map from status code number to description text.
     */
    static get statusCode(): {
        [id: number]: string;
    };
    /**
     * Returns the description text for an HTTP status code. Throws if the code is unknown.
     *
     * @param statusCode HTTP status code.
     * @returns The description of the status code.
     */
    static getDescription(statusCode: number): string;
    /**
     * Extracts a status code from a file name in a path, for example error page names like 404.html. Falls
     * back to the given code when none can be derived.
     *
     * @param path File path whose base name (without extension) may be a status code.
     * @param statusCode Fallback status code returned when the path has no numeric name.
     * @returns The status code parsed from the file name, or the fallback.
     */
    static fromPath(path: string | any, statusCode: any): number;
    /**
     * Checks whether the code is a known HTTP status code.
     *
     * @param statusCode HTTP status code to check.
     * @returns True if the code is known, otherwise false.
     */
    static isValidCode(statusCode: number): boolean;
    /**
     * Builds a response info object for a status code taken from a number or a file path, flagging whether
     * it is valid, an error code, or a 500 error, and adding a description for error codes.
     *
     * @param path Status code number, or a file path from which the code is derived.
     * @param code Fallback status code used when the path yields none.
     * @returns Response info with code, validity, error flags and description.
     */
    static getResInfo(path: string | number, code: any): IResInfo;
    /**
     * Checks whether a file name is a numeric valid HTTP error status code such as 404.
     *
     * @param name File name (without extension) to test.
     * @returns True if the name is a valid 4xx or 5xx status code, otherwise false.
     */
    static isErrorFileName(name: string): boolean;
    /**
     * Checks whether a status code belongs to an error class (client or server error). Throws if the
     * code's class is not recognised.
     *
     * @param code HTTP status code to test.
     * @returns True for error codes, otherwise false.
     */
    static isErrorCode(code: any): boolean;
}
