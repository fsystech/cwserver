import { IResInfo } from "./app-static";
import { type IRequestParam } from './app-router';
import { NextFunction, type IApplication } from './server-core';
import type { IRequest } from "./request";
import type { IResponse } from "./response";
import type { ICwDatabaseType } from './db-type';
import { type IController } from './app-controller';
import { type ICryptoInfo } from "./encryption";
import { ILogger } from "./logger";
import { IncomingHttpHeaders } from "node:http";
import { type IContext } from "./context";
import { type ISession } from "./session";
export type AppHandler = (ctx: IContext, requestParam?: IRequestParam) => Promise<void>;
export interface IServerEncryption {
    encrypt(plainText: string): string;
    decrypt(encryptedText: string): string;
    encryptToHex(plainText: string): string;
    decryptFromHex(encryptedText: string): string;
    encryptUri(plainText: string): string;
    decryptUri(encryptedText: string): string;
}
export interface IDatabaseConfig {
    module: string;
    path: string;
    dbConn: {
        database: string;
        password: string;
        host?: string;
        port?: number;
        user?: string;
    };
}
export interface IServerConfig {
    [key: string]: any;
    Author: string;
    appName: string;
    version: string;
    packageVersion: string;
    isDebug: boolean;
    template: {
        cache: boolean;
        cacheType: string;
        ext: string[];
    };
    encryptionKey: ICryptoInfo;
    session: {
        cookie: string;
        key: ICryptoInfo;
        maxAge: number;
        isSecure: boolean;
    };
    mimeType: string[];
    defaultDoc: string[];
    defaultExt: string;
    views: string[];
    errorPage: Record<string, string>;
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: Record<string, string>;
        port: string | number;
    };
    database?: IDatabaseConfig[];
    staticFile: {
        compression: boolean;
        minCompressionSize: number;
        fileCache: false;
        tempPath: string;
    };
    cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    };
    liveStream: string[];
    noCache: string[];
    socketPath?: string;
    bundler: {
        enable: boolean;
        fileCache: boolean;
        route: string;
        compress: boolean;
        tempPath: string;
        reValidate?: boolean;
    };
    /** If `useFullOptimization` true we will set highest priority to memory */
    useFullOptimization: boolean;
}
/**
 * Interface representing a web server.
 */
