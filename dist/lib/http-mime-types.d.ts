declare class MimeType {
    private _data;
    /**
     * Creates the registry and loads the MIME types from the bundled mime-types.json file.
     */
    constructor();
    /**
     * Registers a MIME type for an extension. Throws if the extension is already registered.
     *
     * @param extension Extension to register.
     * @param value MIME type string for the extension.
     */
    add(extension: string, value: string): void;
    /**
     * Returns the registered MIME type for an extension.
     *
     * @param extension Extension to look up (without a leading dot).
     * @returns The MIME type, or undefined when not registered.
     */
    type(extension: string): string;
    /**
     * Reads mime-types.json from the application directory and fills the registry. Throws if the file is
     * missing or the registry was already populated.
     */
    private _loadSync;
}
export declare const _mimeType: MimeType;
/**
 * Resolves the MIME type for a file extension or path, taking the part after the last dot or slash in
 * lower case. Throws when the extension is unsupported.
 *
 * @param extension Extension, file name or path to look up.
 * @returns The MIME type, with a charset for text-like types.
 */
export declare function getMimeType(extension: string): string;
/**
 * Registers a new MIME type for an extension. Throws if the extension already exists.
 *
 * @param extension Extension to register.
 * @param value MIME type string for the extension.
 */
export declare function setMimeType(extension: string, value: string): void;
/**
 * Checks whether a MIME type is registered for the given extension.
 *
 * @param extension Extension to check (without a leading dot).
 * @returns True if the extension is registered, otherwise false.
 */
export declare function isValidExtension(extension: string): boolean;
export {};
