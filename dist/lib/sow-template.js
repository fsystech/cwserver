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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = exports.TemplateCore = exports.templateNext = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
const _fs = __importStar(require("fs"));
const _vm = __importStar(require("vm"));
const _zlib = __importStar(require("zlib"));
const _path = __importStar(require("path"));
const sow_http_status_1 = require("./sow-http-status");
const fsw = __importStar(require("./sow-fsw"));
function templateNext(ctx, next, isCompressed) {
    throw new Error("Method not implemented.");
}
exports.templateNext = templateNext;
const _tw = {
    cache: {}
};
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
    constructor() {
        this.l = '{%';
        this.r = '%}';
        this.repre = /NO_NEED/gi;
    }
    get lre() {
        return /{%/gi;
    }
    get rre() {
        return /%}/gi;
    }
}
class WriteTag {
    constructor() {
        this.l = '{=';
        this.r = '=}';
    }
    get lre() {
        return /{=/gi;
    }
    ;
    get rre() {
        return /=}/gi;
    }
    get repre() {
        return /{=(.+?)=}/gi;
    }
}
class Tag {
    constructor() {
        this.script = new ScriptTag();
        this.write = new WriteTag();
    }
}
class ScriptParser {
    constructor() {
        this.tag = new Tag();
    }
    startTage(parserInfo) {
        if (parserInfo.line.indexOf(parserInfo.tag) <= -1) {
            if (parserInfo.isLastTag && parserInfo.isTagEnd) {
                parserInfo.line = parserInfo.line + "\x0f; __RSP += \x0f";
            }
            return;
        }
        parserInfo.isTagStart = true;
        switch (parserInfo.tag) {
            case this.tag.script.l: /*{%*/
                if (this.tag.script.rre.test(parserInfo.line) === true) {
                    parserInfo.isTagEnd = true;
                    parserInfo.isTagStart = false;
                    const index = parserInfo.line.indexOf("{");
                    let startPart;
                    if (index > 0) {
                        startPart = parserInfo.line.substring(0, index) + "\x0f;";
                    }
                    parserInfo.line = parserInfo.line.substring(index + 2, parserInfo.line.length);
                    parserInfo.line = parserInfo.line.substring(0, parserInfo.line.indexOf("%"));
                    parserInfo.line += " __RSP += \x0f";
                    if (startPart) {
                        parserInfo.line = startPart + parserInfo.line;
                    }
                    break;
                }
                parserInfo.isTagEnd = false;
                parserInfo.line = parserInfo.line.replace(this.tag.script.lre, "\x0f;\r\n").replace(/'/g, '\x0f');
                break;
            case this.tag.write.l: /*{=*/
                (this.tag.write.rre.test(parserInfo.line) === true ?
                    (parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                        parserInfo.line = parserInfo.line.replace(this.tag.write.repre, (match) => {
                            return match.replace(/'/gi, '\x0f');
                        }).replace(this.tag.write.lre, "\x0f; __RSP +=")
                            .replace(this.tag.write.rre, "; __RSP += \x0f"))
                    : parserInfo.isTagEnd = false,
                    parserInfo.line = parserInfo.line.replace(/'/gi, '\x0f').replace(this.tag.write.lre, "\x0f; __RSP +="));
                break;
        }
        parserInfo.startTageName = (!parserInfo.isTagEnd ? parserInfo.tag : void 0);
        return;
    }
    endTage(parserInfo) {
        if (parserInfo.isTagStart === false && parserInfo.isTagEnd === true)
            return;
        if (parserInfo.isTagStart !== false && parserInfo.isTagEnd !== true) {
            parserInfo.isTagStart = true;
            switch (parserInfo.tag) {
                case this.tag.script.r: /*%}*/
                    (this.tag.script.rre.test(parserInfo.line) === true ?
                        (parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                            parserInfo.line = parserInfo.line.replace(this.tag.script.rre, " __RSP += \x0f"))
                        : parserInfo.isTagEnd = false);
                    break;
                case this.tag.write.r: /*=}*/
                    (this.tag.write.rre.test(parserInfo.line) === true ?
                        (parserInfo.isTagEnd = true, parserInfo.isTagStart = false, parserInfo.line = parserInfo.line.replace(this.tag.write.rre, "; __RSP += \x0f"))
                        : parserInfo.isTagEnd = false);
                    break;
            }
            parserInfo.startTageName = (!parserInfo.isTagEnd ? parserInfo.startTageName : void 0);
        }
        return;
    }
}
class TemplateParser {
    static implimentAttachment(ctx, appRoot, str, next) {
        if (/#attach/gi.test(str) === false)
            return next(str);
        const match = str.match(/#attach([\s\S]+?)\r\n/gi);
        if (match) {
            const forword = () => {
                const orgMatch = match.shift();
                if (!orgMatch)
                    return next(str);
                const path = orgMatch.replace(/#attach/gi, "").replace(/\r\n/gi, "").trim();
                const abspath = _path.resolve(`${appRoot}${path}`);
                return fsw.isExists(abspath, (exists, url) => {
                    if (!exists) {
                        return ctx.transferError(new Error(`Attachement ${path} not found...`));
                    }
                    return _fs.readFile(url, "utf8", (err, data) => {
                        return ctx.handleError(err, () => {
                            str = str.replace(orgMatch, data);
                            return forword();
                        });
                    });
                });
            };
            return forword();
        }
    }
    static margeTemplate(match, template, body) {
        for (const key of match) {
            const tmplArr = /<placeholder id=\"(.*)\">/gi.exec(key.trim());
            if (!tmplArr) {
                throw new Error(`Invalid template format... ${key}`);
            }
            const tmplId = tmplArr[1];
            if (!tmplId || (tmplId && tmplId.trim().length === 0)) {
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
        return body;
    }
    static prepareTemplate(ctx, appRoot, str, next) {
        const templats = [];
        const forword = () => {
            const match = /#extends([\s\S]+?)\r\n/gi.exec(str);
            if (!match) {
                templats.push(str);
                return next(templats);
            }
            const found = match[1];
            if (!found || (found && found.trim().length === 0)) {
                return ctx.transferError(new Error("Invalid template format..."));
            }
            const path = found.replace(/#extends/gi, "").replace(/\r\n/gi, "").trim();
            const abspath = _path.resolve(`${appRoot}${path}`);
            return _fs.exists(abspath, (exists) => {
                if (!exists) {
                    return ctx.transferError(new Error(`Template ${path} not found...`));
                }
                templats.push(str.replace(match[0], ""));
                return _fs.readFile(abspath, "utf8", (err, data) => {
                    return ctx.handleError(err, () => {
                        str = data.replace(/^\uFEFF/, '');
                        return forword();
                    });
                });
            });
        };
        return forword();
    }
    static implimentTemplateExtend(ctx, appRoot, str, next) {
        if (/#extends/gi.test(str) === false)
            return next(str);
        return this.prepareTemplate(ctx, appRoot, str, (templats) => {
            let count = 0;
            let body = "";
            let parentTemplate = "";
            const startTag = /<placeholder[^>]*>/gi;
            const rnRegx = /\r\n/gi;
            let len = templats.length;
            try {
                do {
                    len--;
                    if (count === 0) {
                        parentTemplate = templats[len].replace(rnRegx, "8_r_n_gx_8");
                        body += parentTemplate;
                        count++;
                        continue;
                    }
                    const match = parentTemplate.match(startTag);
                    if (match === null || (match && match.length === 0)) {
                        throw new Error("Invalid master template... No placeholder tag found....");
                    }
                    parentTemplate = templats[len].replace(rnRegx, "8_r_n_gx_8");
                    body = this.margeTemplate(match, parentTemplate, body);
                } while (len > 0);
                return next(body.replace(/8_r_n_gx_8/gi, "\r\n"));
            }
            catch (e) {
                return ctx.transferError(e);
            }
        });
    }
    static parse(ctx, appRoot, str, next) {
        return this.implimentTemplateExtend(ctx, appRoot, str, (istr) => {
            return this.implimentAttachment(ctx, appRoot, istr, (astr) => {
                return next(astr.replace(/<script runat="template-engine">([\s\S]+?)<\/script>/gi, (match) => {
                    return match.replace(/<script runat="template-engine">/gi, "{%").replace(/<\/script>/gi, "%}");
                }).replace(/^\s*$(?:\r\n?|\n)/gm, "\n"));
            });
        });
    }
}
class TemplateCore {
    static compile(str, next) {
        try {
            if (!str) {
                throw new Error("No script found to compile....");
            }
            const context = {
                thisNext: templateNext
            };
            const script = new _vm.Script(`thisNext = async function( ctx, next, isCompressed ){\nlet __RSP = "";\nctx.write = function( str ) { __RSP += str; }\ntry{\n ${str}\nreturn next( ctx, __RSP, isCompressed ), __RSP = void 0;\n\n}catch( ex ){\n ctx.server.addError(ctx, ex);\nreturn ctx.next(500);\n}\n};`);
            _vm.createContext(context);
            script.runInContext(context);
            return next({
                str,
                isScript: true,
                sendBox: context.thisNext
            });
        }
        catch (e) {
            return next({ str: "", err: e });
        }
    }
    static parseScript(str) {
        str = str.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
        const script = str.split('\n');
        let out = "";
        out = '/*__sow_template_script__*/';
        const scriptParser = new ScriptParser();
        const parserInfo = new ParserInfo();
        for (parserInfo.line of script) {
            out += "\n";
            if (!parserInfo.line || (parserInfo.line && parserInfo.line.trim().length === 0)) {
                out += "\r\n__RSP += '';";
                continue;
            }
            // parserInfo.line = parserInfo.line.replace( /^\s*|\s*$/g, ' ' );
            parserInfo.line = parserInfo.line.replace(/(?:\r\n|\r|\n)/g, '');
            if (parserInfo.isTagEnd === true) {
                parserInfo.line = "__RSP += \x0f" + parserInfo.line;
            }
            parserInfo.tag = scriptParser.tag.script.l;
            scriptParser.startTage(parserInfo);
            parserInfo.tag = scriptParser.tag.script.r;
            scriptParser.endTage(parserInfo);
            parserInfo.tag = scriptParser.tag.write.l;
            scriptParser.startTage(parserInfo);
            parserInfo.tag = scriptParser.tag.write.r;
            scriptParser.endTage(parserInfo);
            if (parserInfo.isTagEnd === true) {
                parserInfo.line = parserInfo.line.replace(/'/g, '\\x27').replace(/\x0f/g, "'");
                out += parserInfo.line + "\\n';";
            }
            else {
                parserInfo.line = parserInfo.line.replace(/\x0f/g, "'");
                out += parserInfo.line;
            }
        }
        out = out.replace(/__RSP \+\= '';/g, '');
        return out.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
    }
    static isScript(str) {
        if (/{%/gi.test(str) === true
            || /{=/gi.test(str) === true
            || /<script runat="template-engine">/gi.test(str)) {
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
    static _run(ctx, appRoot, str, fnext) {
        const isTemplate = this.isTemplate(str);
        if (isTemplate) {
            return TemplateParser.parse(ctx, appRoot, str, (tstr) => {
                return fnext(tstr, true);
            });
        }
        return fnext(str, false);
    }
    static run(ctx, appRoot, str, next) {
        return this._run(ctx, appRoot, str, (fstr, isTemplate) => {
            if (this.isScript(fstr)) {
                return this.compile(this.parseScript(fstr), next);
            }
            return next({
                str: fstr,
                isScript: false,
                isTemplate
            });
        });
    }
}
exports.TemplateCore = TemplateCore;
function canReadFileCache(ctx, filePath, cachePath, next) {
    return fsw.isExists(cachePath, (exists) => {
        if (!exists)
            return next(false);
        return fsw.compairFile(filePath, cachePath, (err, changed) => {
            return ctx.handleError(err, () => {
                if (changed) {
                    return _fs.unlink(cachePath, (uerr) => {
                        return ctx.handleError(uerr, () => {
                            return next(false);
                        });
                    });
                }
                return next(true);
            });
        }, ctx.handleError.bind(ctx));
    });
}
class TemplateLink {
    static processResponse(status) {
        return (ctx, body, isCompressed) => {
            ctx.res.noCache();
            if (isCompressed && isCompressed === true) {
                return _zlib.gzip(Buffer.from(body), (error, buff) => {
                    return ctx.handleError(error, () => {
                        return ctx.res.type("html").noCache().status(status.code, {
                            'Content-Encoding': 'gzip',
                            'Content-Length': buff.length
                        }).end(buff);
                    });
                });
            }
            return ctx.handleError(null, () => {
                return ctx.res.type("html").noCache().status(status.code, {
                    'Content-Length': Buffer.byteLength(body)
                }).end(body);
            });
        };
    }
    static tryLive(ctx, path, status) {
        return fsw.isExists(path, (exists, url) => {
            if (!exists)
                return ctx.next(404);
            return _fs.readFile(url, "utf8", (err, data) => {
                return ctx.handleError(err, () => {
                    return TemplateCore.run(ctx, ctx.server.getPublic(), data.replace(/^\uFEFF/, ''), (result) => {
                        return ctx.handleError(result.err, () => {
                            if (result.sendBox) {
                                try {
                                    return result.sendBox(ctx, this.processResponse(status), false);
                                }
                                catch (e) {
                                    return ctx.transferError(e);
                                }
                            }
                            ctx.res.noCache();
                            return ctx.res.type("html").status(200).noCache().send(result.str);
                        });
                    });
                });
            });
        });
    }
    static _tryMemCache(ctx, path, status, next) {
        const key = path.replace(/\//gi, "_").replace(/\./gi, "_");
        const cache = _tw.cache[key];
        if (cache)
            return next(cache);
        return fsw.isExists(path, (exists, url) => {
            if (!exists)
                return ctx.next(404);
            return _fs.readFile(url, "utf8", (err, data) => {
                return ctx.handleError(err, () => {
                    return TemplateCore.run(ctx, ctx.server.getPublic(), data.replace(/^\uFEFF/, ''), (result) => {
                        return ctx.handleError(result.err, () => {
                            _tw.cache[key] = result.sendBox || result.str;
                            return next(result.sendBox || result.str);
                        });
                    });
                });
            });
        });
    }
    static tryMemCache(ctx, path, status) {
        return this._tryMemCache(ctx, path, status, (func) => {
            if (typeof (func) === "function") {
                return func(ctx, this.processResponse(status));
            }
            return ctx.res.type("html").noCache().status(status.code).end(func);
        });
    }
    static _tryFileCacheOrLive(ctx, filePath, next) {
        const cachePath = `${filePath}.cach`;
        return canReadFileCache(ctx, filePath, cachePath, (readCache) => {
            if (!readCache) {
                return _fs.readFile(filePath, "utf8", (err, data) => {
                    return ctx.handleError(err, () => {
                        return TemplateCore.run(ctx, ctx.server.getPublic(), data.replace(/^\uFEFF/, ''), (result) => {
                            return ctx.handleError(result.err, () => {
                                return _fs.writeFile(cachePath, result.str, (werr) => {
                                    return ctx.handleError(werr, () => {
                                        return next(result.sendBox || result.str);
                                    });
                                });
                            });
                        });
                    });
                });
            }
            return _fs.readFile(cachePath, "utf8", (err, data) => {
                return ctx.handleError(err, () => {
                    if (TemplateCore.isScriptTemplate(data)) {
                        return TemplateCore.compile(data, (result) => {
                            return ctx.handleError(result.err, () => {
                                return next(result.sendBox || result.str);
                            });
                        });
                    }
                    return next(data);
                });
            });
        });
    }
    static tryFileCacheOrLive(ctx, path, status) {
        return fsw.isExists(path, (exists, filePath) => {
            if (!exists)
                return ctx.next(404);
            return this._tryFileCacheOrLive(ctx, filePath, (func) => {
                if (typeof (func) === "function") {
                    try {
                        return func(ctx, this.processResponse(status));
                    }
                    catch (e) {
                        return ctx.transferError(e);
                    }
                }
                return ctx.res.type("html").noCache().status(status.code).end(func);
            });
        });
    }
}
class Template {
    static parse(ctx, path, status) {
        if (!status)
            status = sow_http_status_1.HttpStatus.getResInfo(path, 200);
        ctx.servedFrom = ctx.server.pathToUrl(path);
        if (!ctx.server.config.template.cache) {
            return TemplateLink.tryLive(ctx, path, status);
        }
        if (ctx.server.config.template.cache && ctx.server.config.template.cacheType === "MEM") {
            return TemplateLink.tryMemCache(ctx, path, status);
        }
        return TemplateLink.tryFileCacheOrLive(ctx, path, status);
    }
}
exports.Template = Template;
//# sourceMappingURL=sow-template.js.map