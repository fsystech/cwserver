export interface IMimeType<T> {
    readonly type: (extension: string) => T | undefined;
}
export declare function loadMimeType<T>(): IMimeType<T>;
export declare function getMimeType(extension: string): string;
export declare function isValidExtension(extension: string): boolean;
