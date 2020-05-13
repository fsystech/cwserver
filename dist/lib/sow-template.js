"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _fs = __importStar(require("fs"));
const _vm = __importStar(require("vm"));
const sow_util_1 = require("./sow-util");
const sow_http_status_1 = require("./sow-http-status");
class ParserInfo {
    constructor() {
        this.line = "";
        this.tag = "";
        this.isTagStart = false;
        this.isTagEnd = true;
        this.startTageName = void 0;
        this.isLastTag = false;
    }
}
class ScriptTag {
    constructor(l, lre, r, rre, repre) {
        this.l = l;
        this.lre = lre;
        this.r = r;
        this.rre = rre;
        this.repre = repre;
    }
}
class Tag {
    constructor() {
        this.script = new ScriptTag('{%', /{%/g, '%}', /%}/g, /{=(.+?)=}/g);
        this.write = new ScriptTag('{=', /{=/g, '=}', /=}/g, /{=(.+?)=}/g);
    }
}
class ScriptParser {
    constructor() {
        this.tag = new Tag();
    }
    startTage(parserInfo) {
        if (parserInfo.line.indexOf(parserInfo.tag) <= -1) {
            !parserInfo.isLastTag ? undefined : parserInfo.isTagEnd === true ? parserInfo.line = parserInfo.line + "\x0f; __RSP += \x0f" : '';
            return parserInfo;
        }
        parserInfo.isTagStart = true;
        switch (parserInfo.tag) {
            case this.tag.script.l:
                (this.tag.script.rre.test(parserInfo.line) === true
                    ? (parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                        parserInfo.line = parserInfo.line.replace(this.tag.script.lre, "\x0f;")
                            .replace(this.tag.script.rre, " __RSP += \x0f"))
                    : parserInfo.isTagEnd = false,
                    parserInfo.line = parserInfo.line.replace(this.tag.script.lre, "\x0f;\r\n").replace(/'/g, '\x0f'));
                break;
            case this.tag.write.l:
                (this.tag.write.rre.test(parserInfo.line) === true ?
                    (parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                        parserInfo.line = parserInfo.line.replace(this.tag.write.repre, (match) => {
                            return !match ? '' : match.replace(/'/, '\x0f');
                        }).replace(this.tag.write.lre, "\x0f; __RSP +=")
                            .replace(this.tag.write.rre, "; __RSP += \x0f"))
                    : parserInfo.isTagEnd = false,
                    parserInfo.line = parserInfo.line.replace(/'/, '\x0f').replace(this.tag.write.lre, "\x0f; __RSP +="));
                break;
            default: throw new Error(`Invalid script tag "${parserInfo.tag}" found...`);
        }
        parserInfo.startTageName = (!parserInfo.isTagEnd ? parserInfo.tag : void 0);
        return parserInfo;
    }
    endTage(parserInfo) {
        if (parserInfo.isTagStart === false && parserInfo.isTagEnd === true) {
            return parserInfo;
        }
        if (parserInfo.isTagStart !== false && parserInfo.isTagEnd !== true) {
            parserInfo.isTagStart = true;
            switch (parserInfo.tag) {
                case this.tag.script.r:
                    (this.tag.script.rre.test(parserInfo.line) === true ?
                        (parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                            parserInfo.line = parserInfo.line.replace(this.tag.script.rre, " __RSP += \x0f"))
                        : parserInfo.isTagEnd = false);
                    break;
                case this.tag.write.r:
                    (this.tag.write.rre.test(parserInfo.line) === true ?
                        (parserInfo.isTagEnd = true, parserInfo.isTagStart = false, parserInfo.line = parserInfo.line.replace(this.tag.write.rre, "; __RSP += \x0f"))
                        : parserInfo.isTagEnd = false);
                    break;
                default: break;
            }
            parserInfo.startTageName = (!parserInfo.isTagEnd ? parserInfo.startTageName : void 0);
        }
        return parserInfo;
    }
}
class TemplateParser {
    static implimentAttachment(appRoot, str) {
        if (/#attach/gi.test(str) === false)
            return str;
        return str.replace(/#attach([\s\S]+?)\r\n/gi, (match) => {
            const path = match.replace(/#attach/gi, "").replace(/\r\n/gi, "").trim();
            const abspath = `${appRoot}${path}`.replace(/\//gi, "\\");
            if (!sow_util_1.Util.isExists(abspath)) {
                throw new Error(`Attachement ${path} not found...`);
            }
            return _fs.readFileSync(abspath, "utf8").replace(/^\uFEFF/, '');
        });
    }
    static implimentTemplateExtend(appRoot, str) {
        if (/#extends/gi.test(str) === false)
            return str;
        const templats = [];
        do {
            const match = /#extends([\s\S]+?)\r\n/gi.exec(str);
            if (!match || match === null) {
                templats.push(str);
                break;
            }
            const found = match[1];
            if (!found) {
                throw new Error("Invalid template format...");
            }
            const path = found.replace(/#extends/gi, "").replace(/\r\n/gi, "").trim();
            const abspath = `${appRoot}${path}`.replace(/\//gi, "\\");
            if (!sow_util_1.Util.isExists(abspath)) {
                throw new Error(`Template ${path} not found...`);
            }
            templats.push(str.replace(match[0], ""));
            str = _fs.readFileSync(abspath, "utf8").replace(/^\uFEFF/, '');
        } while (true);
        let len = templats.length, count = 0, body = "", parentTemplate = "";
        const startTag = /<placeholder[^>]*>/gi, rnRegx = /\r\n/gi;
        const margeTemplate = (match, template) => {
            for (const key of match) {
                const tmplArr = /<placeholder id=\"(.*)\">/gi.exec(key.trim());
                if (!tmplArr) {
                    throw new Error(`Invalid template format... ${key}`);
                }
                const tmplId = tmplArr[1];
                if (!tmplId) {
                    throw new Error(`Invalid template format... ${key}`);
                }
                let implStr = void 0;
                template = template.replace(new RegExp(`<impl-placeholder id="${tmplId}">.+?<\/impl-placeholder>`, "gi"), (m) => {
                    implStr = m.replace(/<impl-placeholder[^>]*>/gi, "").replace(/<\/impl-placeholder>/gi, "");
                    return implStr;
                });
                body = body.replace(new RegExp(`<placeholder id="${tmplId}">.+?<\/placeholder>`, "gi"), () => {
                    return implStr;
                });
            }
        };
        do {
            len--;
            if (count === 0) {
                parentTemplate = templats[len].replace(rnRegx, "8_r_n_gx_8");
                body += parentTemplate;
                count++;
                continue;
            }
            const match = parentTemplate.match(startTag);
            if (match === null)
                continue;
            parentTemplate = templats[len].replace(rnRegx, "8_r_n_gx_8");
            margeTemplate(match, parentTemplate);
        } while (len > 0);
        return body.replace(/8_r_n_gx_8/gi, "\r\n");
    }
    static parse(appRoot, str) {
        return this.implimentAttachment(appRoot, this.implimentTemplateExtend(appRoot, str)).replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
    }
}
const _tw = {
    cache: {}
};
class TemplateCore {
    static compair(a, b) {
        const astat = _fs.statSync(a), bstat = _fs.statSync(b);
        if (astat.mtime.getTime() > bstat.mtime.getTime())
            return true;
        return false;
    }
    static compile(str, next) {
        const context = {
            thisNext: void 0
        };
        const script = new _vm.Script(`thisNext = function( _server, ctx, _next ){\n ${str} \n};`);
        _vm.createContext(context);
        script.runInContext(context);
        return (next ? next(str, true) : void 0), context.thisNext;
    }
    static parseScript(str) {
        str = str.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
        const script = str.split('\n');
        if (script.length === 0 || script === null)
            return void 0;
        let out = "";
        out = '/*__sow_template_script__*/\n';
        out += 'let __RSP = "";\r\n';
        out += 'ctx.write = function( str ) { __RSP += str; }';
        const scriptParser = new ScriptParser();
        const parserInfo = new ParserInfo();
        for (let i = 0, len = script.length; i < len; i++) {
            parserInfo.line = script[i];
            out += "\r\n";
            if (!parserInfo.line) {
                out += "\r\n__RSP += '';";
                continue;
            }
            parserInfo.line = parserInfo.line.replace(/^\s*|\s*$/g, ' ');
            parserInfo.isTagEnd === true ? parserInfo.line = "__RSP += \x0f" + parserInfo.line : void 0;
            parserInfo.tag = scriptParser.tag.script.l;
            scriptParser.startTage(parserInfo);
            parserInfo.tag = scriptParser.tag.script.r;
            scriptParser.endTage(parserInfo);
            parserInfo.tag = scriptParser.tag.write.l;
            scriptParser.startTage(parserInfo);
            parserInfo.tag = scriptParser.tag.write.r;
            scriptParser.endTage(parserInfo);
            parserInfo.isTagEnd === true ? (parserInfo.line = parserInfo.line.replace(/'/g, '\\x27').replace(/\x0f/g, "'"), out += parserInfo.line + "\\n';") : (parserInfo.line = parserInfo.line.replace(/\x0f/g, "'"), out += parserInfo.line);
        }
        out = out.replace(/__RSP \+\= '';/g, '');
        out += "\nreturn _next( __RSP ), __RSP = void 0;\n";
        return out.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
    }
    static isScript(str) {
        if (/{%/gi.test(str) === true
            || /{=/gi.test(str) === true) {
            return true;
        }
        return false;
    }
    static isTemplate(str) {
        if (/#attach/gi.test(str) === true
            || /#extends/gi.test(str) === true) {
            return true;
        }
        return false;
    }
    static isScriptTemplate(str) {
        const index = str.indexOf("\n");
        if (index < 0)
            return false;
        return str.substring(0, index).indexOf("__sow_template_script__") > -1;
    }
    static run(appRoot, str, next) {
        const isTemplate = this.isTemplate(str);
        if (isTemplate) {
            str = TemplateParser.parse(appRoot, str);
        }
        if (this.isScript(str)) {
            return this.compile(this.parseScript(str), next);
        }
        return (isTemplate ? (next ? next(str, false) : void 0) : void 0), str;
    }
    static tryMemCache(server, ctx, path, status) {
        const key = path.replace(/\//gi, "_").replace(/\./gi, "_");
        let cache = _tw.cache[key];
        if (!cache) {
            const url = sow_util_1.Util.isExists(path, ctx.next);
            if (!url)
                return;
            cache = this.run(server.getPublic(), _fs.readFileSync(String(url), "utf8").replace(/^\uFEFF/, ''));
            _tw.cache[key] = cache;
        }
        if (typeof (cache) === "function") {
            return cache(server, ctx, (body) => {
                ctx.res.set('Cache-Control', 'no-store');
                ctx.res.writeHead(status.code, { 'Content-Type': 'text/html' });
                return ctx.res.end(body), ctx.next(status.code, status.isErrorCode === false);
            });
        }
        ctx.res.set('Cache-Control', 'no-store');
        ctx.res.writeHead(status.code, { 'Content-Type': 'text/html' });
        return ctx.res.end(cache), ctx.next(status.code, status.isErrorCode === false);
    }
    static tryFileCacheOrLive(server, ctx, path, status) {
        const fsp = sow_util_1.Util.isExists(path, ctx.next);
        if (!fsp) {
            return void 0;
        }
        ;
        const filePath = String(fsp);
        const cachePath = `${filePath}.cach`;
        if (!filePath)
            return;
        let readCache = false;
        if (server.config.templateCache && sow_util_1.Util.isExists(cachePath)) {
            readCache = this.compair(filePath, cachePath) === false;
            if (readCache === false) {
                _fs.unlinkSync(cachePath);
            }
        }
        let cache;
        if (!readCache) {
            cache = this.run(server.getPublic(), _fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ''), !server.config.templateCache ? void 0 : (str) => {
                _fs.writeFileSync(cachePath, str);
            });
        }
        else {
            cache = _fs.readFileSync(cachePath, "utf8").replace(/^\uFEFF/, '');
            if (this.isScriptTemplate(cache)) {
                cache = this.compile(cache);
            }
        }
        if (typeof (cache) === "function") {
            return cache(server, ctx, (body) => {
                ctx.res.set('Cache-Control', 'no-store');
                ctx.res.writeHead(status.code, { 'Content-Type': 'text/html' });
                return ctx.res.end(body), ctx.next(status.code, status.isErrorCode === false);
            });
        }
        ctx.res.set('Cache-Control', 'no-store');
        ctx.res.writeHead(status.code, { 'Content-Type': 'text/html' });
        return ctx.res.end(cache), ctx.next(status.code, status.isErrorCode === false);
    }
}
var Template;
(function (Template) {
    function parse(server, ctx, path, status) {
        if (!status)
            status = sow_http_status_1.HttpStatus.getResInfo(path, 200);
        try {
            ctx.servedFrom = server.pathToUrl(path);
            if (server.config.templateCache && server.config.templateCacheType === "MEM") {
                return TemplateCore.tryMemCache(server, ctx, path, status);
            }
            return TemplateCore.tryFileCacheOrLive(server, ctx, path, status);
        }
        catch (ex) {
            ctx.path = path;
            if (status.code === 500) {
                if (status.tryServer === true) {
                    server.addError(ctx, ex);
                    return server.passError(ctx);
                }
                status.tryServer = true;
            }
            server.log.error(`Send 500 ${server.pathToUrl(ctx.path)}`).reset();
            status.code = 500;
            status.isErrorCode = true;
            return parse(server, server.addError(ctx, ex), status.tryServer ? `${server.errorPage["500"]}` : `${server.config.errorPage["500"]}`, status);
        }
    }
    Template.parse = parse;
})(Template = exports.Template || (exports.Template = {}));
//# sourceMappingURL=sow-template.js.map