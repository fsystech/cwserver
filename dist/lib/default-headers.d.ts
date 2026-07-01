type HeaderType = Record<string, number | string | readonly string[]>;
declare class DefaultHttpHeaders {
    private _headers;
    addHeader(key: string, value: string | number): void;
    deleteHeader(key: string): void;
    getHeaders(): Readonly<HeaderType>;
}
declare const _default: DefaultHttpHeaders;
export default _default;
