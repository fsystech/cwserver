"use strict";
// Copyright (c) 2022 FSys Tech Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CwServer = exports.SessionSecurity = exports.ServerConfig = exports.ServerEncryption = void 0;
exports.initilizeServer = initilizeServer;
// 10:13 PM 5/2/2020
// by rajib chy
const app_static_1 = require("./app-static");
const server_core_1 = require("./server-core");
const help_1 = require("./help");
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const fsw = __importStar(require("./fsw"));
const app_util_1 = require("./app-util");
const schema_validator_1 = require("./schema-validator");
const app_controller_1 = require("./app-controller");
const encryption_1 = require("./encryption");
const http_status_1 = require("./http-status");
const logger_1 = require("./logger");
const http_mime_types_1 = require("./http-mime-types");
const app_view_1 = require("./app-view");
const context_1 = require("./context");
const session_1 = require("./session");
const default_headers_1 = __importDefault(require("./default-headers"));
const app_bundler_1 = require("./app-bundler");
/**
 * Type guard that checks a value is neither null nor undefined.
 *
 * @param a Value to test.
 * @returns True when the value is defined, narrowing its type to T.
 */
function isDefined(a) {
    return a !== null && a !== undefined;
}
/**
 * Converts a maxAge unit code and amount into milliseconds, recursing from minutes up to hours, days
 * and 30-day months. Throws an Error for an unsupported unit.
 *
 * @param type Upper-case unit code: M (minute), H (hour), D (day) or MM (month).
 * @param add Number of units to convert.
 * @param maxAge Original maxAge string, used only in the error message.
 * @returns Duration in milliseconds.
 */
function getEpoch(type, add, maxAge) {
    switch (type) {
        case "M": return (add * 60 * 1000); // Minute
        case "H": return getEpoch("M", 60, maxAge) * add; // Hour
        case "D": return getEpoch("H", 24, maxAge) * add; // Day
        case "MM": return getEpoch("D", 30, maxAge) * add; // Month
        default: throw new Error(`Invalid maxAage format ${maxAge}`);
    }
}
/**
 * Parses a maxAge string such as 30D, 1H or 5M into milliseconds. Throws an Error when the value is
 * not a string or does not match the digits-plus-unit format.
 *
 * @param maxAge Max-age text made of a number followed by a unit (M, H, D or MM).
 * @returns Duration in milliseconds.
 */
