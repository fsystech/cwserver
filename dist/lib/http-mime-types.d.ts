declare class MimeType {
    private _data;
    constructor();
    add(extension: string, value: string): void;
    type(extension: string): string;
    private _loadSync;
}
export declare const _mimeType: MimeType;
export declare function getMimeType(extension: string): string;
export declare function stMimeType(extension: string, value: string): void;
export declare function isValidExtension(extension: string): boolean;
export {};
