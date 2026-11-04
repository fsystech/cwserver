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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Template = exports.TemplateCore = void 0;
exports.templateNext = templateNext;
// 9:01 PM 5/2/2020
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _vm = __importStar(require("node:vm"));
const _zlib = __importStar(require("node:zlib"));
const _path = __importStar(require("node:path"));
const node_util_1 = require("node:util");
const http_status_1 = require("./http-status");
const fsw = __importStar(require("./fsw"));
const app_util_1 = require("./app-util");
const node_os_1 = require("node:os");
const file_info_1 = require("./file-info");
const app_template_ctx_1 = require("./app-template-ctx");
const _isWin = (0, node_os_1.platform)() === "win32";
const _fsp = _fs.promises;
const _gzipAsync = (0, node_util_1.promisify)(_zlib.gzip);
const MAX_TEMPLATE_DEPTH = 32;
const _RE_ATTACH = /#attach/i;
const _RE_EXTENDS = /#extends/i;
const _RE_SCRIPT = /{%|{=|<script runat="template-engine">/i;
function templateNext(ctx, next, isCompressed) {
    throw new Error("Function not implemented.");
}
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
        if (!parserInfo.line.includes(parserInfo.tag)) {
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
    }
    dispose() {
        this.tag = null;
        this._cmnt = null;
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
    static implimentAttachment(appRoot, str) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!_RE_ATTACH.test(str))
                return str;
            const match = ExportAttachMatch(str);
            if (!match)
                return str;
            // read every attachment in parallel, then replace them in order
            const contents = yield Promise.all(match.map((orgMatch) => __awaiter(this, void 0, void 0, function* () {
                const path = orgMatch.replace(/#attach/gi, "").replace(/\r\n/gi, "").trim();
                const abspath = _path.resolve(`${appRoot}${path}`);
                const { exists, url } = yield _fileInfo.existsAsync(abspath);
                if (!exists) {
                    throw new Error(`Attachement ${path} not found...`);
                }
                return yield _fsp.readFile(url, "utf8");
            })));
            for (let i = 0; i < match.length; i++) {
                // \n is reuired for tailing gurd
                const data = contents[i] + "\n";
                str = str.replace(match[i], () => data);
            }
            return str;
        });
    }
    static mergeTemplate(match, template, body) {
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
    static prepareTemplate(appRoot, str) {
        return __awaiter(this, void 0, void 0, function* () {
            const templats = [];
            for (let depth = 0; depth < MAX_TEMPLATE_DEPTH; depth++) {
                const match = ExportExtendMatch(str);
                if (!match) {
                    templats.push(str);
                    return templats;
                }
                const found = match[1];
                if (!found || (found && found.trim().length === 0)) {
                    throw new Error("Invalid template format...");
                }
                const path = found.replace(/#extends/gi, "").replace(/\r\n/gi, "").replace(/\n/gi, "").trim();
                const abspath = _path.resolve(`${appRoot}${path}`);
                const { exists } = yield _fileInfo.existsAsync(abspath);
                if (!exists) {
                    throw new Error(`Template ${path} not found...`);
                }
                templats.push(str.replace(match[0], () => ""));
                const data = yield _fsp.readFile(abspath, "utf8");
                str = data.replace(/^\uFEFF/, '');
            }
            throw new Error(`Template extends depth exceeded ${MAX_TEMPLATE_DEPTH}...`);
        });
    }
    static implimentTemplateExtend(appRoot, str) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!_RE_EXTENDS.test(str))
                return str;
            const templates = yield this.prepareTemplate(appRoot, str);
            const templatesLength = templates.length - 1;
            const startTagPattern = /<placeholder[^>]*>/gi;
            let parentTemplate = templates[templatesLength].replace(/\r\n/gi, '8rngx8').replace(/\n/gi, '8ngx8');
            let body = parentTemplate;
            for (let i = templatesLength - 1; i >= 0; i--) {
                const currentTemplate = templates[i].replace(/\r\n/gi, '8rngx8').replace(/\n/gi, '8ngx8');
                const matches = parentTemplate.match(startTagPattern);
                if (matches === null || (matches && matches.length === 0)) {
                    throw new Error("Invalid master template. No placeholder tag found.");
                }
                parentTemplate = currentTemplate;
                body = this.mergeTemplate(matches, parentTemplate, body);
            }
            return body.replace(/8rngx8/gi, "\r\n").replace(/8ngx8/gi, "\n");
        });
    }
    /**
     * Resolve `#extends` and `#attach` directives.
     * Rejects when a template/attachment is missing or malformed.
     */
    static parseAsync(appRoot, str) {
        return __awaiter(this, void 0, void 0, function* () {
            const istr = yield this.implimentTemplateExtend(appRoot, str);
            const astr = yield this.implimentAttachment(appRoot, istr);
            return astr.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
        });
    }
}
class TemplateCore {
    /**
     * Compile a template script into a reusable sandbox function.
     * Never throws; failures are reported in `CompilerResult.err`.
     */
    static compileScript(str, vimCtx) {
        if (!str) {
            return { str: "", err: new Error("No script found to compile....") };
        }
        try {
            const sandBox = `${(0, app_util_1.generateRandomString)(30)}_thisNext`;
            app_template_ctx_1.TemplateCtx.setCtx(sandBox, templateNext);
            // bug fix by rajib chy on 8:16 PM 3/23/2021
            // Error: ctx.addError(ctx, ex) argument error
            const script = new _vm.Script(`cw.setCtx("${sandBox}", async function( ctx, next, isCompressed ){\nlet __v8val = "";\nctx.write = function( str ) { __v8val += str; }\ntry{\n ${str}\nreturn next( ctx, __v8val, isCompressed ), __v8val = null;\n\n}catch( ex ){\n ctx.addError(ex);\nreturn ctx.next(500);\n}\n});`);
            script.runInContext(_vm.createContext(Object.assign(Object.assign(Object.assign({}, vimCtx), global), { // includes standard globals
                Buffer, cw: app_template_ctx_1.TemplateCtx })));
            const func = app_template_ctx_1.TemplateCtx.getCtx(sandBox);
            app_template_ctx_1.TemplateCtx.deleteCtx(sandBox);
            return { str, isScript: true, sandBox: func };
        }
        catch (e) {
            return { str, err: e };
        }
    }
    /** @deprecated Use {@link compileScript} */
    static compile(str, next, vimCtx) {
        const result = this.compileScript(str, vimCtx);
        process.nextTick(() => next(result));
    }
    static parseScript(str) {
        str = str.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
        const script = str.split('\n');
        let out = "/*__cw_template_script__*/";
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
        return _RE_SCRIPT.test(str);
    }
    static isTemplate(str) {
        return _RE_ATTACH.test(str) || _RE_EXTENDS.test(str);
    }
    static isScriptTemplate(str) {
        const index = str.indexOf("\n");
        if (index < 0)
            return false;
        return str.substring(0, index).indexOf("__cw_template_script__") > -1;
    }
    /**
     * Resolve directives (`#extends`, `#attach`) and compile the script (if any).
     * Rejects when a template is missing or malformed.
     */
    static runAsync(ctx, appRoot, str) {
        return __awaiter(this, void 0, void 0, function* () {
            const isTemplate = this.isTemplate(str);
            const fstr = isTemplate ? yield TemplateParser.parseAsync(appRoot, str) : str;
            if (this.isScript(fstr)) {
                return this.compileScript(this.parseScript(fstr.replace(/<script runat="template-engine">([\s\S]+?)<\/script>/gi, (match) => {
                    return match.replace(/<script runat="template-engine">/gi, "{%").replace(/<\/script>/gi, "%}");
                })), ctx.server.createVimContext());
            }
            return { str: fstr, isScript: false, isTemplate };
        });
    }
    /** @deprecated Use {@link runAsync} */
    static run(ctx, appRoot, str, next) {
        this.runAsync(ctx, appRoot, str).then((result) => next(result), (err) => ctx.transferError(err));
    }
}
exports.TemplateCore = TemplateCore;
function canReadFileCache(filePath, cachePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const { exists } = yield _fileInfo.existsAsync(cachePath);
        if (!exists)
            return false;
        if (yield fsw.compareFileAsync(filePath, cachePath)) {
            yield _fsp.unlink(cachePath);
            _fileInfo.rmove(cachePath);
            return false;
        }
        return true;
    });
}
function toEntry(result) {
    return result.sandBox ? { sandBox: result.sandBox } : { html: result.str };
}
class TemplateLink {
    static processResponse(status) {
        let responder = this._responders.get(status.code);
        if (!responder) {
            responder = (ctx, body, isCompressed) => __awaiter(this, void 0, void 0, function* () {
                if (isCompressed && isCompressed === true) {
                    try {
                        const buff = yield _gzipAsync(Buffer.from(body));
                        if (!ctx.isDisposed) {
                            ctx.res.type("html").noCache().status(status.code, {
                                'Content-Encoding': 'gzip',
                                'Content-Length': buff.length
                            }).end(buff);
                        }
                        return;
                    }
                    catch (error) {
                        return ctx.handleError(error, () => void 0);
                    }
                }
                if (!ctx.isDisposed) {
                    ctx.res.type("html").noCache().status(status.code, {
                        'Content-Length': Buffer.byteLength(body)
                    }).end(body);
                }
            });
            this._responders.set(status.code, responder);
        }
        return responder;
    }
    static _getCacheMape(str) {
        return str.replace(/\\/gi, "_").replace(/-/gi, "_");
    }
    static _readSource(ctx, url) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield _fsp.readFile(url, "utf8");
            const result = yield TemplateCore.runAsync(ctx, ctx.server.getPublic(), data.replace(/^\uFEFF/, ''));
            if (result.err)
                throw result.err;
            return result;
        });
    }
    static _respondAsync(ctx, status, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (entry.sandBox) {
                try {
                    // sandbox function handles its own errors (ctx.addError + ctx.next(500))
                    yield entry.sandBox(ctx, this.processResponse(status));
                }
                catch (e) {
                    ctx.transferError(e);
                }
                return;
            }
            ctx.res.type("html").noCache().status(status.code).end(entry.html);
        });
    }
    /** `template.cache = false`: compile on every request. */
    static tryLive(ctx, path, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { exists, url } = yield _fileInfo.existsAsync(path);
                if (!exists)
                    return ctx.next(404);
                const result = yield this._readSource(ctx, url);
                if (result.sandBox) {
                    try {
                        yield result.sandBox(ctx, this.processResponse(status), false);
                    }
                    catch (e) {
                        ctx.transferError(e);
                    }
                    return;
                }
                ctx.res.type("html").status(200).noCache().send(result.str);
            }
            catch (e) {
                ctx.transferError(e);
            }
        });
    }
    /** `template.cacheType = "MEM"` */
    static tryMemCache(ctx, path, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = this._getCacheMape(path);
                let entry = this._tw.get(key);
                if (!entry) {
                    const { exists, url } = yield _fileInfo.existsAsync(path);
                    if (!exists)
                        return ctx.next(404);
                    entry = toEntry(yield this._readSource(ctx, url));
                    this._tw.set(key, entry);
                }
                return this._respondAsync(ctx, status, entry);
            }
            catch (e) {
                ctx.transferError(e);
            }
        });
    }
    static _loadFileCacheOrLive(ctx, cacheKey, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachePath = `${filePath}.cach`;
            const useFullOptimization = ctx.server.config.useFullOptimization;
            let entry;
            if (!(yield canReadFileCache(filePath, cachePath))) {
                const result = yield this._readSource(ctx, filePath);
                entry = toEntry(result);
                yield _fsp.writeFile(cachePath, result.str);
                // `cachePath` has been just created. forget the old "not exists" stat.
                _fileInfo.rmove(cachePath);
            }
            else {
                const data = yield _fsp.readFile(cachePath, "utf8");
                if (TemplateCore.isScriptTemplate(data)) {
                    const result = TemplateCore.compileScript(data, ctx.server.createVimContext());
                    if (result.err)
                        throw result.err;
                    entry = toEntry(result);
                }
                else {
                    entry = { html: data };
                }
            }
            if (useFullOptimization) {
                this._tw.set(cacheKey, entry);
            }
            return entry;
        });
    }
    /** `template.cacheType = "FILE"` (default) */
    static tryFileCacheOrLive(ctx, path, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cacheKey = this._getCacheMape(path);
                if (ctx.server.config.useFullOptimization) {
                    const entry = this._tw.get(cacheKey);
                    if (entry) {
                        ctx.res.setHeader('x-served-from', 'mem-cache');
                        return this._respondAsync(ctx, status, entry);
                    }
                }
                const { exists, url } = yield _fileInfo.existsAsync(path);
                if (!exists)
                    return ctx.next(404);
                return this._respondAsync(ctx, status, yield this._loadFileCacheOrLive(ctx, cacheKey, url));
            }
            catch (e) {
                ctx.transferError(e);
            }
        });
    }
}
TemplateLink._tw = new Map();
TemplateLink._responders = new Map();
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