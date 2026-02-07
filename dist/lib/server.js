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
const app_static_2 = require("./app-static");
const app_controller_1 = require("./app-controller");
const encryption_1 = require("./encryption");
const http_status_1 = require("./http-status");
const logger_1 = require("./logger");
const http_mime_types_1 = require("./http-mime-types");
const app_view_1 = require("./app-view");
const context_1 = require("./context");
function isDefined(a) {
    return a !== null && a !== undefined;
}
function getEpoch(type, add, maxAge) {
    switch (type) {
        case "M": return (add * 60 * 1000); // Minute
        case "H": return getEpoch("M", 60, maxAge) * add; // Hour
        case "D": return getEpoch("H", 24, maxAge) * add; // Day
        case "MM": return getEpoch("D", 30, maxAge) * add; // Month
        default: throw new Error(`Invalid maxAage format ${maxAge}`);
    }
}
function parseMaxAge(maxAge) {
    if (typeof (maxAge) !== "string")
        throw new Error(`Invalid maxAage...`);
    let add = "", type = "";
    for (const part of maxAge) {
        if (/^\d$/.test(part)) {
            if (type.length > 0)
                throw new Error(`Invalid maxAage format ${maxAge}`);
            add += part;
            continue;
        }
        type += part;
    }
    if (type.length === 0 || add.length === 0)
        throw new Error(`Invalid maxAage format ${maxAge}`);
    return getEpoch(type.toUpperCase(), parseInt(add), maxAge);
}
const _formatPath = (() => {
    const _exportPath = (server, path) => {
        if (path === "root")
            return server.getRoot();
        if (path === "public")
            return server.getPublicDirName();
        return undefined;
    };
    return (server, path, noCheck) => {
        if (/\$/gi.test(path) === false)
            return path;
        const absPath = _path.resolve(path.replace(/\$.+?\//gi, (m) => {
            m = m.replace(/\$/gi, "").replace(/\//gi, "");
            const epath = _exportPath(server, m.replace(/\$/gi, "").replace(/\//gi, ""));
            if (!epath) {
                throw new Error(`Invalid key ${m}`);
            }
            return `${epath}/`;
        }));
        if (noCheck === true)
            return absPath;
        if (!_fs.existsSync(absPath))
            throw new Error(`No file found\r\nPath:${absPath}\r\Request Path:${path}`);
        return absPath;
    };
})();
class ServerEncryption {
    constructor(inf) {
        this.cryptoInfo = inf;
    }
    encrypt(plainText) {
        return encryption_1.Encryption.encrypt(plainText, this.cryptoInfo);
    }
    decrypt(encryptedText) {
        return encryption_1.Encryption.decrypt(encryptedText, this.cryptoInfo);
    }
    encryptToHex(plainText) {
        return encryption_1.Encryption.encryptToHex(plainText, this.cryptoInfo);
    }
    decryptFromHex(encryptedText) {
        return encryption_1.Encryption.decryptFromHex(encryptedText, this.cryptoInfo);
    }
    encryptUri(plainText) {
        return encryption_1.Encryption.encryptUri(plainText, this.cryptoInfo);
    }
    decryptUri(encryptedText) {
        return encryption_1.Encryption.decryptUri(encryptedText, this.cryptoInfo);
    }
}
exports.ServerEncryption = ServerEncryption;
class ServerConfig {
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
    constructor() {
        throw new Error("Invalid initilization...");
    }
    static getRemoteAddress(ip) {
        let ipPart = ip.substring(0, ip.lastIndexOf('.'));
        if (!ipPart) {
            // assume local machine
            ipPart = "127.0.0";
        }
        return ipPart;
    }
    static createSession(req, sessionObj) {
        sessionObj.ipPart = this.getRemoteAddress(req.ip);
        return app_util_1.Util.JSON.stringify(sessionObj);
    }
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
    get version() {
        return server_core_1.appVersion;
    }
    get isInitilized() {
        return this._isInitilized;
    }
    get config() {
        return this._config;
    }
    get public() {
        return this._public;
    }
    get log() {
        return this._log;
    }
    get port() {
        return this._port;
    }
    get db() {
        return this._db;
    }
    get encryption() {
        return this._encryption;
    }
    get errorPage() {
        return this._errorPage;
    }
    constructor(appRoot, wwwName) {
        this._isInitilized = false;
        this._port = 0;
        this._log = Object.create(null);
        if (!wwwName) {
            if (process.env.IISNODE_VERSION) {
                throw new Error(`
web.config error.\r\nInvalid web.config defined.
Behind the <configuration> tag in your web.config add this
  <appSettings>
    <add key="your-iis-app-pool-id" value="your-app-root" />
  </appSettings>
your-app-root | directory name should be exists here
${appRoot}\\www_public
`);
            }
            throw new Error(`Argument missing.\r\ne.g. node server my_app_root.\r\nApp Root like your application root directory name...\r\nWhich should be exists here\r\n${appRoot}\\my_app_root`);
        }
        this._root = appRoot;
        this._public = wwwName.toString().trim();
        this._config = new ServerConfig();
        this._db = Object.create(null);
        const absPath = _path.resolve(`${this._root}/${this._public}/config/${this.getAppConfigName()}`);
        if (!_fs.existsSync(absPath))
            throw new Error(`No config file found in ${absPath}`);
        const config = fsw.readJsonSync(absPath);
        if (!config)
            throw new Error(`Invalid config file defined.\r\nConfig: ${absPath}`);
        schema_validator_1.Schema.Validate(config);
        if (this._public !== config.hostInfo.root) {
            throw new Error(`Server ready for App Root: ${this._public}.\r\nBut host_info root path is ${config.hostInfo.root}.\r\nApp Root like your application root directory name...`);
        }
        const libRoot = (0, app_util_1.getAppDir)();
        this._errorPage = {
            "404": _path.resolve(`${libRoot}/dist/error_page/404.html`),
            "401": _path.resolve(`${libRoot}/dist/error_page/401.html`),
            "500": _path.resolve(`${libRoot}/dist/error_page/500.html`)
        };
        app_util_1.Util.extend(this._config, config, true);
        this.implimentConfig(config);
        this._publicregx = new RegExp(`${this._public}/`, "gi");
        this._rootregx = new RegExp(this._root.replace(/\\/gi, '/'), "gi");
        // this.preRegx = new RegExp("<pre[^>]*>", "gi"); // /<pre[^>]*>/gi
        this._nodeModuleregx = new RegExp(`${this._root.replace(/\\/gi, '/').replace(/\/dist/gi, "")}/node_modules/`, "gi");
        this._userInteractive = false;
        this.initilize();
        this._encryption = new ServerEncryption(this._config.encryptionKey);
        fsw.mkdirSync(this.getPublic(), "/web/temp/cache/");
        this.on = Object.create(null);
        this.addVirtualDir = Object.create(null);
        this.virtualInfo = Object.create(null);
        this._config.bundler.tempPath = this.mapPath(this._config.bundler.tempPath);
        this._config.staticFile.tempPath = this.mapPath(this._config.staticFile.tempPath);
        this._log = new logger_1.ShadowLogger();
        return;
    }
    createVimContext() {
        return {};
    }
    updateEncryption(serverEnc) {
        if (this._encryption) {
            delete this._encryption;
        }
        if (serverEnc) {
            this._encryption = serverEnc;
        }
        else {
            this._encryption = new ServerEncryption(this._config.encryptionKey);
        }
    }
    getAppConfigName() {
        if (process.env.APP_CONFIG_NAME) {
            return process.env.APP_CONFIG_NAME;
        }
        return "app.config.json";
    }
    isValidContext(ctx) {
        return true;
    }
    getRoot() {
        return this._root;
    }
    parseMaxAge(maxAge) {
        return parseMaxAge(maxAge);
    }
    getPublic() {
        return `${this._root}/${this._public}`;
    }
    getPublicDirName() {
        return this._public;
    }
    init() {
        this._isInitilized = true;
    }
    implimentConfig(config) {
        if (typeof (this._config.bundler.reValidate) !== "boolean") {
            this._config.bundler.reValidate = true;
        }
        if (!config.encryptionKey)
            throw new Error("Security risk... encryption key required....");
        if (!app_util_1.Util.isArrayLike(config.hiddenDirectory)) {
            throw new Error('hidden_directory should be Array...');
        }
        if (process.env.IISNODE_VERSION && process.env.PORT) {
            this._port = process.env.PORT;
        }
        else {
            if (!this._config.hostInfo.port)
                throw new Error('Listener port required...');
            this._port = this._config.hostInfo.port;
        }
        this._config.encryptionKey = encryption_1.Encryption.updateCryptoKeyIV(config.encryptionKey);
        if (this._config.session) {
            if (!this._config.session.key)
                throw new Error("Security risk... Session encryption key required....");
            this._config.session.key = encryption_1.Encryption.updateCryptoKeyIV(config.session.key);
            if (!this._config.session.maxAge)
                config.session.maxAge = "1d";
            if (typeof (config.session.maxAge) !== "string")
                throw new Error(`Invalid maxAage format ${config.session.maxAge}. maxAge should "1d|1h|1m" formatted...`);
            this._config.session.maxAge = parseMaxAge(config.session.maxAge);
        }
        if (!this._config.cacheHeader) {
            throw new Error("cacheHeader information required...");
        }
        this._config.cacheHeader.maxAge = parseMaxAge(config.cacheHeader.maxAge);
    }
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
    initilize() {
        if (isDefined(this._config.database)) {
            if (!app_util_1.Util.isArrayLike(this._config.database))
                throw new Error("database cofig should be Array....");
            this._config.database.forEach((conf) => {
                if (!conf.module)
                    throw new Error("database module name requeired.");
                if (this._db[conf.module])
                    throw new Error(`database module ${conf.module} already exists.`);
                if (!conf.path)
                    throw new Error(`No path defined for module ${conf.module}`);
                conf.path = this.formatPath(conf.path);
                this._db[conf.module] = new (_importLocalAssets(conf.path))(conf.dbConn);
            });
        }
        if (!this._config.errorPage || (app_util_1.Util.isPlainObject(this._config.errorPage) && Object.keys(this._config.errorPage).length === 0)) {
            if (!this._config.errorPage)
                this._config.errorPage = {};
            for (const property in this._errorPage) {
                if (!Object.hasOwnProperty.call(this._config.errorPage, property)) {
                    this._config.errorPage[property] = this._errorPage[property];
                }
            }
        }
        else {
            if (app_util_1.Util.isPlainObject(this._config.errorPage) === false)
                throw new Error("errorPage property should be Object.");
            for (const property in this._config.errorPage) {
                if (Object.hasOwnProperty.call(this._config.errorPage, property)) {
                    const path = this._config.errorPage[property];
                    if (path) {
                        const code = parseInt(property);
                        const statusCode = http_status_1.HttpStatus.fromPath(path, code);
                        if (!statusCode || statusCode !== code || !http_status_1.HttpStatus.isErrorCode(statusCode)) {
                            throw new Error(`Invalid Server/Client error page... ${path} and code ${code}}`);
                        }
                        this._config.errorPage[property] = this.formatPath(path);
                    }
                }
            }
            for (const property in this._errorPage) {
                if (!Object.hasOwnProperty.call(this._config.errorPage, property)) {
                    this._config.errorPage[property] = this._errorPage[property];
                }
            }
        }
        this._config.views.forEach((path, index) => {
            this._config.views[index] = this.formatPath(path);
        });
    }
    copyright() {
        return '//\tCopyright (c) 2022 FSys Tech Ltd.\r\n';
    }
    createContext(req, res, next) {
        const context = context_1._ctxManager.getContext(this, req, res);
        context.path = req.path;
        context.root = context.path;
        context.next = next;
        context.extension = app_util_1.Util.getExtension(context.path) || "";
        return context;
    }
    setDefaultProtectionHeader(res) {
        res.setHeader('x-timestamp', Date.now());
        res.setHeader('x-xss-protection', '1; mode=block');
        res.setHeader('x-content-type-options', 'nosniff');
        res.setHeader('x-frame-options', 'sameorigin');
        if (this._config.hostInfo.frameAncestors) {
            res.setHeader('content-security-policy', `frame-ancestors ${this._config.hostInfo.frameAncestors}`);
        }
        if (this._config.session.isSecure) {
            res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
            if (this._config.hostInfo.hostName && this._config.hostInfo.hostName.length > 0) {
                res.setHeader('expect-ct', `max-age=0, report-uri="https://${this._config.hostInfo.hostName}/report/?ct=browser&version=${server_core_1.appVersion}`);
            }
        }
    }
    parseSession(headers, cook) {
        if (!this._config.session.cookie || this._config.session.cookie.length === 0)
            throw Error("You are unable to add session without session config. see your app_config.json");
        const session = new app_static_2.Session();
        const cookies = (0, help_1.parseCookie)(cook);
        const value = cookies[this._config.session.cookie];
        if (!value)
            return session;
        const str = encryption_1.Encryption.decryptFromHex(value, this._config.session.key);
        if (!str) {
            return session;
        }
        // Util.extend(session, Util.JSON.parse(str));
        // session.isAuthenticated = true;
        // return session;
        return session.parse(str);
    }
    setSession(ctx, loginId, roleId, userData) {
        return ctx.res.cookie(this._config.session.cookie, encryption_1.Encryption.encryptToHex(SessionSecurity.createSession(ctx.req, {
            loginId, roleId, userData
        }), this._config.session.key), {
            maxAge: this._config.session.maxAge,
            httpOnly: true,
            secure: this._config.session.isSecure
        }), true;
    }
    passError(ctx) {
        if (!ctx.error)
            return false;
        if (!this._config.isDebug) {
            return ctx.res.status(500).send("Internal error occured. Please try again."), true;
        }
        // ctx.error.replace(this.preRegx, "")
        const msg = this.escape(ctx.error.replace(/\\/gi, "/").replace(this._rootregx, "$root").replace(this._publicregx, "$public/"));
        return ctx.res.status(500).send(`<pre>${msg}</pre>`), true;
    }
    getErrorPath(statusCode, tryServer) {
        if (!http_status_1.HttpStatus.isErrorCode(statusCode)) {
            throw new Error(`Invalid http error status code ${statusCode}`);
        }
        const cstatusCode = String(statusCode);
        if (tryServer) {
            if (this._errorPage[cstatusCode]) {
                return this._errorPage[cstatusCode];
            }
            return void 0;
        }
        if (this._config.errorPage[cstatusCode]) {
            return this._config.errorPage[cstatusCode];
        }
        if (this._errorPage[cstatusCode]) {
            return this._errorPage[cstatusCode];
        }
        throw new Error(`No error page found in app.config.json->errorPage[${cstatusCode}]`);
    }
    transferRequest(ctx, path, status) {
        if (!ctx)
            throw new Error("Invalid argument defined...");
        if (!ctx.isDisposed) {
            if (!status)
                status = http_status_1.HttpStatus.getResInfo(path, 200);
            if (!status.isErrorCode && typeof (path) !== "string") {
                throw new Error("Path should be string...");
            }
            if (status.isErrorCode) {
                if (ctx.req.get('x-requested-with') === 'XMLHttpRequest') {
                    return ctx.res.status(status.code).type("text").noCache().send(`${ctx.req.method} : ${ctx.req.path} ${status.description}\n${ctx.error}`);
                }
            }
            let nextPath;
            let tryServer = false;
            if (status.isErrorCode) {
                ctx.res.noCache();
                if (status.isInternalErrorCode && ctx.errorPage.indexOf("\\dist\\error_page\\500") > -1) {
                    return this.passError(ctx), void 0;
                }
                if (status.code === ctx.errorCode) {
                    tryServer = true;
                }
                else {
                    ctx.errorCode = status.code;
                }
            }
            nextPath = typeof (path) === "string" ? path : this.getErrorPath(path, tryServer);
            if (!nextPath) {
                return this.passError(ctx), void 0;
            }
            if (status.isErrorCode && status.isInternalErrorCode === false) {
                this.addError(ctx, `${status.code} ${status.description}`);
            }
            if (status.isErrorCode) {
                ctx.errorPage = _path.resolve(nextPath);
                if (ctx.errorPage.indexOf("\\dist\\error_page\\") > -1) {
                    ctx.path = `/cwserver/error_page/${status.code}`;
                }
                else {
                    ctx.path = `/error/${status.code}`;
                }
            }
            return ctx.res.render(ctx, nextPath, status);
        }
    }
    mapPath(path) {
        return _path.resolve(`${this._root}/${this._public}/${path}`);
    }
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
    addError(ctx, ex) {
        ctx.path = this.pathToUrl(ctx.path);
        if (!ctx.error) {
            ctx.error = `Error occured in ${ctx.path}`;
        }
        else {
            ctx.error += `\r\n\r\nNext Error occured in ${ctx.path}`;
        }
        if (!ctx.server.config.isDebug)
            return ctx;
        if (typeof (ex) === "string") {
            ctx.error += " " + ex;
        }
        else {
            ctx.error += "\r\n" + ex.message;
            ctx.error += "\r\n" + ex.stack;
        }
        ctx.error = ctx.error
            .replace(/\\/gi, '/')
            .replace(this._rootregx, "$root")
            .replace(this._publicregx, "$public/")
            .replace(this._nodeModuleregx, "$engine/");
        return ctx;
    }
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
    formatPath(path, noCheck) {
        return _formatPath(this, path, noCheck);
    }
    createBundle(str) {
        if (!str)
            throw new Error("No string found to create bundle...");
        return encryption_1.Encryption.encryptUri(str, this._config.encryptionKey);
    }
    addMimeType(extension, val) {
        return http_mime_types_1._mimeType.add(extension, val);
    }
}
exports.CwServer = CwServer;
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
    function initilize() {
        if (_server.isInitilized) {
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
            const v = _virtualDir.find((a) => a.route === route);
            if (!v)
                return void 0;
            return {
                route: v.route,
                root: v.root
            };
        };
        _server.addVirtualDir = (route, root, evt) => {
            if (route.indexOf(":") > -1 || route.indexOf("*") > -1)
                throw new Error(`Unsupported symbol defined. ${route}`);
            const neRoute = route;
            if (_virtualDir.some((a) => a.route === neRoute))
                throw new Error(`You already add this virtual route ${route}`);
            route += route.charAt(route.length - 1) !== "/" ? "/" : "";
            route += "*";
            const _processHandler = (req, res, next, forWord) => {
                const _ctx = _server.createContext(req, res, next);
                const _next = next;
                _ctx.next = (code, transfer) => {
                    if (!code || code === 200)
                        return;
                    return _process.render(code, _ctx, _next, transfer);
                };
                if (!_server.isValidContext(_ctx)) {
                    return;
                }
                return fsw.isExists(`${root}/${_ctx.path}`, (exists, url) => {
                    if (!exists)
                        return _ctx.next(404);
                    return forWord(_ctx);
                });
            };
            if (!evt || typeof (evt) !== "function") {
                _app.use(route, (req, res, next) => {
                    _processHandler(req, res, next, (ctx) => {
                        if (_server.config.mimeType.indexOf(ctx.extension) > -1) {
                            return _controller.httpMimeHandler.render(ctx, root);
                        }
                        return ctx.next(404);
                    });
                }, true);
            }
            else {
                _app.use(route, (req, res, next) => {
                    _processHandler(req, res, next, (ctx) => {
                        _server.log.success(`Send ${200} ${route}${req.path}`);
                        return evt(ctx);
                    });
                }, true);
            }
            return _virtualDir.push({
                route: neRoute,
                root
            }), void 0;
        };
        if (_server.config.bundler && _server.config.bundler.enable) {
            const { Bundler } = require("./app-bundler");
            Bundler.Init(_app, _controller, _server);
        }
        if (app_util_1.Util.isArrayLike(_server.config.views)) {
            _server.config.views.forEach(path => _importLocalAssets(path));
        }
        app_view_1.AppView.init(_app, _controller, _server);
        _controller.sort();
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
        _app.prerequisites((req, res, next) => {
            req.session = _server.parseSession(req.headers, req.cookies);
            SessionSecurity.isValidSession(req);
            return next();
        });
        _app.use((req, res, next) => {
            const context = _process.createContext(req, res, next);
            const reqPath = req.path;
            if (_server.config.hiddenDirectory.some((a) => {
                return reqPath.substring(0, a.length) === a;
            })) {
                _server.log.write(`Trying to access Hidden directory. Remote Adress ${req.ip} Send 404 ${req.path}`);
                return _server.transferRequest(context, 404);
            }
            if (reqPath.indexOf('$root') > -1 || reqPath.indexOf('$public') > -1) {
                _server.log.write(`Trying to access directly reserved keyword ( $root | $public ). Remote Adress ${req.ip} Send 404 ${req.path}`);
                return _server.transferRequest(context, 404);
            }
            try {
                if (_server.isValidContext(context)) {
                    return _controller.processAny(context);
                }
            }
            catch (ex) {
                return _server.transferRequest(_server.addError(context, ex), 500);
            }
        });
        _server.init();
        return _app;
    }
    ;
    app_view_1.AppView.isInitilized = true;
    return {
        init: initilize,
        get public() { return _server.public; },
        get port() { return _server.port; },
        get log() { return _server.log; },
        get socketPath() { return (0, app_static_1.toString)(_server.config.socketPath); },
        get server() { return _server; },
        get controller() { return _controller; }
    };
}
//# sourceMappingURL=server.js.map