export interface ICwServer {
    /** The version of the server. */
    readonly version: string;
    /** Mapping of error pages based on status codes. */
    readonly errorPage: {
        [x: string]: string;
    };
    /** Logger instance for logging server activities. */
    readonly log: ILogger;
    /** Configuration settings of the server. */
    readonly config: IServerConfig;
    /** Encryption utilities used by the server. */
    readonly encryption: IServerEncryption;
    /** Database connections managed by the server. */
    readonly db: Record<string, ICwDatabaseType>;
    /** The port number on which the server runs. */
    readonly port: string | number;
    /**
     * Returns the copyright information.
     * @returns {string} The copyright text.
     */
    copyright(): string;
    /** Initializes the server logger. */
    createLogger(): void;
    /**
     * Updates the current server-side encryption settings.
     *
     * If an existing encryption instance is present, it is removed first.
     * When a new `serverEnc` object is provided, it will be assigned as the active encryption.
     * Otherwise, a new {@link ServerEncryption} instance is created using the configured encryption key.
     *
     * @public
     * @param {IServerEncryption} [serverEnc] - Optional custom encryption instance to apply.
     * @returns {void}
     */
    updateEncryption(serverEnc?: IServerEncryption): void;
    /**
     * Validates if the provided context is valid.
     * @param {IContext} ctx - The context to validate.
     * @returns {boolean} `true` if valid, otherwise `false`.
     */
    isValidContext(ctx: IContext): boolean;
    /**
     * Creates a new context for a request.
     * @param {IRequest} req - The incoming request object.
     * @param {IResponse} res - The response object.
     * @param {NextFunction} next - The next middleware function.
     * @returns {IContext} The created request context.
     */
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
    /** Initializes the server and its dependencies. */
    initilize(): void;
    /**
     * Gets the application configuration name.
     * @returns {string} The name of the application configuration.
     */
    getAppConfigName(): string;
    /**
     * Applies the provided configuration settings.
     * @param {Record<string, any>} config - Configuration object.
     */
    implimentConfig(config: Record<string, any>): void;
    /**
     * Sets default security-related HTTP headers.
     * @param {IResponse} res - The response object.
     */
    setDefaultProtectionHeader(res: IResponse): void;
    /**
     * Parses session data from request headers and cookies.
     * @param {IncomingHttpHeaders} headers - Request headers.
     * @param {undefined | string[] | string | { [x: string]: any }} cook - Cookies from the request.
     * @returns {ISession} The parsed session object.
     */
    parseSession(headers: IncomingHttpHeaders, cook: undefined | string[] | string | {
        [x: string]: any;
    }): ISession;
    /**
     * Called when the current session is cleared or invalidated.
     *
     * Allows implementations to perform cleanup operations such as removing
     * cached session state, resetting authentication context, or notifying
     * dependent services.
     *
     * @param {IContext} ctx
     * Request context associated with the cleared session.
     *
     * @returns {void}
     */
    onClearSession(ctx: IContext): void;
    /**
     * Sets a session for a user.
     * @param {IContext} ctx - The request context.
     * @param {string} loginId - The login ID of the user.
     * @param {string} roleId - The role ID of the user.
     * @param {any} userData - Additional user data.
     * @returns {boolean} `true` if session was set successfully.
     */
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean;
    /**
     * Determines whether the request should propagate an error.
     * @param {IContext} ctx - The request context.
     * @returns {boolean} `true` if the error should be passed.
     */
    passError(ctx: IContext): boolean;
    /**
     * Retrieves the error page path for a given status code.
     * @param {number} statusCode - The HTTP status code.
     * @param {boolean} [tryServer] - Whether to try the server's default error page.
     * @returns {string | void} The path of the error page.
     */
    getErrorPath(statusCode: number, tryServer?: boolean): string | void;
    /**
     * Transfers a request to another path or resource.
     * @param {IContext} ctx - The request context.
     * @param {string | number} path - The target path.
     * @param {IResInfo} [status] - The response status information.
     */
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void;
    /**
     * Maps a virtual or relative path to an absolute system path.
     * @param {string} path - The relative path.
     * @returns {string} The mapped absolute path.
     */
    mapPath(path: string): string;
    /**
     * Converts a file system path to a URL path.
     * @param {string} path - The system file path.
     * @returns {string} The corresponding URL path.
     */
    pathToUrl(path: string): string;
    /**
     * Adds an error message to the request context.
     * @param {IContext} ctx - The request context.
     * @param {Error | string} ex - The error object or message.
     * @returns {IContext} The modified request context.
     */
    addError(ctx: IContext, ex: Error | string): IContext;
    /**
     * Escapes a string to prevent XSS vulnerabilities.
     * @param {string | null} [unsafe] - The unsafe input string.
     * @returns {string} The escaped string.
     */
    escape(unsafe?: string | null): string;
    /**
     * Adds a virtual directory mapping.
     * @param {string} route - The route path.
     * @param {string} root - The root directory path.
     * @param {(ctx: IContext) => void} [evt] - Optional event handler for the directory.
     */
    addVirtualDir(route: string, root: string, evt?: (ctx: IContext) => void): void;
    /**
     * Retrieves information about a virtual directory.
     * @param {string} route - The virtual directory route.
     * @returns {{ route: string; root: string } | void} The virtual directory details.
     */
    virtualInfo(route: string): {
        route: string;
        root: string;
    } | void;
    /**
     * Formats a file system path for consistency.
     * @param {string} path - The path to format.
     * @param {boolean} [noCheck] - Whether to skip validation checks.
     * @returns {string} The formatted path.
     */
    formatPath(path: string, noCheck?: boolean): string;
    /**
     * Creates a resource bundle from a given string.
     * @param {string} str - The input string.
     * @returns {string} The generated bundle.
     */
    createBundle(str: string): string;
    /**
     * Adds a new MIME type mapping.
     * @param {string} extension - The file extension (e.g., `.json`).
     * @param {string} val - The corresponding MIME type (e.g., `application/json`).
     */
    addMimeType(extension: string, val: string): void;
    /**
     * Retrieves the root directory of the server.
     * @returns {string} The root directory path.
     */
    getRoot(): string;
    /**
     * Retrieves the public directory of the server.
     * @returns {string} The public directory path.
     */
    getPublic(): string;
    /**
     * Retrieves the name of the public directory.
     * @returns {string} The public directory name.
     */
    getPublicDirName(): string;
    /**
     * Parses and normalizes the max-age value for caching.
     * @param {any} maxAge - The max-age input.
     * @returns {number} The normalized max-age in seconds.
     */
    parseMaxAge(maxAge: any): number;
    /**
     * Creates and returns a new Vim context object.
     *
     * @returns {Record<string, any>} A newly created Vim context as a dictionary-like object.
     */
    createVimContext(): Record<string, any>;
    /**
     * Registers an event listener for server events.
     * @param {'shutdown'} ev - The event name.
     * @param {() => void} handler - The event handler function.
     */
    on(ev: "shutdown", handler: () => void): void;
}
export type IViewHandler = (app: IApplication, controller: IController, server: ICwServer) => void;
export declare class ServerEncryption implements IServerEncryption {
    private cryptoInfo;
    /**
     * Creates an encryption helper bound to the given key and IV information.
     *
     * @param inf Crypto key and IV information used for all operations.
     */
    constructor(inf: ICryptoInfo);
    /**
     * Encrypts plain text using the configured crypto info.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted text.
     */
    encrypt(plainText: string): string;
    /**
     * Decrypts text previously produced by encrypt using the configured crypto info.
     *
     * @param encryptedText Encrypted text to decrypt.
     * @returns The decrypted plain text.
     */
    decrypt(encryptedText: string): string;
    /**
     * Encrypts plain text and returns the result hex encoded.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted value as a hex string.
     */
    encryptToHex(plainText: string): string;
    /**
     * Decrypts a hex encoded encrypted value back to plain text.
     *
     * @param encryptedText Hex encoded encrypted text.
     * @returns The decrypted plain text.
     */
    decryptFromHex(encryptedText: string): string;
    /**
     * Encrypts plain text into a URI-safe encrypted string.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted URI-safe string.
     */
    encryptUri(plainText: string): string;
    /**
     * Decrypts a URI-safe encrypted string produced by encryptUri.
     *
     * @param encryptedText URI-safe encrypted text.
     * @returns The decrypted plain text.
     */
    decryptUri(encryptedText: string): string;
}
export declare class ServerConfig implements IServerConfig {
    [key: string]: any;
    Author: string;
    appName: string;
    version: string;
    packageVersion: string;
    isDebug: boolean;
    encryptionKey: ICryptoInfo;
    session: {
        cookie: string;
        key: ICryptoInfo;
        maxAge: number;
        isSecure: boolean;
    };
    mimeType: string[];
    defaultDoc: string[];
    defaultExt: string;
    views: string[];
    errorPage: Record<string, string>;
    hiddenDirectory: string[];
    hostInfo: {
        origin: string[];
        root: string;
        hostName: string;
        frameAncestors?: string;
        tls: boolean;
        cert: Record<string, string>;
        port: string | number;
    };
    database?: IDatabaseConfig[];
    staticFile: {
        compression: boolean;
        minCompressionSize: number;
        fileCache: false;
        tempPath: string;
    };
    cacheHeader: {
        maxAge: number;
        serverRevalidate: boolean;
    };
    liveStream: string[];
    noCache: string[];
    socketPath?: string;
    bundler: {
        enable: boolean;
        fileCache: boolean;
        route: string;
        compress: boolean;
        tempPath: string;
        reValidate?: boolean;
    };
    template: {
        cache: boolean;
        cacheType: string;
        ext: string[];
    };
    useFullOptimization: boolean;
    /**
     * Creates a server configuration populated with defaults such as app name, session cookie, host info
     * on port 8080, static file and bundler settings and a 30 day cache max age.
     */
    constructor();
}
export declare class SessionSecurity {
    /**
     * Returns the first part of an IP address (everything before the last dot), used to bind a session to
     * a client network. Falls back to 127.0.0 when no part can be derived.
     *
     * @param ip Remote IP address of the request.
     * @returns The IP address without its last octet.
     */
    static getRemoteAddress(ip: string): string;
    /**
     * Stamps the session object with the client's IP part and serializes it to JSON.
     *
     * @param req Current request, whose IP is recorded in the session.
     * @param sessionObj Session data object; its ipPart property is set by this call.
     * @returns JSON string of the session object.
     */
    static createSession(req: IRequest, sessionObj: Record<string, any>): string;
    /**
     * Checks that an authenticated session belongs to the same client network and clears its authenticated
     * flag if the stored IP part is missing or differs, to prevent session hijacking.
     *
     * @param req Request whose session is validated and possibly modified.
     */
    static isValidSession(req: IRequest): void;
}
export declare class CwServer implements ICwServer {
    private _public;
    private _log;
    private _root;
    private _rootregx;
    private _publicregx;
    private _config;
    private _port;
    private _nodeModuleregx;
    private _userInteractive;
    private _encryption;
    private _isInitialized;
    private _db;
    private _errorPage;
    /**
     * Gets the framework version.
     *
     * @returns The application version string.
     */
    get version(): string;
    /**
     * Gets whether the server has finished initialization.
     *
     * @returns True once init has been called.
     */
    get isInitialized(): boolean;
    /**
     * Gets the loaded server configuration.
     *
     * @returns The server configuration object.
     */
    get config(): IServerConfig;
    /**
     * Gets the public (www) directory name.
     *
     * @returns The public directory name.
     */
    get public(): string;
    /**
     * Gets the server logger.
     *
     * @returns The logger instance.
     */
    get log(): ILogger;
    /**
     * Gets the port the server listens on.
     *
     * @returns The listener port number or string.
     */
    get port(): string | number;
    /**
     * Gets the database modules loaded from configuration, keyed by module name.
     *
     * @returns Record of database instances by module name.
     */
    get db(): Record<string, ICwDatabaseType>;
    /**
     * Gets the server encryption helper.
     *
     * @returns The current server encryption instance.
     */
    get encryption(): IServerEncryption;
    /**
     * Gets the built-in default error page paths keyed by status code.
     *
     * @returns Record mapping status codes to error page file paths.
     */
    get errorPage(): {
        [x: string]: string;
    };
    /**
     * Creates the server: validates the app root and public directory name, loads and validates the app
     * config file, applies configuration, initializes databases and error pages, and prepares temp
     * directories. Throws an Error if arguments are missing, the config file is absent or invalid, or host
     * root does not match.
     *
     * @param appRoot Application root directory path.
     * @param wwwName Name of the public directory under the app root; required.
     */
    constructor(appRoot: string, wwwName?: string);
    /**
     * Creates the context object made available to view templates; the base implementation returns an
     * empty object.
     *
     * @returns A new empty object.
     */
    createVimContext(): Record<string, any>;
    /**
     * Replaces the server encryption helper with the supplied one, or with a new one built from the
     * configured encryption key when none is given.
     *
     * @param serverEnc Optional custom encryption implementation.
     */
    updateEncryption(serverEnc?: IServerEncryption): void;
    on: (ev: "shutdown", handler: () => void) => void;
    addVirtualDir: (route: string, root: string, evt?: (ctx: IContext) => void) => void;
    virtualInfo: (route: string) => {
        route: string;
        root: string;
    } | void;
    /**
     * Gets the config file name, taken from the APP_CONFIG_NAME environment variable or defaulting to
     * app.config.json.
     *
     * @returns The config file name.
     */
    getAppConfigName(): string;
    /**
     * Hook that decides whether a request context may be processed; the base implementation accepts every
     * context.
     *
     * @param ctx Request context to check.
     * @returns True when the context is valid.
     */
    isValidContext(ctx: IContext): boolean;
    /**
     * Gets the application root directory.
     *
     * @returns The root path.
     */
    getRoot(): string;
    /**
     * Parses a maxAge string such as 1d or 30D into milliseconds.
     *
     * @param maxAge Max-age text made of a number and a unit.
     * @returns Duration in milliseconds.
     */
    parseMaxAge(maxAge: any): number;
    /**
     * Gets the full path of the public directory (root plus public name).
     *
     * @returns The public directory path.
     */
    getPublic(): string;
    /**
     * Gets the name of the public directory.
     *
     * @returns The public directory name.
     */
    getPublicDirName(): string;
    /**
     * Marks the server as initialized.
     */
    init(): void;
    /**
     * Validates and applies loaded configuration: checks encryption key, hidden directory list, listener
     * port, session key and max age, and cache header, converting keys and max ages to their runtime
     * forms. Throws an Error when a required setting is missing or invalid.
     *
     * @param config Raw configuration values loaded from the config file.
     */
    implimentConfig(config: Record<string, any>): void;
    /**
     * Creates the server logger, disposing any previous one. Uses a file/console Logger in debug mode and
     * a no-op ShadowLogger otherwise.
     */
    createLogger(): void;
    /**
     * Initializes configured database modules, validates and normalizes the errorPage settings (merging
     * defaults for missing codes) and resolves view paths. Throws an Error on invalid database, module or
     * error page configuration.
     */
    initilize(): void;
    /**
     * Gets the copyright header line for generated output.
     *
     * @returns Copyright comment text.
     */
    copyright(): string;
    /**
     * Creates the request context for a request/response pair and sets its path, root, next callback and
     * file extension.
     *
     * @param req Incoming request.
     * @param res Outgoing response.
     * @param next Next handler callback.
     * @returns The new request context.
     */
    createContext(req: IRequest, res: IResponse, next: NextFunction): IContext;
    /**
     * Sets default security headers on the response, including a timestamp, configured default headers,
     * frame-ancestors policy and, when the session is secure, strict transport security and expect-ct.
     *
     * @param res Response to add headers to.
     */
    setDefaultProtectionHeader(res: IResponse): void;
    /**
     * Reads the session cookie, decrypts it and parses it into a session object. Returns an empty session
     * when the cookie is missing or cannot be decrypted; throws if no session cookie name is configured.
     *
     * @param headers Incoming HTTP headers of the request.
     * @param cook Raw cookie value or already parsed cookie collection.
     * @returns The parsed session, or a new empty session.
     */
    parseSession(headers: IncomingHttpHeaders, cook: undefined | string[] | string | {
        [x: string]: any;
    }): ISession;
    /**
     * Hook called when a session is cleared; the base implementation does nothing.
     *
     * @param ctx Request context whose session is being cleared.
     */
    onClearSession(ctx: IContext): void;
    /**
     * Creates an encrypted session token containing login id, role id and user data and sets it as an
     * httpOnly cookie on the response.
     *
     * @param ctx Request context providing request and response.
     * @param loginId Login identifier of the user.
     * @param roleId Role identifier of the user.
     * @param userData Additional user data stored in the session.
     * @returns Always true.
     */
    setSession(ctx: IContext, loginId: string, roleId: string, userData: any): boolean;
    /**
     * Sends the context's error as a 500 response, showing sanitized error details in debug mode and a
     * generic message otherwise.
     *
     * @param ctx Request context that may hold an error.
     * @returns True if an error was sent, false when the context has no error.
     */
    passError(ctx: IContext): boolean;
    /**
     * Finds the error page path for an HTTP error status code from configuration or the built-in defaults.
     * Throws an Error for non-error codes or when no page is found.
     *
     * @param statusCode HTTP error status code.
     * @param tryServer When true, only the built-in server error page is looked up.
     * @returns The error page path, or undefined when tryServer is true and no built-in page exists.
     */
    getErrorPath(statusCode: number, tryServer?: boolean): string | undefined;
    /**
     * Transfers processing to another path or to an error page for a status code, rendering the result.
     * Responds with plain text for error codes on XMLHttpRequest requests, records errors, and falls back
     * to passError when no page is available.
     *
     * @param ctx Request context to transfer.
     * @param path Target path, or an HTTP status code to resolve an error page for.
     * @param status Optional response info; derived from path when omitted.
     */
    transferRequest(ctx: IContext, path: string | number, status?: IResInfo): void;
    /**
     * Maps a path relative to the public directory to an absolute file system path.
     *
     * @param path Path relative to the public directory.
     * @returns The resolved absolute path.
     */
    mapPath(path: string): string;
    /**
     * Converts a file system path to a URL-style path without extension, trimming the public directory
     * prefix or replacing the root with $root. Paths without an extension are returned unchanged.
     *
     * @param path File system path to convert.
     * @returns The URL-style path.
     */
    pathToUrl(path: string): string;
    /**
     * Appends error information to the context's error text with sanitized paths; detailed message and
     * stack are added only in debug mode. Does nothing for disposed contexts.
     *
     * @param ctx Request context to record the error on.
     * @param ex Error message or Error object.
     * @returns The same context.
     */
    addError(ctx: IContext, ex: string | Error): IContext;
    /**
     * Escapes HTML special characters and converts line breaks to br tags.
     *
     * @param unsafe Text to escape; may be empty.
     * @returns The escaped string, or an empty string for empty input.
     */
    escape(unsafe?: string | null): string;
    /**
     * Resolves $root/ and $public/ placeholders in a path and optionally checks that the resulting file
     * exists. Throws an Error when it does not exist.
     *
     * @param path Path possibly containing placeholders.
     * @param noCheck When true, skip the existence check.
     * @returns The resolved path, or the original path if it has no placeholder.
     */
    formatPath(path: string, noCheck?: boolean): string;
    /**
     * Encrypts a string into a URI-safe bundle token using the server encryption key. Throws an Error for
     * an empty string.
     *
     * @param str String to encode into a bundle.
     * @returns The encrypted URI-safe bundle string.
     */
    createBundle(str: string): string;
    /**
     * Registers a MIME type for a file extension.
     *
     * @param extension File extension.
     * @param val MIME type value.
     */
    addMimeType(extension: string, val: string): void;
}
export interface IAppUtility {
    readonly public: string;
    readonly port: string | number;
    readonly socketPath: string;
    readonly log: ILogger;
    readonly server: ICwServer;
    readonly controller: IController;
    readonly initAsync: () => Promise<IApplication>;
}
/**
 * Creates the single server instance and controller and returns a utility object to start the
 * application. Throws an Error if the server was already initialized.
 *
 * @param appRoot Application root directory path.
 * @param wwwName Name of the public directory under the app root.
 * @returns Utility exposing the server, controller, logger, port, public name, socket path and the async init
 *   function.
 */
export declare function initilizeServer(appRoot: string, wwwName?: string): IAppUtility;
