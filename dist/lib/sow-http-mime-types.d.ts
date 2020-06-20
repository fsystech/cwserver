export declare function loadMimeType(): {
    readonly type: (extension: string) => string | undefined;
};
export declare function getMimeType(extension: string): string;
export declare function isValidExtension(extension: string): boolean;
