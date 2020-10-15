"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.initilizeServer = exports.SowServer = exports.ServerConfig = exports.Context = exports.ServerEncryption = exports.getMyContext = exports.getContext = exports.removeContext = exports.disposeContext = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:13 PM 5/2/2020
const sow_static_1 = require("./sow-static");
const sow_server_core_1 = require("./sow-server-core");
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const fsw = __importStar(require("./sow-fsw"));
const sow_util_1 = require("./sow-util");
const sow_schema_validator_1 = require("./sow-schema-validator");
const sow_static_2 = require("./sow-static");
const sow_controller_1 = require("./sow-controller");
const sow_encryption_1 = require("./sow-encryption");
const sow_http_status_1 = require("./sow-http-status");
const sow_logger_1 = require("./sow-logger");
// -------------------------------------------------------
_a = (() => {
    const _curContext = {};
    return {
        disposeContext(ctx) {
            const reqId = ctx.dispose();
            if (reqId) {
                if (_curContext[reqId]) {
                    delete _curContext[reqId];
                }
            }
            return void 0;
        },
        getMyContext(id) {
            const ctx = _curContext[id];
            if (!ctx)
                return;
            return ctx;
        },
        removeContext(id) {
            const ctx = _curContext[id];
            if (!ctx)
                return;
            exports.disposeContext(ctx);
            return void 0;
        },
        getContext(server, req, res) {
            if (_curContext[req.id])
                return _curContext[req.id];
            const context = new Context(server, req, res);
            _curContext[req.id] = context;
            return context;
        }
    };
})(), exports.disposeContext = _a.disposeContext, exports.removeContext = _a.removeContext, exports.getContext = _a.getContext, exports.getMyContext = _a.getMyContext;
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
    const _exportObj = (server, name) => {
        if (name === "root")
            return { value: server.getRoot() };
        if (name === "public")
            return { value: server.getPublicDirName() };
        return { value: void 0 };
    };
    return (server, name, noCheck) => {
        if (/\$/gi.test(name) === false)
            return name;
        const absPath = _path.resolve(name.replace(/\$.+?\//gi, (m) => {
            m = m.replace(/\$/gi, "").replace(/\//gi, "");
            const rs = _exportObj(server, m.replace(/\$/gi, "").replace(/\//gi, ""));
            if (!rs.value) {
                throw new Error(`Invalid key ${m}`);
            }
            return `${rs.value}/`;
        }));
        if (noCheck === true)
            return absPath;
        if (!_fs.existsSync(absPath))
            throw new Error(`No file found\r\nPath:${absPath}\r\nName:${name}`);
        return absPath;
    };
})();
class ServerEncryption {
    constructor(inf) {
        this.cryptoInfo = inf;
    }
    encrypt(plainText) {
        return sow_encryption_1.Encryption.encrypt(plainText, this.cryptoInfo);
    }
    decrypt(encryptedText) {
        return sow_encryption_1.Encryption.decrypt(encryptedText, this.cryptoInfo);
    }
    encryptToHex(plainText) {
        return sow_encryption_1.Encryption.encryptToHex(plainText, this.cryptoInfo);
    }
    decryptFromHex(encryptedText) {
        return sow_encryption_1.Encryption.decryptFromHex(encryptedText, this.cryptoInfo);
    }
    encryptUri(plainText) {
        return sow_encryption_1.Encryption.encryptUri(plainText, this.cryptoInfo);
    }
    decryptUri(encryptedText) {
        return sow_encryption_1.Encryption.decryptUri(encryptedText, this.cryptoInfo);
    }
}
exports.ServerEncryption = ServerEncryption;
class Context {
    constructor(server, req, res) {
        this._isDisposed = false;
        this.error = void 0;
        this.path = "";
        this.root = "";
        this._res = res;
        this._req = req;
        this._server = server;
        this.extension = "";
        this.errorPage = "";
        this.errorCode = 0;
    }
    get isDisposed() {
        return this._isDisposed;
    }
    get res() {
        return this._res;
    }
    get req() {
        return this._req;
    }
    get session() {
        return this._req.session;
    }
    get server() {
        return this._server;
    }
    get next() {
        if (!this._isDisposed && this._next)
            return this._next;
        return (code, transfer) => {
            // Unreachable....
            console.log('Warning: `context already destroyed or "next" function doesn\'t set yet`');
        };
    }
    set next(val) {
        this._next = val;
    }
    transferError(err) {
        if (!this._isDisposed) {
            this._server.addError(this, err);
            return this._server.transferRequest(this, 500);
        }
    }
    handleError(err, next) {
        if (!this._isDisposed && !this._res.headersSent) {
            if (sow_util_1.Util.isError(err)) {
                return this.transferError(err);
            }
            return next();
        }
        // Nothing to do, context destroyed or response header already been sent
    }
    redirect(url, force) {
        if (!this._isDisposed) {
            this._res.status(302).redirect(url, force);
        }
        return this;
    }
    write(chunk) {
        if (!this._isDisposed) {
            return this._res.write(chunk), void 0;
        }
    }
    transferRequest(path) {
        if (!this._isDisposed) {
            return this._server.transferRequest(this, path);
        }
    }
    signOut() {
        if (!this._isDisposed) {
            this._res.cookie(this._server.config.session.cookie, "", {
                expires: -1
            });
        }
        return this;
    }
    setSession(loginId, roleId, userData) {
        if (!this._isDisposed) {
            this._server.setSession(this, loginId, roleId, userData);
        }
        return this;
    }
    dispose() {
        if (this._isDisposed)
            return void 0;
        this._isDisposed = true;
        delete this._next;
        const id = this._req.id;
        // @ts-ignore
        delete this._server;
        delete this.path;
        // @ts-ignore
        this._res.dispose();
        delete this._res;
        // @ts-ignore
        this._req.dispose();
        delete this._req;
        // @ts-ignore
        delete this.extension;
        delete this.root;
        delete this.servedFrom;
        delete this.error;
        return id;
    }
}
exports.Context = Context;
class ServerConfig {
    constructor() {
        this.Author = "Safe Online World Ltd.";
        this.appName = "Sow Server";
        this.version = "0.0.1";
        this.packageVersion = "101";
        this.isDebug = true;
        this.encryptionKey = Object.create(null);
        this.session = {
            "cookie": "_sow_session",
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
            fileCache: false
        };
        this.cacheHeader = {
            maxAge: parseMaxAge("30D"),
            serverRevalidate: true
        };
        this.liveStream = [];
        this.noCache = [];
        this.bundler = {
            enable: true,
            fileCache: true,
            route: "/app/api/bundle/",
            compress: true
        };
    }
}
exports.ServerConfig = ServerConfig;
class SowServer {
    constructor(appRoot, wwwName) {
        this._port = 0;
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
        this.root = appRoot;
        this._public = wwwName.toString();
        this._config = new ServerConfig();
        this._db = {};
        const absPath = _path.resolve(`${this.root}/${this.public}/config/app.config.json`);
        if (!_fs.existsSync(absPath)) {
            throw new Error(`No config file found in ${absPath}`);
        }
        const config = fsw.readJsonSync(absPath);
        if (!config) {
            throw new Error(`Invalid config file defined.\r\nConfig: ${absPath}`);
        }
        sow_schema_validator_1.Schema.Validate(config);
        // if ( config.hasOwnProperty( "Author" ) ) throw _Error( "You should not set Author property..." );
        if (this.public !== config.hostInfo.root) {
            throw new Error(`Server ready for App Root: ${this.public}.\r\nBut host_info root path is ${config.hostInfo.root}.\r\nApp Root like your application root directory name...`);
        }
        const libRoot = sow_util_1.getLibRoot();
        this._errorPage = {
            "404": _path.resolve(`${libRoot}/dist/error_page/404.html`),
            "401": _path.resolve(`${libRoot}/dist/error_page/401.html`),
            "500": _path.resolve(`${libRoot}/dist/error_page/500.html`)
        };
        sow_util_1.Util.extend(this.config, config, true);
        this.implimentConfig(config);
        this.rootregx = new RegExp(this.root.replace(/\\/gi, '/'), "gi");
        this.publicregx = new RegExp(`${this.public}/`, "gi");
        this.nodeModuleregx = new RegExp(`${this.root.replace(/\\/gi, '/').replace(/\/dist/gi, "")}/node_modules/express/`, "gi");
        this.userInteractive = process.env.IISNODE_VERSION || process.env.PORT ? false : true;
        this.initilize();
        this._log = new sow_logger_1.Logger(`./log/`, this.public, void 0, this.userInteractive, this.config.isDebug);
        this._encryption = new ServerEncryption(this.config.encryptionKey);
        fsw.mkdirSync(this.getPublic(), "/web/temp/cache/");
        this.on = Object.create(null);
        this.addVirtualDir = Object.create(null);
        this.virtualInfo = Object.create(null);
        return;
    }
    get version() {
        return sow_server_core_1.appVersion;
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
    getRoot() {
        return this.root;
    }
    parseMaxAge(maxAge) {
        return parseMaxAge(maxAge);
    }
    getPublic() {
        return `${this.root}/${this.public}`;
    }
    getPublicDirName() {
        return this.public;
    }
    implimentConfig(config) {
        if (!config.encryptionKey)
            throw new Error("Security risk... encryption key required....");
        if (!sow_util_1.Util.isArrayLike(config.hiddenDirectory)) {
            throw new Error('hidden_directory should be Array...');
        }
        if (process.env.IISNODE_VERSION && process.env.PORT) {
            this._port = process.env.PORT;
        }
        else {
            if (!this.config.hostInfo.port)
                throw new Error('Listener port required...');
            this._port = this.config.hostInfo.port;
        }
        this.config.encryptionKey = sow_encryption_1.Encryption.updateCryptoKeyIV(config.encryptionKey);
        if (this.config.session) {
            if (!this.config.session.key)
                throw new Error("Security risk... Session encryption key required....");
            this.config.session.key = sow_encryption_1.Encryption.updateCryptoKeyIV(config.session.key);
            if (!this.config.session.maxAge)
                config.session.maxAge = "1d";
            if (typeof (config.session.maxAge) !== "string")
                throw new Error(`Invalid maxAage format ${config.session.maxAge}. maxAge should "1d|1h|1m" formatted...`);
            this.config.session.maxAge = parseMaxAge(config.session.maxAge);
        }
        if (!this.config.cacheHeader) {
            throw new Error("cacheHeader information required...");
        }
        this.config.cacheHeader.maxAge = parseMaxAge(config.cacheHeader.maxAge);
    }
    initilize() {
        if (isDefined(this.config.database)) {
            if (!sow_util_1.Util.isArrayLike(this.config.database))
                throw new Error("database cofig should be Array....");
            this.config.database.forEach((conf) => {
                if (!conf.module)
                    throw new Error("database module name requeired.");
                if (this._db[conf.module])
                    throw new Error(`database module ${conf.module} already exists.`);
                if (!conf.path)
                    throw new Error(`No path defined for module ${conf.module}`);
                conf.path = this.formatPath(conf.path);
                this._db[conf.module] = new (require(conf.path))(conf.dbConn);
            });
        }
        if (!this.config.errorPage || (sow_util_1.Util.isPlainObject(this.config.errorPage) && Object.keys(this.config.errorPage).length === 0)) {
            if (!this.config.errorPage)
                this.config.errorPage = {};
            for (const property in this.errorPage) {
                if (!Object.hasOwnProperty.call(this.config.errorPage, property)) {
                    this.config.errorPage[property] = this.errorPage[property];
                }
            }
        }
        else {
            if (sow_util_1.Util.isPlainObject(this.config.errorPage) === false)
                throw new Error("errorPage property should be Object.");
            for (const property in this.config.errorPage) {
                if (Object.hasOwnProperty.call(this.config.errorPage, property)) {
                    const path = this.config.errorPage[property];
                    if (path) {
                        const code = parseInt(property);
                        const statusCode = sow_http_status_1.HttpStatus.fromPath(path, code);
                        if (!statusCode || statusCode !== code || !sow_http_status_1.HttpStatus.isErrorCode(statusCode)) {
                            throw new Error(`Invalid Server/Client error page... ${path} and code ${code}}`);
                        }
                        this.config.errorPage[property] = this.formatPath(path);
                    }
                }
            }
            for (const property in this.errorPage) {
                if (!Object.hasOwnProperty.call(this.config.errorPage, property)) {
                    this.config.errorPage[property] = this.errorPage[property];
                }
            }
        }
        this.config.views.forEach((name, index) => {
            this.config.views[index] = this.formatPath(name);
        });
    }
    copyright() {
        return '/*Copyright( c ) 2018, Sow ( https://safeonline.world, https://www.facebook.com/safeonlineworld, mssclang@outlook.com, https://github.com/safeonlineworld/cwserver). All rights reserved*/\r\n';
    }
    createContext(req, res, next) {
        const _context = exports.getContext(this, req, res);
        _context.path = req.path;
        _context.root = _context.path;
        _context.next = next;
        _context.extension = sow_util_1.Util.getExtension(_context.path) || "";
        return _context;
    }
    setDefaultProtectionHeader(res) {
        res.setHeader('x-timestamp', Date.now());
        res.setHeader('x-xss-protection', '1; mode=block');
        res.setHeader('x-content-type-options', 'nosniff');
        res.setHeader('x-frame-options', 'sameorigin');
        if (this.config.hostInfo.frameAncestors) {
            res.setHeader('content-security-policy', `frame-ancestors ${this.config.hostInfo.frameAncestors}`);
        }
        if (this.config.session.isSecure) {
            res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
            if (this.config.hostInfo.hostName && this.config.hostInfo.hostName.length > 0) {
                res.setHeader('expect-ct', `max-age=0, report-uri="https://${this.config.hostInfo.hostName}/report/?ct=browser&version=${sow_server_core_1.appVersion}`);
            }
        }
    }
    parseSession(cook) {
        if (!this.config.session.cookie || this.config.session.cookie.length === 0)
            throw Error("You are unable to add session without session config. see your app_config.json");
        const session = new sow_static_2.Session();
        const cookies = sow_server_core_1.parseCookie(cook);
        const value = cookies[this.config.session.cookie];
        if (!value)
            return session;
        const str = sow_encryption_1.Encryption.decryptFromHex(value, this.config.session.key);
        if (!str) {
            return session;
        }
        sow_util_1.Util.extend(session, JSON.parse(str));
        session.isAuthenticated = true;
        return session;
    }
    setSession(ctx, loginId, roleId, userData) {
        return ctx.res.cookie(this.config.session.cookie, sow_encryption_1.Encryption.encryptToHex(JSON.stringify({
            loginId, roleId, userData
        }), this.config.session.key), {
            maxAge: this.config.session.maxAge,
            httpOnly: true,
            secure: this.config.session.isSecure
        }), true;
    }
    passError(ctx) {
        if (!ctx.error) {
            return false;
        }
        const msg = `<pre>${this.escape(ctx.error.replace(/<pre[^>]*>/gi, "").replace(/\\/gi, '/').replace(this.rootregx, "$root").replace(this.publicregx, "$public/"))}</pre>`;
        return ctx.res.status(500).send(msg), true;
    }
    getErrorPath(statusCode, tryServer) {
        if (!sow_http_status_1.HttpStatus.isErrorCode(statusCode)) {
            throw new Error(`Invalid http error status code ${statusCode}`);
        }
        const cstatusCode = String(statusCode);
        if (tryServer) {
            if (this.errorPage[cstatusCode]) {
                return this.errorPage[cstatusCode];
            }
            return void 0;
        }
        if (this.config.errorPage[cstatusCode]) {
            return this.config.errorPage[cstatusCode];
        }
        if (this.errorPage[cstatusCode]) {
            return this.errorPage[cstatusCode];
        }
        throw new Error(`No error page found in app.config.json->errorPage[${cstatusCode}]`);
    }
    transferRequest(ctx, path, status) {
        if (!ctx)
            throw new Error("Invalid argument defined...");
        if (!ctx.isDisposed) {
            if (!status)
                status = sow_http_status_1.HttpStatus.getResInfo(path, 200);
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
        return _path.resolve(`${this.root}/${this.public}/${path}`);
    }
    pathToUrl(path) {
        if (!sow_util_1.Util.getExtension(path))
            return path;
        let index = path.indexOf(this.public);
        if (index === 0)
            return path;
        if (index > 0) {
            path = path.substring(path.indexOf(this.public) + this.public.length);
        }
        else {
            path = path.replace(this.rootregx, "/$root");
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
        if (typeof (ex) === "string") {
            ctx.error += " " + ex;
        }
        else {
            ctx.error += "\r\n" + ex.stack;
        }
        ctx.error = ctx.error
            .replace(/\\/gi, '/')
            .replace(this.rootregx, "$root")
            .replace(this.publicregx, "$public/")
            .replace(this.nodeModuleregx, "$engine/");
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
    formatPath(name, noCheck) {
        return _formatPath(this, name, noCheck);
    }
    createBundle(str) {
        if (!str)
            throw new Error("No string found to create bundle...");
        return sow_encryption_1.Encryption.encryptUri(str, this.config.encryptionKey);
    }
    addMimeType(extension, val) {
        return global.sow.HttpMime.add(extension, val);
    }
}
exports.SowServer = SowServer;
function initilizeServer(appRoot, wwwName) {
    if (global.sow.isInitilized)
        throw new Error("Server instance can initilize 1 time...");
    const _server = new SowServer(appRoot, wwwName);
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
                || !sow_http_status_1.HttpStatus.isErrorCode(code)) {
                return void 0;
            }
            return _server.transferRequest(ctx, code);
        },
        createContext: (req, res, next) => {
            const _context = _server.createContext(req, res, next);
            const _next = _context.next;
            _context.next = (code, transfer) => {
                // if ( code && code === -404 ) return next();
                return _process.render(code, _context, _next, transfer);
            };
            return _context;
        }
    };
    const _controller = new sow_controller_1.Controller();
    function initilize() {
        const _app = sow_server_core_1.App();
        _server.on = (ev, handler) => {
            _app.on(ev, handler);
        };
        if (_server.config.isDebug) {
            _app.on("request-begain", (req) => {
                _server.log.success(`${req.method} ${req.path}`);
            });
        }
        _app.on("response-end", (req, res) => {
            if (_server.config.isDebug) {
                const ctx = exports.getMyContext(req.id);
                if (ctx && !ctx.isDisposed) {
                    if (res.statusCode && sow_http_status_1.HttpStatus.isErrorCode(res.statusCode)) {
                        _server.log.error(`Send ${res.statusCode} ${ctx.path}`);
                    }
                    else {
                        _server.log.success(`Send ${res.statusCode} ${ctx.path}`);
                    }
                }
            }
            return exports.removeContext(req.id);
        });
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
                            return _controller.httpMimeHandler.render(ctx, root, false);
                        }
                        return ctx.next(404);
                    });
                }, true);
            }
            else {
                _app.use(route, (req, res, next) => {
                    _processHandler(req, res, next, (ctx) => {
                        _server.log.success(`Send ${200} ${route}${req.path}`).reset();
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
            const { Bundler } = require("./sow-bundler");
            Bundler.Init(_app, _controller, _server);
        }
        if (_server.config.views) {
            _server.config.views.forEach((a, _index, _array) => {
                require(a);
            });
        }
        global.sow.server.emit("register-view", _app, _controller, _server);
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
            req.session = _server.parseSession(req.cookies);
            return next();
        });
        _app.use((req, res, next) => {
            const _context = _process.createContext(req, res, next);
            const reqPath = req.path;
            if (_server.config.hiddenDirectory.some((a) => {
                return reqPath.substring(0, a.length) === a;
            })) {
                _server.log.write(`Trying to access Hidden directory. Remote Adress ${req.ip} Send 404 ${req.path}`).reset();
                return _server.transferRequest(_context, 404);
            }
            if (reqPath.indexOf('$root') > -1 || reqPath.indexOf('$public') > -1) {
                _server.log.write(`Trying to access directly reserved keyword ( $root | $public ). Remote Adress ${req.ip} Send 404 ${req.path}`).reset();
                return _server.transferRequest(_context, 404);
            }
            try {
                return _controller.processAny(_context);
            }
            catch (ex) {
                return _server.transferRequest(_server.addError(_context, ex), 500);
            }
        });
        return _app;
    }
    ;
    global.sow.isInitilized = true;
    return {
        init: initilize,
        get public() { return _server.public; },
        get port() { return _server.port; },
        get log() { return _server.log; },
        get socketPath() { return sow_static_1.toString(_server.config.socketPath); },
        get server() { return _server; },
        get controller() { return _controller; }
    };
}
exports.initilizeServer = initilizeServer;
//# sourceMappingURL=sow-server.js.map