export interface IMimeType<T> {
    readonly type: (extension: string) => T | undefined;
    readonly add: (extension: string, val: T) => void;
}
export declare function loadMimeType<T>(): IMimeType<T>;
export declare function getMimeType(extension: string): string;
export declare function isValidExtension(extension: string): boolean;
