type HeaderType = Record<string, number | string | readonly string[]>;
declare class DefaultHttpHeaders {
    private _headers;
    /**
     * Adds or overwrites a default header sent with responses.
     *
     * @param key Header name.
     * @param value Header value.
     */
    addHeader(key: string, value: string | number): void;
    /**
     * Removes a default header if it is set.
     *
     * @param key Header name to remove.
     */
    deleteHeader(key: string): void;
    /**
     * Returns the current default headers.
     *
     * @returns Read-only map of header names to values.
     */
    getHeaders(): Readonly<HeaderType>;
}
declare const _default: DefaultHttpHeaders;
export default _default;
