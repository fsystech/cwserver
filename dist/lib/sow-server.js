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
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initilizeServer = exports.SowServer = exports.ServerConfig = exports.Context = exports.ServerEncryption = void 0;
const sow_server_core_1 = require("./sow-server-core");
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const sow_util_1 = require("./sow-util");
const sow_schema_validator_1 = require("./sow-schema-validator");
const sow_static_1 = require("./sow-static");
const sow_controller_1 = require("./sow-controller");
const sow_encryption_1 = require("./sow-encryption");
const sow_http_status_1 = require("./sow-http-status");
const sow_logger_1 = require("./sow-logger");
// -------------------------------------------------------
// const _Error = ( msg: string ): Error => {
//    if ( process.env.SCRIPT === "TS" ) return new Error( msg );
//    if ( process.env.IISNODE_VERSION || process.env.PORT ) {
//        console.log( msg );
//    } else {
//        console.log( '\x1b[31m', msg );
//        console.log( '\x1b[0m' );
//    }
//    return new Error( msg );
// }
const cleanContext = (ctx) => {
    delete ctx.server;
    delete ctx.res;
    delete ctx.req;
    delete ctx.path;
    delete ctx.extension;
    delete ctx.root;
    delete ctx.session;
    delete ctx.servedFrom;
    delete ctx.error;
};
function isDefined(a) {
    return a !== null && a !== undefined;
}
const parseMaxAge = (maxAge) => {
    if (typeof (maxAge) !== "string")
        throw new Error(`Invalid maxAage...`);
    let add = 0;
    const length = maxAge.length;
    const type = maxAge.charAt(length - 1).toUpperCase();
    // tslint:disable-next-line: radix
    add = parseInt(maxAge.substring(0, length - 1));
    if (isNaN(add))
        throw new Error(`Invalid maxAage format ${maxAge}`);
    switch (type) {
        case "D": return ((24 * add) * 60 * 60 * 1000);
        case "H": return (add * 60 * 60 * 1000);
        case "M": return (add * 60 * 1000);
        default: throw new Error(`Invalid maxAage format ${maxAge}`);
    }
};
const _formatPath = (() => {
    const _exportObj = (server, name) => {
        if (!name || typeof (name) !== 'string')
            return { value: void 0 };
        const parts = name.split('.');
        let value = void 0;
        // tslint:disable-next-line: no-conditional-assignment
        for (let part; parts.length && (part = parts.shift());) {
            if (value) {
                if (part in value) {
                    value = value[part];
                }
                continue;
            }
            if (part in server)
                value = server[part];
            continue;
        }
        return {
            value: typeof (value) === "string" ? value : void 0,
            name
        };
    };
    return (server, name) => {
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
        if (!_fs.existsSync(absPath))
            throw new Error(`No file found\r\nPath:${absPath}\r\nName:${name}`);
        return absPath;
    };
})();
// tslint:disable-next-line: max-classes-per-file
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
// tslint:disable-next-line: max-classes-per-file
class Context {
    constructor(_server, _req, _res, _session) {
        this.error = void 0;
        this.path = "";
        this.root = "";
        this.res = _res;
        this.req = _req;
        this.server = _server;
        this.session = _session;
        this.extension = "";
        this.next = Object.create(null);
    }
    redirect(url) {
        return this.res.status(301).redirect(url), void 0;
    }
    write(str) {
        return this.res.write(str), void 0;
    }
    transferRequest(path) {
        const status = sow_http_status_1.HttpStatus.getResInfo(path, 200);
        this.server.log[status.isErrorCode ? "error" : "success"](`Send ${status.code} ${this.req.path}`).reset();
        return this.server.transferRequest(this, path, status);
    }
}
exports.Context = Context;
// tslint:disable-next-line: max-classes-per-file
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
            cacheType: "FILE"
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
            maxAge: 2592000000,
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
// tslint:disable-next-line: max-classes-per-file
class SowServer {
    constructor(appRoot, wwwName) {
        this.port = 0;
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
        this.public = wwwName.toString();
        this.config = new ServerConfig();
        this.db = {};
        const absPath = _path.resolve(`${this.root}/${this.public}/config/app.config.json`);
        if (!_fs.existsSync(absPath)) {
            throw new Error(`No config file found in ${absPath}`);
        }
        const config = sow_util_1.Util.readJsonAsync(absPath);
        if (!config) {
            throw new Error(`Invalid config file defined.\r\nConfig: ${absPath}`);
        }
        sow_schema_validator_1.Schema.Validate(config);
        // if ( config.hasOwnProperty( "Author" ) ) throw _Error( "You should not set Author property..." );
        if (this.public !== config.hostInfo.root) {
            throw new Error(`Server ready for App Root: ${this.public}.\r\nBut host_info root path is ${config.hostInfo.root}.\r\nApp Root like your application root directory name...`);
        }
        const myParent = process.env.SCRIPT === "TS" ? _path.join(_path.resolve(__dirname, '..'), "/dist/") : _path.resolve(__dirname, '..');
        this.errorPage = {
            "404": _path.resolve(`${myParent}/error_page/404.html`),
            "401": _path.resolve(`${myParent}/error_page/401.html`),
            "500": _path.resolve(`${myParent}/error_page/500.html`)
        };
        sow_util_1.Util.extend(this.config, config, true);
        this.implimentConfig(config);
        this.rootregx = new RegExp(this.root.replace(/\\/gi, '/'), "gi");
        this.publicregx = new RegExp(`${this.public}/`, "gi");
        // _path.dirname( "node_modules" );
        this.nodeModuleregx = new RegExp(`${this.root.replace(/\\/gi, '/').replace(/\/dist/gi, "")}/node_modules/express/`, "gi");
        this.userInteractive = process.env.IISNODE_VERSION || process.env.PORT ? false : true;
        this.initilize();
        this.log = new sow_logger_1.Logger(`./log/`, this.public, void 0, this.userInteractive, this.config.isDebug);
        this.encryption = new ServerEncryption(this.config.encryptionKey);
        return;
    }
    on(ev, handler) {
        throw new Error("Method not implemented.");
    }
    getHttpServer() {
        throw new Error("Method not implemented.");
    }
    getRoot() {
        return this.root;
    }
    getPublic() {
        return `${this.root}/${this.public}`;
    }
    implimentConfig(config) {
        if (!config.encryptionKey)
            throw new Error("Security risk... encryption key required....");
        if (!sow_util_1.Util.isArrayLike(config.hiddenDirectory)) {
            throw new Error('hidden_directory should be Array...');
        }
        if (process.env.IISNODE_VERSION && process.env.PORT) {
            this.port = process.env.PORT || 8080;
        }
        else {
            if (!this.config.hostInfo.port)
                throw new Error('Listener port required...');
            this.port = this.config.hostInfo.port;
        }
        this.config.encryptionKey = sow_encryption_1.Encryption.updateCryptoKeyIV(config.encryptionKey);
        if (this.config.session) {
            if (!this.config.session.key)
                throw new Error("Security risk... Session encryption key required....");
            this.config.session.key = sow_encryption_1.Encryption.updateCryptoKeyIV(config.session.key);
            if (!this.config.session.maxAge)
                config.session.maxAge = "1d";
            if (typeof (this.config.session.maxAge) !== "string")
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
                if (this.db[conf.module])
                    throw new Error(`database module ${conf.module} already exists.`);
                if (!conf.path)
                    throw new Error(`No path defined for module ${conf.module}`);
                conf.path = this.formatPath(conf.path);
                this.db[conf.module] = new (require(conf.path))(conf.dbConn);
            });
        }
        if (!this.config.errorPage || (this.config.errorPage && Object.keys(this.config.errorPage).length === 0)) {
            if (!this.config.errorPage)
                this.config.errorPage = {};
            for (const property in this.errorPage) {
                if (this.errorPage.hasOwnProperty(property)) {
                    this.config.errorPage[property] = this.errorPage[property];
                }
            }
        }
        else {
            if (sow_util_1.Util.isPlainObject(this.config.errorPage) === false)
                throw new Error("errorPage property should be Object.");
            for (const property in this.config.errorPage) {
                if (!this.errorPage.hasOwnProperty(property))
                    continue;
                const path = this.config.errorPage[property];
                // tslint:disable-next-line: radix
                const code = parseInt(property);
                // tslint:disable-next-line: variable-name
                const status_code = sow_http_status_1.HttpStatus.fromPath(path, code);
                if (!status_code || status_code !== code || !sow_http_status_1.HttpStatus.isErrorCode(status_code)) {
                    throw new Error(`Invalid Server/Client error page... ${path} and code ${code}}`);
                }
                this.config.errorPage[property] = this.formatPath(path);
            }
            if (!this.config.errorPage["500"]) {
                this.config.errorPage["500"] = this.errorPage["500"];
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
        const _context = new Context(this, req, res, req.session);
        _context.path = decodeURIComponent(req.path);
        _context.root = _context.path;
        _context.next = next;
        _context.extension = sow_util_1.Util.getExtension(_context.path) || "";
        return _context;
    }
    setHeader(res) {
        res.setHeader('x-timestamp', Date.now());
        res.setHeader('server', 'SOW Frontend');
        res.setHeader('x-app-version', '1.0.0012');
        res.setHeader('x-powered-by', 'safeonline.world');
        res.setHeader('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
        res.setHeader('x-xss-protection', '1; mode=block');
        res.setHeader('x-content-type-options', 'nosniff');
        res.setHeader('x-frame-options', 'sameorigin');
        res.setHeader('expect-ct', 'max-age=0, report-uri="https://report.safeonline.world/ct/cache.jsxh');
        res.setHeader('feature-policy', "magnetometer 'none'");
        if (this.config.hostInfo.frameAncestors) {
            res.setHeader('content-security-policy', `frame-ancestors ${this.config.hostInfo.frameAncestors}`);
        }
    }
    parseCookie(cook) {
        if (typeof (cook) !== "string")
            return cook;
        const cookies = {};
        cook.split(";").forEach((value) => {
            const index = value.indexOf("=");
            if (index < 0)
                return;
            cookies[value.substring(0, index).trim()] = value.substring(index + 1).trim();
        });
        return cookies;
    }
    parseSession(cookies) {
        if (!this.config.session.cookie)
            throw Error("You are unable to add session without session config. see your app_config.json");
        const session = new sow_static_1.Session();
        cookies = this.parseCookie(cookies);
        if (!cookies)
            return session;
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
        if (!this.config.session)
            throw Error("You are unable to add session without session config. see your app_config.json");
        return ctx.res.cookie(this.config.session.cookie, sow_encryption_1.Encryption.encryptToHex(JSON.stringify({
            loginId, roleId, userData
        }), this.config.session.key), {
            maxAge: this.config.session.maxAge,
            httpOnly: true, sameSite: "strict",
            secure: this.config.session.isSecure
        }), true;
    }
    passError(ctx) {
        if (!ctx.error)
            return false;
        ctx.res.writeHead(500, { 'Content-Type': 'text/html' });
        try {
            const msg = `<pre>${this.escape(ctx.error.replace(/<pre[^>]*>/gi, "").replace(/\\/gi, '/').replace(this.rootregx, "$root").replace(this.publicregx, "$public/"))}</pre>`;
            return ctx.res.end(msg), true;
        }
        catch (e) {
            this.log.error(e.stack);
            return false;
        }
    }
    transferRequest(ctx, path, status) {
        if (!ctx)
            throw new Error("No context argument defined...");
        if (!status)
            status = sow_http_status_1.HttpStatus.getResInfo(path, 200);
        if (status.isErrorCode && status.isInternalErrorCode === false) {
            this.addError(ctx, `${status.code} ${sow_http_status_1.HttpStatus.getDescription(status.code)}`);
        }
        const _next = ctx.next;
        ctx.next = (rcode, transfer) => {
            if (typeof (transfer) === "boolean" && transfer === false) {
                return _next(rcode, false);
            }
            if (!rcode || rcode === 200)
                return cleanContext(ctx);
            if (rcode < 0) {
                this.log.error(`Active connection closed by client. Request path ${ctx.path}`).reset();
                return cleanContext(ctx);
            }
            // tslint:disable-next-line: no-unused-expression
            return (this.passError(ctx) ? void 0 : ctx.res.status(rcode).end('Page Not found 404')), _next(rcode, false);
        };
        return ctx.res.render(ctx, path, status);
    }
    mapPath(path) {
        return _path.resolve(`${this.root}/${this.public}/${path}`);
    }
    pathToUrl(path) {
        if (!path)
            return path;
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
        if (index < 0)
            return path;
        return path.substring(0, index).replace(/\\/gi, "/");
    }
    addError(ctx, ex) {
        var _a;
        ctx.path = this.pathToUrl(ctx.path);
        if (!ctx.error) {
            ctx.error = `Error occured in ${ctx.path}`;
        }
        else {
            ctx.error += `\r\n\r\nNext Error occured in ${ctx.path}`;
        }
        ctx.error += `${(typeof (ex) === "string" ? " " + ex : "\r\n" + ((_a = ex.stack) === null || _a === void 0 ? void 0 : _a.toString()))}`;
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
    addVirtualDir(route, root, evt) {
        throw new Error("Method not implemented.");
    }
    virtualInfo(_route) {
        throw new Error("Method not implemented.");
    }
    formatPath(name) {
        return _formatPath(this, name);
    }
    createBundle(str) {
        if (!str)
            throw new Error("No string found to create bundle...");
        return sow_encryption_1.Encryption.encryptUri(str, this.config.encryptionKey);
    }
}
exports.SowServer = SowServer;
// tslint:disable-next-line: max-classes-per-file
class SowGlobalServer {
    constructor() {
        this._evt = [];
    }
    emit(ev, app, controller, server) {
        this._evt.forEach(handler => {
            return handler(app, controller, server);
        });
        this._evt.length = 0;
    }
    on(ev, next) {
        this._evt.push(next);
    }
    registerView(next) {
        console.warn('deprecated soon `global.sow.server.registerView`\r\nUse:\r\nglobal.sow.server.on( "register-view", ( app: IApps, controller: IController, server: ISowServer ) => { } );');
        return this.on("register-view", next);
    }
}
// tslint:disable-next-line: max-classes-per-file
class SowGlobal {
    constructor() {
        this.server = new SowGlobalServer();
        this.isInitilized = false;
    }
}
if (!global.sow || (global.sow && !global.sow.server)) {
    global.sow = new SowGlobal();
}
function initilizeServer(appRoot, wwwName) {
    if (global.sow.isInitilized)
        throw new Error("Server instance can initilize 1 time...");
    const _server = new SowServer(appRoot, wwwName);
    const _processNext = {
        render: (code, ctx, next, transfer) => {
            if (transfer && typeof (transfer) !== "boolean") {
                throw new Error("transfer argument should be ?boolean....");
            }
            if (!code || code < 0 || code === 200 || code === 304 || (typeof (transfer) === "boolean" && transfer === false)) {
                if (_server.config.isDebug) {
                    if (code && code < 0) {
                        _server.log.error(`Active connection closed by client. Request path ${ctx.path}`).reset();
                        code = code * -1;
                    }
                    else if (code && sow_http_status_1.HttpStatus.isErrorCode(code)) {
                        _server.log.error(`Send ${code} ${ctx.path}`).reset();
                    }
                    else {
                        _server.log.success(`Send ${code || 200} ${ctx.path}`).reset();
                    }
                }
                cleanContext(ctx);
                if (code)
                    return void 0;
                return next();
            }
            _server.log.error(`Send ${code} ${ctx.path}`).reset();
            if (_server.config.errorPage[code]) {
                return _server.transferRequest(ctx, _server.config.errorPage[code]);
            }
            if (code === 404) {
                return ctx.res.status(code).end('Page Not found 404');
            }
            return ctx.res.status(code).end(`No description found for ${code}`), next();
        }
    };
    const _controller = new sow_controller_1.Controller();
    function initilize() {
        const _app = sow_server_core_1.App();
        _server.getHttpServer = () => {
            return _app.getHttpServer();
        };
        _server.on = (ev, handler) => {
            _app.on(ev, handler);
        };
        _app.prerequisites((req, res, next) => {
            req.session = _server.parseSession(req.cookies);
            _server.setHeader(res);
            return next();
        });
        const _virtualDir = [];
        if (_server.config.isDebug) {
            _app.prerequisites((req, res, next) => {
                _server.log.success(`${req.method} ${req.path}`);
                return next();
            });
        }
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
            if (_virtualDir.some((a) => a.route === route))
                throw new Error(`You already add this virtual route ${route}`);
            const _processHandler = (req, res, next, forWord) => {
                const _ctx = _server.createContext(req, res, next);
                const _next = next;
                _ctx.next = (code, transfer) => {
                    if (!code || code === 200) {
                        return _server.log.success(`Send ${code || 200} ${route}${_ctx.path}`).reset(), cleanContext(_ctx);
                    }
                    return _processNext.render(code, _ctx, _next, transfer);
                };
                if (!sow_util_1.Util.isExists(`${root}/${_ctx.path}`, _ctx.next))
                    return;
                return forWord(_ctx);
            };
            if (!evt || typeof (evt) !== "function") {
                _app.use(route, (req, res, next) => {
                    _processHandler(req, res, next, (ctx) => {
                        if (_server.config.mimeType.indexOf(ctx.extension) > -1) {
                            return _controller.httpMimeHandler.render(ctx, root, false);
                        }
                        return ctx.next(404);
                    });
                });
            }
            else {
                _app.use(route, (req, res, next) => {
                    _processHandler(req, res, next, (ctx) => {
                        _server.log.success(`Send ${200} ${route}${req.path}`).reset();
                        return evt(ctx);
                    });
                });
            }
            return _virtualDir.push({
                route,
                root
            }), void 0;
        };
        if (_server.config.bundler && _server.config.bundler.enable) {
            const { Bundler } = require("./sow-bundler");
            Bundler.Init(_app, _controller, _server);
        }
        if (_server.config.views) {
            _server.config.views.forEach((a, _index, _array) => {
                const sowView = require(a);
                if (sowView.__isRunOnly)
                    return;
                console.warn("deprecated soon... use module.exports.__isRunOnly = true;");
                if (sowView.__esModule) {
                    if (!sowView[sowView.__moduleName]) {
                        throw new Error(`Invalid module name declear ${sowView.__moduleName} not found in ${a}`);
                    }
                    if (typeof (sowView[sowView.__moduleName].Init) !== "function") {
                        throw new Error("Invalid __esModule Init Function not defined....");
                    }
                    return sowView[sowView.__moduleName].Init(_app, _controller, _server);
                }
                if (typeof (sowView.Init) !== "function") {
                    throw new Error("Invalid module use module.export.Init Function()");
                }
                return sowView.Init(_app, _controller, _server);
            });
        }
        global.sow.server.emit("register-view", _app, _controller, _server);
        _app.onError((req, res, err) => {
            if (res.headersSent)
                return;
            const _context = _server.createContext(req, res, (_err) => {
                if (res.headersSent)
                    return;
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end("Nothing found....");
            });
            if (!err) {
                return _context.transferRequest(_server.config.errorPage["404"]);
            }
            if (err instanceof Error) {
                _server.addError(_context, err);
                return _context.transferRequest(_server.config.errorPage["500"]);
            }
        });
        _app.use((req, res, next) => {
            const _context = _server.createContext(req, res, next);
            const _next = _context.next;
            _context.next = (code, transfer) => {
                if (code && code === -404)
                    return next();
                return _processNext.render(code, _context, _next, transfer);
            };
            if (_server.config.hiddenDirectory.some((a) => req.path.indexOf(a) > -1)) {
                _server.log.write(`Trying to access Hidden directory. Remote Adress ${req.ip} Send 404 ${req.path}`).reset();
                return _server.transferRequest(_context, _server.config.errorPage["404"]);
            }
            if (req.path.indexOf('$root') > -1 || req.path.indexOf('$public') > -1) {
                return _server.transferRequest(_context, _server.config.errorPage["404"]);
            }
            try {
                return _controller.processAny(_context);
            }
            catch (ex) {
                return _server.transferRequest(_server.addError(_context, ex), _server.config.errorPage["500"]);
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
        get socketPath() { return _server.config.socketPath || ""; },
        get server() { return _server; },
        get controller() { return _controller; }
    };
}
exports.initilizeServer = initilizeServer;
//# sourceMappingURL=sow-server.js.map