function parseMaxAge(maxAge) {
    if (typeof maxAge !== "string") {
        throw new Error("Invalid maxAge...");
    }
    const match = /^(\d+)([a-zA-Z]+)$/.exec(maxAge);
    if (!match) {
        throw new Error(`Invalid maxAge format ${maxAge}`);
    }
    const [, value, type] = match;
    return getEpoch(type.toUpperCase(), Number(value), maxAge);
}
const _formatPath = (() => {
    /**
     * Resolves a reserved path key used in $key/ path placeholders to a server directory. Throws an Error
     * for unknown keys.
     *
     * @param server Server instance providing the root and public directory values.
     * @param key Placeholder key, either root or public.
     * @returns The server root path for root, or the public directory name for public.
     */
    const exportPath = (server, key) => {
        switch (key) {
            case "root":
                return server.getRoot();
            case "public":
                return server.getPublicDirName();
            default:
                throw new Error(`Invalid key ${key}`);
        }
    };
    return (server, path, noCheck = false) => {
        if (!path.includes("$")) {
            return path;
        }
        const resolved = _path.resolve(path.replace(/\$([^/]+)\//g, (_, key) => `${exportPath(server, key)}/`));
        if (noCheck) {
            return resolved;
        }
        if (!_fs.existsSync(resolved)) {
            throw new Error(`No file found\r\nPath: ${resolved}\r\nRequest Path: ${path}`);
        }
        return resolved;
    };
})();
class ServerEncryption {
    /**
     * Creates an encryption helper bound to the given key and IV information.
     *
     * @param inf Crypto key and IV information used for all operations.
     */
    constructor(inf) {
        this.cryptoInfo = inf;
    }
    /**
     * Encrypts plain text using the configured crypto info.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted text.
     */
    encrypt(plainText) {
        return encryption_1.Encryption.encrypt(plainText, this.cryptoInfo);
    }
    /**
     * Decrypts text previously produced by encrypt using the configured crypto info.
     *
     * @param encryptedText Encrypted text to decrypt.
     * @returns The decrypted plain text.
     */
    decrypt(encryptedText) {
        return encryption_1.Encryption.decrypt(encryptedText, this.cryptoInfo);
    }
    /**
     * Encrypts plain text and returns the result hex encoded.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted value as a hex string.
     */
    encryptToHex(plainText) {
        return encryption_1.Encryption.encryptToHex(plainText, this.cryptoInfo);
    }
    /**
     * Decrypts a hex encoded encrypted value back to plain text.
     *
     * @param encryptedText Hex encoded encrypted text.
     * @returns The decrypted plain text.
     */
    decryptFromHex(encryptedText) {
        return encryption_1.Encryption.decryptFromHex(encryptedText, this.cryptoInfo);
    }
    /**
     * Encrypts plain text into a URI-safe encrypted string.
     *
     * @param plainText Text to encrypt.
     * @returns The encrypted URI-safe string.
     */
    encryptUri(plainText) {
        return encryption_1.Encryption.encryptUri(plainText, this.cryptoInfo);
    }
    /**
     * Decrypts a URI-safe encrypted string produced by encryptUri.
     *
     * @param encryptedText URI-safe encrypted text.
     * @returns The decrypted plain text.
     */
    decryptUri(encryptedText) {
        return encryption_1.Encryption.decryptUri(encryptedText, this.cryptoInfo);
    }
}
exports.ServerEncryption = ServerEncryption;
class ServerConfig {
    /**
     * Creates a server configuration populated with defaults such as app name, session cookie, host info
     * on port 8080, static file and bundler settings and a 30 day cache max age.
     */
    constructor() {
        this.Author = "FSys Tech Ltd.";
        this.appName = "Cw Server";
        this.version = "0.0.1";
        this.packageVersion = "101";
        this.isDebug = true;
        this.encryptionKey = Object.create(null);
        this.session = {
            "cookie": "_Cw_session",
            "key": Object.create(null),
            "maxAge": 100,
            isSecure: false
        };
        this.defaultDoc = [];
        this.mimeType = [];
        this.defaultExt = "";
        this.views = [];
        this.errorPage = {};
        this.hiddenDirectory = [];
        this.template = {
            cache: true,
            cacheType: "FILE",
            ext: []
        };
        this.hostInfo = {
            "origin": [],
            "root": "www",
            "hostName": "localhost",
            "frameAncestors": void 0,
            "tls": false,
            "cert": {},
            "port": 8080
        };
        this.staticFile = {
            compression: true,
            minCompressionSize: 1024 * 5,
            fileCache: false,
            tempPath: "/web/temp/cache/"
        };
        this.cacheHeader = {
            maxAge: parseMaxAge("30D"), // 30Day
            serverRevalidate: true
        };
        this.liveStream = [];
        this.noCache = [];
        this.bundler = {
            enable: true,
            fileCache: true,
            route: "/app/api/bundle/",
            compress: true,
            reValidate: true,
            tempPath: "/web/temp/"
        };
        this.useFullOptimization = true;
    }
}
exports.ServerConfig = ServerConfig;
// prevent session hijacking
class SessionSecurity {
    /**
     * Returns the first part of an IP address (everything before the last dot), used to bind a session to
     * a client network. Falls back to 127.0.0 when no part can be derived.
     *
     * @param ip Remote IP address of the request.
     * @returns The IP address without its last octet.
     */
    static getRemoteAddress(ip) {
        let ipPart = ip.substring(0, ip.lastIndexOf('.'));
        if (!ipPart) {
            // assume local machine
            ipPart = "127.0.0";
        }
        return ipPart;
    }
    /**
     * Stamps the session object with the client's IP part and serializes it to JSON.
     *
     * @param req Current request, whose IP is recorded in the session.
     * @param sessionObj Session data object; its ipPart property is set by this call.
     * @returns JSON string of the session object.
     */
    static createSession(req, sessionObj) {
        sessionObj.ipPart = this.getRemoteAddress(req.ip);
        return app_util_1.Util.JSON.stringify(sessionObj);
    }
    /**
     * Checks that an authenticated session belongs to the same client network and clears its authenticated
     * flag if the stored IP part is missing or differs, to prevent session hijacking.
     *
     * @param req Request whose session is validated and possibly modified.
     */
    static isValidSession(req) {
        if (!req.session.isAuthenticated)
            return;
        if (!req.session.ipPart || req.session.ipPart !== this.getRemoteAddress(req.ip)) {
            // prevent session hijack
            req.session.isAuthenticated = false;
        }
        return;
    }
}
exports.SessionSecurity = SessionSecurity;
class CwServer {
    /**
     * Gets the framework version.
     *
     * @returns The application version string.
     */
    get version() {
        return server_core_1.appVersion;
    }
    /**
     * Gets whether the server has finished initialization.
     *
     * @returns True once init has been called.
     */
    get isInitialized() {
        return this._isInitialized;
    }
    /**
     * Gets the loaded server configuration.
     *
     * @returns The server configuration object.
     */
    get config() {
        return this._config;
    }
    /**
     * Gets the public (www) directory name.
     *
     * @returns The public directory name.
     */
    get public() {
        return this._public;
    }
    /**
     * Gets the server logger.
     *
     * @returns The logger instance.
     */
    get log() {
        return this._log;
    }
    /**
     * Gets the port the server listens on.
     *
     * @returns The listener port number or string.
     */
    get port() {
        return this._port;
    }
    /**
     * Gets the database modules loaded from configuration, keyed by module name.
     *
     * @returns Record of database instances by module name.
     */
    get db() {
        return this._db;
    }
    /**
     * Gets the server encryption helper.
     *
     * @returns The current server encryption instance.
     */
    get encryption() {
        return this._encryption;
    }
    /**
     * Gets the built-in default error page paths keyed by status code.
     *
     * @returns Record mapping status codes to error page file paths.
     */
    get errorPage() {
        return this._errorPage;
    }
    /**
     * Creates the server: validates the app root and public directory name, loads and validates the app
     * config file, applies configuration, initializes databases and error pages, and prepares temp
     * directories. Throws an Error if arguments are missing, the config file is absent or invalid, or host
     * root does not match.
     *
     * @param appRoot Application root directory path.
     * @param wwwName Name of the public directory under the app root; required.
     */
    constructor(appRoot, wwwName) {
        this._isInitialized = false;
        this._port = 0;
        this._log = Object.create(null);
        if (!wwwName) {
            if (process.env.IISNODE_VERSION) {
                throw new Error(`web.config error.
    
    Invalid web.config defined.
    Behind the <configuration> tag in your web.config add this
    
    <appSettings>
        <add key="your-iis-app-pool-id" value="your-app-root" />
    </appSettings>
    
    your-app-root | directory name should be exists here:
    ${appRoot}\\www_public`);
            }
            throw new Error(`Argument missing.
    
    Example:
    node server my_app_root.
    
    App Root should exist here:
    ${appRoot}\\my_app_root`);
        }
        this._root = appRoot;
        this._public = wwwName.trim();
        this._config = new ServerConfig();
        this._db = Object.create(null);
        const configPath = _path.resolve(this._root, this._public, "config", this.getAppConfigName());
        if (!_fs.existsSync(configPath)) {
            throw new Error(`No config file found in ${configPath}`);
        }
        let config = null;
        try {
            config = fsw.readJsonSyncUnsafe(configPath);
        }
        catch (ex) {
            console.warn(`Invalid config file defined.\r\nConfig: ${configPath}`);
            throw ex;
        }
        schema_validator_1.Schema.Validate(config);
        if (this._public !== config.hostInfo.root) {
            throw new Error(`Server ready for App Root: ${this._public}.
                But host_info root path is ${config.hostInfo.root}.`);
        }
        const libRoot = (0, app_util_1.getAppDir)();
        this._errorPage = {
            "404": _path.resolve(libRoot, "dist/error_page/404.html"),
            "401": _path.resolve(libRoot, "dist/error_page/401.html"),
            "500": _path.resolve(libRoot, "dist/error_page/500.html")
        };
        app_util_1.Util.extend(this._config, config, true);
        this.implimentConfig(config);
        const normalizedRoot = this._root.replace(/\\/g, "/");
        this._publicregx =
            new RegExp(`${this._public}/`, "i");
        this._rootregx =
            new RegExp(normalizedRoot, "i");
        this._nodeModuleregx =
            new RegExp(`${normalizedRoot.replace(/\/dist/i, "")}/node_modules/`, "i");
        this._userInteractive = false;
        this.initilize();
        this._encryption =
            new ServerEncryption(this._config.encryptionKey);
        fsw.mkdirSync(this.getPublic(), "/web/temp/cache/");
        this.on = Object.create(null);
        this.addVirtualDir = Object.create(null);
        this.virtualInfo = Object.create(null);
        this._config.bundler.tempPath =
            this.mapPath(this._config.bundler.tempPath);
        this._config.staticFile.tempPath =
            this.mapPath(this._config.staticFile.tempPath);
        this._log = new logger_1.ShadowLogger();
    }
    /**
     * Creates the context object made available to view templates; the base implementation returns an
     * empty object.
     *
     * @returns A new empty object.
     */
    createVimContext() {
        return {};
    }
    /**
     * Replaces the server encryption helper with the supplied one, or with a new one built from the
     * configured encryption key when none is given.
     *
     * @param serverEnc Optional custom encryption implementation.
     */
    updateEncryption(serverEnc) {
        this._encryption = null;
        if (serverEnc) {
            this._encryption = serverEnc;
        }
        else {
            this._encryption = new ServerEncryption(this._config.encryptionKey);
        }
    }
    /**
     * Gets the config file name, taken from the APP_CONFIG_NAME environment variable or defaulting to
     * app.config.json.
     *
     * @returns The config file name.
     */
    getAppConfigName() {
        if (process.env.APP_CONFIG_NAME) {
            return process.env.APP_CONFIG_NAME;
        }
        return "app.config.json";
    }
    /**
     * Hook that decides whether a request context may be processed; the base implementation accepts every
     * context.
     *
     * @param ctx Request context to check.
     * @returns True when the context is valid.
     */
    isValidContext(ctx) {
        return true;
    }
    /**
     * Gets the application root directory.
     *
     * @returns The root path.
     */
    getRoot() {
        return this._root;
    }
    /**
     * Parses a maxAge string such as 1d or 30D into milliseconds.
     *
     * @param maxAge Max-age text made of a number and a unit.
     * @returns Duration in milliseconds.
     */
    parseMaxAge(maxAge) {
        return parseMaxAge(maxAge);
    }
    /**
     * Gets the full path of the public directory (root plus public name).
     *
     * @returns The public directory path.
     */
    getPublic() {
        return `${this._root}/${this._public}`;
    }
    /**
     * Gets the name of the public directory.
     *
     * @returns The public directory name.
     */
    getPublicDirName() {
        return this._public;
    }
    /**
     * Marks the server as initialized.
     */
    init() {
        this._isInitialized = true;
    }
    /**
     * Validates and applies loaded configuration: checks encryption key, hidden directory list, listener
     * port, session key and max age, and cache header, converting keys and max ages to their runtime
     * forms. Throws an Error when a required setting is missing or invalid.
     *
     * @param config Raw configuration values loaded from the config file.
     */
    implimentConfig(config) {
        var _a;
        if (typeof this._config.bundler.reValidate !== "boolean") {
            this._config.bundler.reValidate = true;
        }
        if (!config.encryptionKey) {
            throw new Error("Security risk... encryption key required....");
        }
        if (!app_util_1.Util.isArrayLike(config.hiddenDirectory)) {
            throw new Error("hidden_directory should be Array...");
        }
        const port = process.env.IISNODE_VERSION && process.env.PORT
            ? process.env.PORT
            : this._config.hostInfo.port;
        if (!port) {
            throw new Error("Listener port required...");
        }
        this._port = port;
        this._config.encryptionKey =
            encryption_1.Encryption.updateCryptoKeyIV(config.encryptionKey);
        const session = this._config.session;
        if (session) {
            if (!session.key) {
                throw new Error("Security risk... Session encryption key required....");
            }
            session.key =
                encryption_1.Encryption.updateCryptoKeyIV(config.session.key);
            const maxAge = (_a = config.session.maxAge) !== null && _a !== void 0 ? _a : "1d";
            if (typeof maxAge !== "string") {
                throw new Error(`Invalid maxAge format ${maxAge}. maxAge should "1d|1h|1m" formatted...`);
            }
            session.maxAge = parseMaxAge(maxAge);
        }
        const cacheHeader = this._config.cacheHeader;
        if (!cacheHeader) {
            throw new Error("cacheHeader information required...");
        }
        cacheHeader.maxAge =
            parseMaxAge(config.cacheHeader.maxAge);
    }
    /**
     * Creates the server logger, disposing any previous one. Uses a file/console Logger in debug mode and
     * a no-op ShadowLogger otherwise.
     */
    createLogger() {
        this._userInteractive = process.env.IISNODE_VERSION || process.env.PORT ? false : true;
        if (typeof (this._log.dispose) === "function") {
            this._log.dispose();
        }
        if (!this._config.isDebug) {
            this._log = new logger_1.ShadowLogger();
        }
        else {
            this._log = new logger_1.Logger(`./log/`, this._public, void 0, this._userInteractive, this._config.isDebug);
        }
    }
    /**
     * Initializes configured database modules, validates and normalizes the errorPage settings (merging
     * defaults for missing codes) and resolves view paths. Throws an Error on invalid database, module or
     * error page configuration.
     */
    initilize() {
        const database = this._config.database;
        if (isDefined(database)) {
            if (!app_util_1.Util.isArrayLike(database)) {
                throw new Error("database config should be Array....");
            }
            database.forEach((conf) => {
                if (!conf.module) {
                    throw new Error("database module name required.");
                }
                if (this._db[conf.module]) {
                    throw new Error(`database module ${conf.module} already exists.`);
                }
                if (!conf.path) {
                    throw new Error(`No path defined for module ${conf.module}`);
                }
                const path = this.formatPath(conf.path);
                this._db[conf.module] =
                    new (_importLocalAssets(path))(conf.dbConn);
            });
        }
        if (!this._config.errorPage)
            this._config.errorPage = {};
        if (app_util_1.Util.isPlainObject(this._config.errorPage) === false)
            throw new Error("errorPage property should be Object.");
        if (Object.keys(this._config.errorPage).length === 0) {
            Object.assign(this._config.errorPage, this._errorPage);
        }
        else {
            for (const [property, value] of Object.entries(this._config.errorPage)) {
                if (!value) {
                    continue;
                }
                const code = Number(property);
                const statusCode = http_status_1.HttpStatus.fromPath(value, code);
                if (statusCode !== code ||
                    !http_status_1.HttpStatus.isErrorCode(statusCode)) {
                    throw new Error(`Invalid Server/Client error page... ${value} and code ${code}`);
                }
                this._config.errorPage[property] =
                    this.formatPath(value);
            }
            Object.assign(this._config.errorPage, Object.fromEntries(Object.entries(this._errorPage)
                .filter(([key]) => !this._config.errorPage[key])));
        }
        this._config.views = this._config.views.map(path => this.formatPath(path));
    }
    /**
     * Gets the copyright header line for generated output.
     *
     * @returns Copyright comment text.
     */
    copyright() {
        return '//\tCopyright (c) 2022 FSys Tech Ltd.\r\n';
    }
    /**
     * Creates the request context for a request/response pair and sets its path, root, next callback and
     * file extension.
     *
     * @param req Incoming request.
     * @param res Outgoing response.
     * @param next Next handler callback.
     * @returns The new request context.
     */
    createContext(req, res, next) {
        const context = context_1._ctxManager.create(this, req, res);
        context.path = req.path;
        context.root = context.path;
        context.next = next;
        context.extension = app_util_1.Util.getExtension(context.path) || "";
        return context;
    }
    /**
     * Sets default security headers on the response, including a timestamp, configured default headers,
     * frame-ancestors policy and, when the session is secure, strict transport security and expect-ct.
     *
     * @param res Response to add headers to.
     */
    setDefaultProtectionHeader(res) {
        res.setHeader("x-timestamp", Date.now());
        const headers = default_headers_1.default.getHeaders();
        for (const [key, value] of Object.entries(headers)) {
            res.setHeader(key, value);
        }
        if (this._config.hostInfo.frameAncestors) {
            res.setHeader("content-security-policy", `frame-ancestors ${this._config.hostInfo.frameAncestors}`);
        }
        if (this._config.session.isSecure) {
            res.setHeader("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
            const host = this._config.hostInfo.hostName;
            if (host) {
                res.setHeader("expect-ct", `max-age=0, report-uri="https://${host}/report/?ct=browser&version=${server_core_1.appVersion}`);
            }
        }
    }
    /**
     * Reads the session cookie, decrypts it and parses it into a session object. Returns an empty session
     * when the cookie is missing or cannot be decrypted; throws if no session cookie name is configured.
     *
     * @param headers Incoming HTTP headers of the request.
     * @param cook Raw cookie value or already parsed cookie collection.
     * @returns The parsed session, or a new empty session.
     */
    parseSession(headers, cook) {
        if (!this._config.session.cookie ||
            this._config.session.cookie.length === 0) {
            throw Error("You are unable to add session without session config. see your app_config.json");
        }
        const session = new session_1.Session();
        const cookies = (0, help_1.parseCookie)(cook);
        const value = cookies[this._config.session.cookie];
        if (!value)
            return session;
        const str = encryption_1.Encryption.decryptFromHex(value, this._config.session.key);
        if (!str) {
            return session;
        }
        return session.parse(str);
    }
    /**
     * Hook called when a session is cleared; the base implementation does nothing.
     *
     * @param ctx Request context whose session is being cleared.
     */
    onClearSession(ctx) {
        // nothing to do
    }
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
    setSession(ctx, loginId, roleId, userData) {
        const token = encryption_1.Encryption.encryptToHex(SessionSecurity.createSession(ctx.req, {
            loginId, roleId, userData
        }), this._config.session.key);
        ctx.res.cookie(this._config.session.cookie, token, {
            maxAge: this._config.session.maxAge,
            httpOnly: true,
            secure: this._config.session.isSecure
        });
        return true;
    }
    /**
     * Sends the context's error as a 500 response, showing sanitized error details in debug mode and a
     * generic message otherwise.
     *
     * @param ctx Request context that may hold an error.
     * @returns True if an error was sent, false when the context has no error.
     */
    passError(ctx) {
        if (!ctx.error) {
            return false;
        }
        if (!this._config.isDebug) {
            ctx.res
                .status(500)
                .send("Internal error occurred. Please try again.");
            return true;
        }
        const message = this.escape(ctx.error
            .replace(/\\/g, "/")
            .replace(this._rootregx, "$root")
            .replace(this._publicregx, "$public/"));
        ctx.res
            .status(500)
            .send(`<pre>${message}</pre>`);
        return true;
    }
    /**
     * Finds the error page path for an HTTP error status code from configuration or the built-in defaults.
     * Throws an Error for non-error codes or when no page is found.
     *
     * @param statusCode HTTP error status code.
     * @param tryServer When true, only the built-in server error page is looked up.
     * @returns The error page path, or undefined when tryServer is true and no built-in page exists.
     */
    getErrorPath(statusCode, tryServer = false) {
        if (!http_status_1.HttpStatus.isErrorCode(statusCode)) {
            throw new Error(`Invalid http error status code ${statusCode}`);
        }
        const code = String(statusCode);
        if (tryServer) {
            return this._errorPage[code];
        }
        if (this._config.errorPage[code]) {
            return this._config.errorPage[code];
        }
        if (this._errorPage[code]) {
            return this._errorPage[code];
        }
        throw new Error(`No error page found in app.config.json->errorPage[${code}]`);
    }
    /**
     * Transfers processing to another path or to an error page for a status code, rendering the result.
     * Responds with plain text for error codes on XMLHttpRequest requests, records errors, and falls back
     * to passError when no page is available.
     *
     * @param ctx Request context to transfer.
     * @param path Target path, or an HTTP status code to resolve an error page for.
     * @param status Optional response info; derived from path when omitted.
     */
    transferRequest(ctx, path, status) {
        if (!ctx) {
            throw new Error("Invalid argument defined...");
        }
        if (ctx.isDisposed) {
            return;
        }
        status !== null && status !== void 0 ? status : (status = http_status_1.HttpStatus.getResInfo(path, 200));
        if (!status.isErrorCode && typeof path !== "string") {
            throw new Error("Path should be string...");
        }
        if (status.isErrorCode &&
            ctx.req.get("x-requested-with") === "XMLHttpRequest") {
            return ctx.res
                .status(status.code)
                .type("text")
                .noCache()
                .send(`${ctx.req.method} : ${ctx.req.path} ${status.description}\n${ctx.error}`);
        }
        let tryServer = false;
        if (status.isErrorCode) {
            ctx.res.noCache();
            if (status.isInternalErrorCode &&
                ctx.errorPage.includes("\\dist\\error_page\\500")) {
                this.passError(ctx);
                return;
            }
            tryServer = status.code === ctx.errorCode;
            if (!tryServer) {
                ctx.errorCode = status.code;
            }
        }
        const nextPath = typeof path === "string"
            ? path
            : this.getErrorPath(path, tryServer);
        if (!nextPath) {
            this.passError(ctx);
            return;
        }
        if (status.isErrorCode && !status.isInternalErrorCode) {
            this.addError(ctx, `${status.code} ${status.description}`);
        }
        if (status.isErrorCode) {
            ctx.errorPage = _path.resolve(nextPath);
            ctx.path = ctx.errorPage.includes("\\dist\\error_page\\")
                ? `/cwserver/error_page/${status.code}`
                : `/error/${status.code}`;
        }
        ctx.res.render(ctx, nextPath, status);
    }
    /**
     * Maps a path relative to the public directory to an absolute file system path.
     *
     * @param path Path relative to the public directory.
     * @returns The resolved absolute path.
     */
    mapPath(path) {
        return _path.resolve(`${this._root}/${this._public}/${path}`);
    }
    /**
     * Converts a file system path to a URL-style path without extension, trimming the public directory
     * prefix or replacing the root with $root. Paths without an extension are returned unchanged.
     *
     * @param path File system path to convert.
     * @returns The URL-style path.
     */
    pathToUrl(path) {
        if (!app_util_1.Util.getExtension(path))
            return path;
        let index = path.indexOf(this._public);
        if (index === 0)
            return path;
        if (index > 0) {
            path = path.substring(path.indexOf(this._public) + this._public.length);
        }
        else {
            path = path.replace(this._rootregx, "/$root");
        }
        index = path.lastIndexOf(".");
        return path.substring(0, index).replace(/\\/gi, "/");
    }
    /**
     * Appends error information to the context's error text with sanitized paths; detailed message and
     * stack are added only in debug mode. Does nothing for disposed contexts.
     *
     * @param ctx Request context to record the error on.
     * @param ex Error message or Error object.
     * @returns The same context.
     */
    addError(ctx, ex) {
        var _a;
        if (ctx.isDisposed)
            return ctx;
        ctx.path = this.pathToUrl(ctx.path);
        ctx.error = ctx.error
            ? `${ctx.error}\r\n\r\nNext error occurred in ${ctx.path}`
            : `Error occurred in ${ctx.path}`;
        if (!this._config.isDebug) {
            return ctx;
        }
        ctx.error += typeof ex === "string"
            ? ` ${ex}`
            : `\r\n${ex.message}\r\n${(_a = ex.stack) !== null && _a !== void 0 ? _a : ""}`;
        ctx.error = ctx.error
            .replace(/\\/g, "/")
            .replace(this._rootregx, "$root")
            .replace(this._publicregx, "$public/")
            .replace(this._nodeModuleregx, "$engine/");
        return ctx;
    }
    /**
     * Escapes HTML special characters and converts line breaks to br tags.
     *
     * @param unsafe Text to escape; may be empty.
     * @returns The escaped string, or an empty string for empty input.
     */
    escape(unsafe) {
        if (!unsafe)
            return "";
        return unsafe
            .replace(/&/gi, "&amp;")
            .replace(/</gi, "&lt;")
            .replace(/>/gi, "&gt;")
            .replace(/\r\n/gi, "<br/>")
            .replace(/\n/gi, "<br/>");
    }
    /**
     * Resolves $root/ and $public/ placeholders in a path and optionally checks that the resulting file
     * exists. Throws an Error when it does not exist.
     *
     * @param path Path possibly containing placeholders.
     * @param noCheck When true, skip the existence check.
     * @returns The resolved path, or the original path if it has no placeholder.
     */
    formatPath(path, noCheck) {
        return _formatPath(this, path, noCheck);
    }
    /**
     * Encrypts a string into a URI-safe bundle token using the server encryption key. Throws an Error for
     * an empty string.
     *
     * @param str String to encode into a bundle.
     * @returns The encrypted URI-safe bundle string.
     */
    createBundle(str) {
        if (!str)
            throw new Error("No string found to create bundle...");
        return encryption_1.Encryption.encryptUri(str, this._config.encryptionKey);
    }
    /**
     * Registers a MIME type for a file extension.
     *
     * @param extension File extension.
     * @param val MIME type value.
     */
    addMimeType(extension, val) {
        return http_mime_types_1._mimeType.add(extension, val);
    }
}
exports.CwServer = CwServer;
/**
 * Creates the single server instance and controller and returns a utility object to start the
 * application. Throws an Error if the server was already initialized.
 *
 * @param appRoot Application root directory path.
 * @param wwwName Name of the public directory under the app root.
 * @returns Utility exposing the server, controller, logger, port, public name, socket path and the async init
 *   function.
 */
function initilizeServer(appRoot, wwwName) {
    if (app_view_1.AppView.isInitilized) {
        throw new Error("Server instance can initilize 1 time...");
    }
    const _server = new CwServer(appRoot, wwwName);
    const _process = {
        render: (code, ctx, next, transfer) => {
            if (transfer && typeof (transfer) !== "boolean") {
                throw new Error("transfer argument should be ?boolean....");
            }
            if (!code) {
                return next();
            }
            if (code < 0
                || (typeof (transfer) === "boolean" && transfer === false)
                || !http_status_1.HttpStatus.isErrorCode(code)) {
                return void 0;
            }
            return _server.transferRequest(ctx, code);
        },
        createContext: (req, res, next) => {
            const _context = _server.createContext(req, res, next);
            const _next = _context.next;
            _context.next = (code, transfer) => {
                if (_context.isDisposed) {
                    console.warn('Warning: `context already disposed`. Cannot access disposed object.');
                    return;
                }
                return _process.render(code, _context, _next, transfer);
            };
            return _context;
        }
    };
    const _controller = new app_controller_1.Controller(_server.config.defaultExt && _server.config.defaultExt.length > 0 ? true : false);
    /**
     * Builds and configures the application: registers logging and context cleanup events, virtual
     * directory support, bundler, views, error handling and the main request handler, then marks the
     * server initialized. Throws if already initialized.
     *
     * @returns Promise resolving to the configured application.
     */
    function initializeAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (_server.isInitialized) {
                throw new Error("Server already initilized");
            }
            const _app = (0, server_core_1.App)(_server.config.isDebug);
            _server.on = (ev, handler) => {
                _app.on(ev, handler);
            };
            if (_server.config.isDebug) {
                _app.on("request-begain", (req) => {
                    _server.log.success(`${req.method} ${req.path}`);
                }).on("response-end", (req, res) => {
                    const ctx = context_1._ctxManager.getMyContext(req.id);
                    if (ctx && !ctx.isDisposed) {
                        if (res.statusCode && http_status_1.HttpStatus.isErrorCode(res.statusCode)) {
                            _server.log.error(`Send ${res.statusCode} ${ctx.path}`);
                        }
                        else {
                            _server.log.success(`Send ${res.statusCode} ${ctx.path}`);
                        }
                    }
                    return context_1._ctxManager.removeContext(req.id);
                });
            }
            else {
                _app.on("response-end", (req, res) => {
                    return context_1._ctxManager.removeContext(req.id);
                });
            }
            const _virtualDir = [];
            _server.virtualInfo = (route) => {
                const v = _virtualDir.find(a => a.route === route);
                if (!v)
                    return;
                return {
                    route: v.route,
                    root: v.root
                };
            };
            _server.addVirtualDir = (route, root, evt) => {
                if (route.includes(":") || route.includes("*")) {
                    throw new Error(`Unsupported symbol defined. ${route}`);
                }
                const originalRoute = route;
                if (_virtualDir.some(item => item.route === originalRoute)) {
                    throw new Error(`You already added this virtual route ${route}`);
                }
                const virtualRoute = `${route.replace(/\/?$/, "/")}*`;
                /**
                 * Creates a context for a virtual directory request, checks the context is valid and the target file
                 * exists (404 otherwise), then runs the given handler.
                 *
                 * @param req Incoming request.
                 * @param res Outgoing response.
                 * @param next Next handler callback.
                 * @param handler Function invoked with the context when the file exists.
                 * @returns Promise that resolves when handling completes.
                 */
                const processHandler = (req, res, next, handler) => __awaiter(this, void 0, void 0, function* () {
                    const ctx = _server.createContext(req, res, next);
                    ctx.next = (code, transfer) => {
                        if (!code || code === 200) {
                            return;
                        }
                        return _process.render(code, ctx, next, transfer);
                    };
                    if (!_server.isValidContext(ctx)) {
                        return;
                    }
                    const { exists } = yield fsw.isExistsAsync(`${root}/${ctx.path}`);
                    if (!exists) {
                        return ctx.next(404);
                    }
                    return yield handler(ctx);
                });
                if (typeof evt !== "function") {
                    _app.use(virtualRoute, (req, res, next) => {
                        processHandler(req, res, next, ctx => {
                            if (_server.config.mimeType.includes(ctx.extension)) {
                                return _controller.httpMimeHandler.renderAsync(ctx, root);
                            }
                            return ctx.next(404);
                        }).catch(next);
                    }, true);
                }
                else {
                    _app.use(virtualRoute, (req, res, next) => {
                        processHandler(req, res, next, ctx => {
                            _server.log.success(`Send 200 ${virtualRoute}${req.path}`);
                            return evt(ctx);
                        }).catch(next);
                    }, true);
                }
                _virtualDir.push({
                    route: originalRoute,
                    root
                });
            };
            if (_server.config.bundler && _server.config.bundler.enable) {
                app_bundler_1.Bundler.Init(_app, _controller, _server);
            }
            if (app_util_1.Util.isArrayLike(_server.config.views)) {
                _server.config.views.forEach(path => _importLocalAssets(path));
            }
            _app.on("error", (req, res, err) => {
                if (res.isAlive) {
                    const context = _process.createContext(req, res, res.sendIfError.bind(res));
                    if (!err) {
                        return context.transferRequest(404);
                    }
                    if (err instanceof Error) {
                        return context.transferError(err);
                    }
                }
            });
            yield app_view_1.AppView.initAsync(_app, _controller, _server);
            _controller.sort();
            const hasHiddenDirectory = _server.config.hiddenDirectory.length > 0;
            _app.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
                const context = _process.createContext(req, res, next);
                const reqPath = req.path;
                if (hasHiddenDirectory) {
                    const isHidden = _server.config.hiddenDirectory.some(dir => reqPath.startsWith(dir));
                    if (isHidden) {
                        _server.log.write(`Trying to access Hidden directory. Remote Address ${req.ip} Send 404 ${req.path}`);
                        return _server.transferRequest(context, 404);
                    }
                }
                if (reqPath.includes("$root") || reqPath.includes("$public")) {
                    _server.log.write(`Trying to access directly reserved keyword ($root | $public). Remote Address ${req.ip} Send 404 ${req.path}`);
                    return _server.transferRequest(context, 404);
                }
                try {
                    if (!_server.isValidContext(context)) {
                        return;
                    }
                    return yield _controller.processAny(context);
                }
                catch (ex) {
                    return _server.transferRequest(_server.addError(context, ex), 500);
                }
            }));
            _server.init();
            return _app;
        });
    }
    app_view_1.AppView.isInitilized = true;
    return {
        initAsync: initializeAsync,
        /**
         * Gets the public directory name of the server.
         *
         * @returns The public directory name.
         */
        get public() { return _server.public; },
        /**
         * Gets the listener port of the server.
         *
         * @returns The port number or string.
         */
        get port() { return _server.port; },
        /**
         * Gets the server logger.
         *
         * @returns The logger instance.
         */
        get log() { return _server.log; },
        /**
         * Gets the configured socket path as a string.
         *
         * @returns The socket path string.
         */
        get socketPath() { return (0, app_static_1.toString)(_server.config.socketPath); },
        /**
         * Gets the server instance.
         *
         * @returns The server instance.
         */
        get server() { return _server; },
        /**
         * Gets the request controller.
         *
         * @returns The controller instance.
         */
        get controller() { return _controller; }
    };
}
//# sourceMappingURL=server.js.map