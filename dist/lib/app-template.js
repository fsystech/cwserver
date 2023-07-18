"use strict";
// Copyright (c) 2022 Safe Online World Ltd.
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = exports.TemplateCore = exports.templateNext = void 0;
// 9:01 PM 5/2/2020
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _vm = __importStar(require("node:vm"));
const _zlib = __importStar(require("node:zlib"));
const _path = __importStar(require("node:path"));
const http_status_1 = require("./http-status");
const fsw = __importStar(require("./fsw"));
const app_util_1 = require("./app-util");
const node_os_1 = require("node:os");
const file_info_1 = require("./file-info");
const _isWin = (0, node_os_1.platform)() === "win32";
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
    get lre() {
        return /{%/gi;
    }
    get rre() {
        return /%}/gi;
    }
    constructor() {
        this.l = '{%';
        this.r = '%}';
        this.repre = /NO_NEED/gi;
    }
}
class WriteTag {
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
    constructor() {
        this.l = '{=';
        this.r = '=}';
    }
}
class Tag {
    constructor() {
        this.script = new ScriptTag();
        this.write = new WriteTag();
    }
}
class CommentTag {
    get jsStart() {
        return /\/\*{%\*\//gi;
    }
    get jsEnd() {
        return /\/\*%}\*\//gi;
    }
    get htmlStart() {
        return /<\!--{%-->/gi;
    }
    get htmlEnd() {
        return /<\!--%}-->/gi;
    }
}
class ScriptParser {
    constructor() {
        this.tag = new Tag();
        this._cmnt = new CommentTag();
    }
    startTage(parserInfo) {
        if (parserInfo.line.indexOf(parserInfo.tag) <= -1) {
            if (parserInfo.isLastTag && parserInfo.isTagEnd) {
                parserInfo.line = parserInfo.line + "\x0f; __v8val += \x0f";
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
                    if (this._cmnt.jsStart.test(parserInfo.line) /** hasJsCmnt */) {
                        if (index > 2) {
                            startPart = parserInfo.line.substring(0, index - 2) + "\x0f;";
                            parserInfo.line = parserInfo.line.substring(index + 4);
                        }
                        parserInfo.line = parserInfo.line.replace(this._cmnt.jsEnd, "");
                        parserInfo.line += " __v8val += \x0f";
                    }
                    else if (this._cmnt.htmlStart.test(parserInfo.line) /* hasHtmlCmnt*/) {
                        if (index > 4) {
                            startPart = parserInfo.line.substring(0, index - 4) + "\x0f;";
                            parserInfo.line = parserInfo.line.substring(index + 5);
                        }
                        parserInfo.line = parserInfo.line.replace(this._cmnt.htmlEnd, "");
                        parserInfo.line += " __v8val += \x0f";
                    }
                    else {
                        if (index > 0) {
                            startPart = parserInfo.line.substring(0, index) + "\x0f;";
                        }
                        parserInfo.line = parserInfo.line.substring(index + 2, parserInfo.line.length);
                        parserInfo.line = parserInfo.line.substring(0, parserInfo.line.indexOf("%"));
                        parserInfo.line += " __v8val += \x0f";
                    }
                    if (startPart) {
                        parserInfo.line = startPart + parserInfo.line;
                    }
                    break;
                }
                parserInfo.isTagEnd = false;
                if (this._cmnt.jsStart.test(parserInfo.line) /** hasJsCmnt */) {
                    parserInfo.line = parserInfo.line.replace(this._cmnt.jsStart, "\x0f;").replace(/'/g, '\x0f');
                    break;
                }
                if (this._cmnt.htmlStart.test(parserInfo.line) /* hasHtmlCmnt*/) {
                    parserInfo.line = parserInfo.line.replace(this._cmnt.htmlStart, "\x0f;").replace(/'/g, '\x0f');
                    break;
                }
                parserInfo.line = parserInfo.line.replace(this.tag.script.lre, "\x0f;\r\n").replace(/'/g, '\x0f');
                break;
            case this.tag.write.l: /*{=*/
                (this.tag.write.rre.test(parserInfo.line) === true ?
                    (parserInfo.isTagEnd = true, parserInfo.isTagStart = false,
                        parserInfo.line = parserInfo.line.replace(this.tag.write.repre, (match) => {
                            return match.replace(/'/gi, '\x0f');
                        }).replace(this.tag.write.lre, "\x0f; __v8val +=")
                            .replace(this.tag.write.rre, "; __v8val += \x0f"))
                    : parserInfo.isTagEnd = false,
                    parserInfo.line = parserInfo.line.replace(/'/gi, '\x0f').replace(this.tag.write.lre, "\x0f; __v8val +="));
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
                    if (this.tag.script.rre.test(parserInfo.line) === true) {
                        parserInfo.isTagEnd = true;
                        parserInfo.isTagStart = false;
                        if (this._cmnt.jsEnd.test(parserInfo.line)) {
                            parserInfo.line = parserInfo.line.replace(this._cmnt.jsEnd, "__v8val += \x0f");
                            break;
                        }
                        if (this._cmnt.htmlEnd.test(parserInfo.line)) {
                            parserInfo.line = parserInfo.line.replace(this._cmnt.htmlEnd, "__v8val += \x0f");
                            break;
                        }
                        parserInfo.line = parserInfo.line.replace(this.tag.script.rre, " __v8val += \x0f");
                        break;
                    }
                    parserInfo.isTagEnd = false;
                    break;
                case this.tag.write.r: /*=}*/
                    (this.tag.write.rre.test(parserInfo.line) === true ?
                        (parserInfo.isTagEnd = true, parserInfo.isTagStart = false, parserInfo.line = parserInfo.line.replace(this.tag.write.rre, "; __v8val += \x0f"))
                        : parserInfo.isTagEnd = false);
                    break;
            }
            parserInfo.startTageName = (!parserInfo.isTagEnd ? parserInfo.startTageName : void 0);
        }
        return;
    }
    dispose() {
        // @ts-ignore
        delete this.tag;
        delete this._cmnt;
    }
}
function ExportAttachMatch(str) {
    let match = null;
    if (_isWin) {
        match = str.match(/#attach([\s\S]+?)\r\n/gi);
        if (!match) {
            match = str.match(/#attach([\s\S]+?)\n/gi);
        }
    }
    else {
        match = str.match(/#attach([\s\S]+?)\n/gi);
        if (!match) {
            match = str.match(/#attach([\s\S]+?)\r\n/gi);
        }
    }
    return match;
}
function ExportExtendMatch(str) {
    let match = /#extends([\s\S]+?)\r\n/gi.exec(str);
    if (!match) {
        match = /#extends([\s\S]+?)\n/gi.exec(str);
    }
    return match;
}
const _fileInfo = new file_info_1.FileInfoCacheHandler();
class TemplateParser {
    static implimentAttachment(ctx, appRoot, str, next) {
        if (/#attach/gi.test(str) === false)
            return next(str);
        const match = ExportAttachMatch(str);
        if (!match)
            return next(str);
        const forword = () => {
            const orgMatch = match.shift();
            if (!orgMatch)
                return process.nextTick(() => next(str));
            const path = orgMatch.replace(/#attach/gi, "").replace(/\r\n/gi, "").trim();
            const abspath = _path.resolve(`${appRoot}${path}`);
            return _fileInfo.exists(abspath, (exists, url) => {
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
                return implStr || "";
            });
        }
        return body;
    }
    static prepareTemplate(ctx, appRoot, str, next) {
        const templats = [];
        const forword = () => {
            const match = ExportExtendMatch(str);
            if (!match) {
                templats.push(str);
                return next(templats);
            }
            const found = match[1];
            if (!found || (found && found.trim().length === 0)) {
                return ctx.transferError(new Error("Invalid template format..."));
            }
            const path = found.replace(/#extends/gi, "").replace(/\r\n/gi, "").replace(/\n/gi, "").trim();
            const abspath = _path.resolve(`${appRoot}${path}`);
            const matchStr = match[0];
            return _fileInfo.exists(abspath, (exists) => {
                if (!exists) {
                    return ctx.transferError(new Error(`Template ${path} not found...`));
                }
                templats.push(str.replace(matchStr, ""));
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
            let len = templats.length;
            try {
                do {
                    len--;
                    if (count === 0) {
                        parentTemplate = templats[len].replace(/\r\n/gi, "8_r_n_gx_8").replace(/\n/gi, "8_n_gx_8");
                        body += parentTemplate;
                        count++;
                        continue;
                    }
                    const match = parentTemplate.match(startTag);
                    if (match === null || (match && match.length === 0)) {
                        throw new Error("Invalid master template... No placeholder tag found....");
                    }
                    parentTemplate = templats[len].replace(/\r\n/gi, "8_r_n_gx_8").replace(/\n/gi, "8_n_gx_8");
                    body = this.margeTemplate(match, parentTemplate, body);
                } while (len > 0);
                return process.nextTick(() => next(body.replace(/8_r_n_gx_8/gi, "\r\n").replace(/8_n_gx_8/gi, "\n")));
            }
            catch (e) {
                return ctx.transferError(e);
            }
        });
    }
    static parse(ctx, appRoot, str, next) {
        return this.implimentTemplateExtend(ctx, appRoot, str, (istr) => {
            return this.implimentAttachment(ctx, appRoot, istr, (astr) => {
                return next(astr.replace(/^\s*$(?:\r\n?|\n)/gm, "\n"));
            });
        });
    }
}
class TemplateCore {
    static compile(str, next) {
        if (!str) {
            return process.nextTick(() => next({ str: "", err: new Error("No script found to compile....") }));
        }
        try {
            const sandBox = `${(0, app_util_1.generateRandomString)(30)}_thisNext`;
            global.sow.templateCtx[sandBox] = templateNext;
            // bug fix by rajib chy on 8:16 PM 3/23/2021
            // Error: ctx.addError(ctx, ex) argument error
            const script = new _vm.Script(`sow.templateCtx.${sandBox} = async function( ctx, next, isCompressed ){\nlet __v8val = "";\nctx.write = function( str ) { __v8val += str; }\ntry{\n ${str}\nreturn next( ctx, __v8val, isCompressed ), __v8val = void 0;\n\n}catch( ex ){\n ctx.addError(ex);\nreturn ctx.next(500);\n}\n};`);
            script.runInContext(_vm.createContext(global));
            const func = global.sow.templateCtx[sandBox];
            delete global.sow.templateCtx[sandBox];
            return process.nextTick(() => next({ str, isScript: true, sandBox: func }));
        }
        catch (e) {
            return process.nextTick(() => next({ str, err: e }));
        }
    }
    static parseScript(str) {
        str = str.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
        const script = str.split('\n');
        let out = "/*__sow_template_script__*/";
        const scriptParser = new ScriptParser();
        const parserInfo = new ParserInfo();
        for (parserInfo.line of script) {
            out += "\n";
            if (!parserInfo.line || (parserInfo.line && parserInfo.line.trim().length === 0)) {
                out += "\r\n__v8val += '';";
                continue;
            }
            parserInfo.line = parserInfo.line.replace(/(?:\r\n|\r|\n)/g, '');
            if (parserInfo.isTagEnd === true) {
                parserInfo.line = "__v8val += \x0f" + parserInfo.line;
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
        scriptParser.dispose();
        out = out.replace(/__v8val \+\= '';/g, '');
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
        return process.nextTick(() => fnext(str, false));
    }
    static run(ctx, appRoot, str, next) {
        return this._run(ctx, appRoot, str, (fstr, isTemplate) => {
            if (this.isScript(fstr)) {
                return this.compile(this.parseScript(fstr.replace(/<script runat="template-engine">([\s\S]+?)<\/script>/gi, (match) => {
                    return match.replace(/<script runat="template-engine">/gi, "{%").replace(/<\/script>/gi, "%}");
                })), next);
            }
            return next({ str: fstr, isScript: false, isTemplate });
        });
    }
}
exports.TemplateCore = TemplateCore;
function canReadFileCache(ctx, filePath, cachePath, next) {
    return _fileInfo.exists(cachePath, (exists) => {
        if (!exists)
            return next(false);
        return fsw.compareFile(filePath, cachePath, (err, changed) => {
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
        return _fileInfo.exists(path, (exists, url) => {
            if (!exists)
                return ctx.next(404);
            return _fs.readFile(url, "utf8", (err, data) => {
                return ctx.handleError(err, () => {
                    return TemplateCore.run(ctx, ctx.server.getPublic(), data.replace(/^\uFEFF/, ''), (result) => {
                        return ctx.handleError(result.err, () => {
                            if (result.sandBox) {
                                try {
                                    result.sandBox(ctx, this.processResponse(status), false);
                                    delete result.sandBox;
                                    return void 0;
                                }
                                catch (e) {
                                    return ctx.transferError(e);
                                }
                            }
                            return ctx.res.type("html").status(200).noCache().send(result.str);
                        });
                    });
                });
            });
        });
    }
    static _getCacheMape(str) {
        return str.replace(/\\/gi, "_").replace(/-/gi, "_");
    }
    static _tryMemCache(ctx, path, status, next) {
        const key = this._getCacheMape(path);
        const cache = _tw.cache[key];
        if (cache)
            return process.nextTick(() => next(cache));
        return _fileInfo.exists(path, (exists, url) => {
            if (!exists)
                return ctx.next(404);
            return _fs.readFile(url, "utf8", (err, data) => {
                return ctx.handleError(err, () => {
                    return TemplateCore.run(ctx, ctx.server.getPublic(), data.replace(/^\uFEFF/, ''), (result) => {
                        return ctx.handleError(result.err, () => {
                            _tw.cache[key] = result.sandBox || result.str;
                            return next(_tw.cache[key]);
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
            return ctx.res.type("html").noCache().status(status.code).end(func), void 0;
        });
    }
    static _tryFileCacheOrLive(ctx, cacheKey, filePath, next) {
        const cachePath = `${filePath}.cach`;
        const useFullOptimization = ctx.server.config.useFullOptimization;
        return canReadFileCache(ctx, filePath, cachePath, (readCache) => {
            if (!readCache) {
                return _fs.readFile(filePath, "utf8", (err, data) => {
                    return ctx.handleError(err, () => {
                        return TemplateCore.run(ctx, ctx.server.getPublic(), data.replace(/^\uFEFF/, ''), (result) => {
                            return ctx.handleError(result.err, () => {
                                if (useFullOptimization) {
                                    _tw.cache[cacheKey] = {
                                        data: result.str,
                                        isScriptTemplate: result.isScript
                                    };
                                }
                                return _fs.writeFile(cachePath, result.str, (werr) => {
                                    return ctx.handleError(werr, () => {
                                        return next(result.sandBox || result.str);
                                    });
                                });
                            });
                        });
                    });
                });
            }
            return _fs.readFile(cachePath, "utf8", (err, data) => {
                return ctx.handleError(err, () => {
                    const isScript = TemplateCore.isScriptTemplate(data);
                    if (useFullOptimization) {
                        _tw.cache[cacheKey] = {
                            data, isScriptTemplate: isScript
                        };
                    }
                    if (isScript) {
                        return TemplateCore.compile(data, (result) => {
                            return ctx.handleError(result.err, () => {
                                return next(result.sandBox || result.str);
                            });
                        });
                    }
                    return next(data);
                });
            });
        });
    }
    static _hadleCacheResponse(ctx, status, func) {
        if (typeof (func) === "function") {
            try {
                return func(ctx, this.processResponse(status));
            }
            catch (e) {
                return ctx.transferError(e);
            }
        }
        return ctx.res.type("html").noCache().status(status.code).end(func), void 0;
    }
    static tryFileCacheOrLive(ctx, path, status) {
        const cacheKey = this._getCacheMape(path);
        if (ctx.server.config.useFullOptimization) {
            if (_tw.cache[cacheKey]) {
                ctx.res.setHeader('x-served-from', 'mem-cache');
                if (_tw.cache[cacheKey].isScriptTemplate) {
                    return TemplateCore.compile(_tw.cache[cacheKey].data, (result) => {
                        return ctx.handleError(result.err, () => {
                            return this._hadleCacheResponse(ctx, status, result.sandBox || result.str);
                        });
                    });
                }
                return this._hadleCacheResponse(ctx, status, _tw.cache[cacheKey].data);
            }
        }
        return _fileInfo.exists(path, (exists, filePath) => {
            ctx.handleError(null, () => {
                if (!exists)
                    return ctx.next(404);
                return this._tryFileCacheOrLive(ctx, cacheKey, filePath, (func) => this._hadleCacheResponse(ctx, status, func));
            });
        });
    }
}
class Template {
    static parse(ctx, path, status) {
        if (!status)
            status = http_status_1.HttpStatus.getResInfo(path, 200);
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
//# sourceMappingURL=app-template.js.map