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

// 9:01 PM 5/2/2020
// by rajib chy
import * as _fs from 'node:fs';
import * as _vm from 'node:vm';
import * as _zlib from 'node:zlib';
import * as _path from 'node:path';
import { promisify } from 'node:util';
import { HttpStatus } from './http-status';
import type { IResInfo, IDispose } from './app-static';
import type { IContext } from './context';
import * as fsw from './fsw';
import { generateRandomString } from './app-util';
import { platform } from 'node:os';
import { FileInfoCacheHandler, type IFileInfoCacheHandler } from './file-info';
import { TemplateCtx, type SandBox, type SandBoxNext } from './app-template-ctx';

const _isWin: boolean = platform() === "win32";
const _fsp = _fs.promises;
const _gzipAsync = promisify(_zlib.gzip);
const MAX_TEMPLATE_DEPTH = 32;
const _RE_ATTACH = /#attach/i;
const _RE_EXTENDS = /#extends/i;
const _RE_SCRIPT = /{%|{=|<script runat="template-engine">/i;

interface IScriptTag {
    readonly lre: RegExp;
    readonly rre: RegExp;
    readonly repre: RegExp;
    l: string;
    r: string;
}

interface IParserInfo {
    line: string;
    tag: string;
    isTagStart: boolean;
    isTagEnd: boolean;
    startTageName?: string;
    isLastTag: boolean;
}

interface ITag {
    script: IScriptTag;
    write: IScriptTag;
}

interface IScriptParser extends IDispose {
    tag: ITag;
    startTage(parserInfo: IParserInfo): void;
    endTage(parserInfo: IParserInfo): void;
}

export type CompilerResult = {
    str: string; isScript?: boolean; isTemplate?: boolean;
    sandBox?: SandBox,
    err?: NodeJS.ErrnoException | Error | null
};

type TemplateNextFunc = (params: CompilerResult) => void;

export function templateNext(
    ctx: IContext, next: SandBoxNext, isCompressed?: boolean
): Promise<void> {
    throw new Error("Function not implemented.");
}

class ParserInfo implements IParserInfo {
    public line: string;
    public tag: string;
    public isTagStart: boolean;
    public isTagEnd: boolean;
    public startTageName?: string;
    public isLastTag: boolean;
    constructor() {
        this.line = ""; this.tag = ""; this.isTagStart = false;
        this.isTagEnd = true; this.startTageName = void 0;
        this.isLastTag = false;
    }
}

class ScriptTag implements IScriptTag {
    public l: string;
    public get lre(): RegExp {
        return /{%/gi;
    }
    public r: string;
    public get rre(): RegExp {
        return /%}/gi;
    }
    public repre: RegExp;
    constructor() {
        this.l = '{%';
        this.r = '%}';
        this.repre = /NO_NEED/gi;
    }
}

class WriteTag implements IScriptTag {
    public l: string;
    public get lre(): RegExp {
        return /{=/gi;
    }
    public r: string;
    public get rre(): RegExp {
        return /=}/gi;
    }
    public get repre(): RegExp {
        return /{=(.+?)=}/gi;
    }
    constructor() {
        this.l = '{='; this.r = '=}';
    }
}

class Tag implements ITag {
    public script: IScriptTag;
    public write: IScriptTag;
    constructor() {
        this.script = new ScriptTag();
        this.write = new WriteTag();
    }
}

class CommentTag {
    public get jsStart() {
        return /\/\*{%\*\//gi;
    }
    public get jsEnd() {
        return /\/\*%}\*\//gi;
    }
    public get htmlStart() {
        return /<\!--{%-->/gi;
    }
    public get htmlEnd() {
        return /<\!--%}-->/gi;
    }
}

class ScriptParser implements IScriptParser {
    public tag: ITag = new Tag();
    private _cmnt: CommentTag = new CommentTag();

    public startTage(parserInfo: IParserInfo): void {

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
                    parserInfo.isTagEnd = true; parserInfo.isTagStart = false;
                    const index: number = parserInfo.line.indexOf("{");
                    let startPart: string | undefined;
                    if (this._cmnt.jsStart.test(parserInfo.line)/** hasJsCmnt */) {
                        if (index > 2) {
                            startPart = parserInfo.line.substring(0, index - 2) + "\x0f;";
                            parserInfo.line = parserInfo.line.substring(index + 4);
                        }
                        parserInfo.line = parserInfo.line.replace(this._cmnt.jsEnd, "");
                        parserInfo.line += " __v8val += \x0f";
                    } else if (this._cmnt.htmlStart.test(parserInfo.line) /* hasHtmlCmnt*/) {
                        if (index > 4) {
                            startPart = parserInfo.line.substring(0, index - 4) + "\x0f;";
                            parserInfo.line = parserInfo.line.substring(index + 5);
                        }
                        parserInfo.line = parserInfo.line.replace(this._cmnt.htmlEnd, "");
                        parserInfo.line += " __v8val += \x0f";
                    } else {
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
                if (this._cmnt.jsStart.test(parserInfo.line)/** hasJsCmnt */) {
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
                        parserInfo.line = parserInfo.line.replace(this.tag.write.repre, (match: string): string => {
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

    public endTage(parserInfo: IParserInfo): void {
        if (parserInfo.isTagStart === false && parserInfo.isTagEnd === true)
            return;

        if (parserInfo.isTagStart !== false && parserInfo.isTagEnd !== true) {

            parserInfo.isTagStart = true;

            switch (parserInfo.tag) {
                case this.tag.script.r: /*%}*/
                    if (this.tag.script.rre.test(parserInfo.line) === true) {
                        parserInfo.isTagEnd = true; parserInfo.isTagStart = false;
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

    public dispose() {
        this.tag = null;
        this._cmnt = null;
    }
}

function ExportAttachMatch(str: string): RegExpMatchArray | null {
    let match = null;

    if (_isWin) {
        match = str.match(/#attach([\s\S]+?)\r\n/gi);

        if (!match) {
            match = str.match(/#attach([\s\S]+?)\n/gi);
        }

    } else {

        match = str.match(/#attach([\s\S]+?)\n/gi);

        if (!match) {
            match = str.match(/#attach([\s\S]+?)\r\n/gi);
        }
    }

    return match;
}
function ExportExtendMatch(str: string): RegExpExecArray | null {
    let match: RegExpExecArray | null = /#extends([\s\S]+?)\r\n/gi.exec(str);
    if (!match) {
        match = /#extends([\s\S]+?)\n/gi.exec(str);
    }
    return match;
}

const _fileInfo: IFileInfoCacheHandler = new FileInfoCacheHandler();

class TemplateParser {
    private static async implimentAttachment(
        appRoot: string, str: string
    ): Promise<string> {
        if (!_RE_ATTACH.test(str)) return str;

        const match: RegExpMatchArray | null = ExportAttachMatch(str);
        if (!match) return str;

        // read every attachment in parallel, then replace them in order
        const contents = await Promise.all(match.map(async (orgMatch: string): Promise<string> => {
            const path = orgMatch.replace(/#attach/gi, "").replace(/\r\n/gi, "").trim();
            const abspath = _path.resolve(`${appRoot}${path}`);
            const { exists, url } = await _fileInfo.existsAsync(abspath);

            if (!exists) {
                throw new Error(`Attachement ${path} not found...`);
            }

            return await _fsp.readFile(url, "utf8");
        }));

        for (let i = 0; i < match.length; i++) {
            // \n is reuired for tailing gurd
            const data = contents[i] + "\n";
            str = str.replace(match[i], () => data);
        }

        return str;
    }

    private static mergeTemplate(
        match: string[],
        template: string,
        body: string
    ): string {
        for (const key of match) {
            const tmplArr = /<placeholder id=\"(.*)\">/gi.exec(key.trim());
            if (!tmplArr) {
                throw new Error(`Invalid template format... ${key}`);
            }
            const tmplId = tmplArr[1];
            if (!tmplId || (tmplId && tmplId.trim().length === 0)) {
                throw new Error(`Invalid template format... ${key}`);
            }
            let implStr: any = void 0;
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

    private static async prepareTemplate(
        appRoot: string, str: string
    ): Promise<string[]> {
        const templats: string[] = [];

        for (let depth = 0; depth < MAX_TEMPLATE_DEPTH; depth++) {
            const match: RegExpExecArray | null = ExportExtendMatch(str);

            if (!match) {
                templats.push(str);
                return templats;
            }

            const found: string | undefined = match[1];
            if (!found || (found && found.trim().length === 0)) {
                throw new Error("Invalid template format...");
            }

            const path = found.replace(/#extends/gi, "").replace(/\r\n/gi, "").replace(/\n/gi, "").trim();
            const abspath = _path.resolve(`${appRoot}${path}`);
            const { exists } = await _fileInfo.existsAsync(abspath);

            if (!exists) {
                throw new Error(`Template ${path} not found...`);
            }

            templats.push(str.replace(match[0], () => ""));

            const data = await _fsp.readFile(abspath, "utf8");
            str = data.replace(/^\uFEFF/, '');
        }

        throw new Error(`Template extends depth exceeded ${MAX_TEMPLATE_DEPTH}...`);
    }

    private static async implimentTemplateExtend(
        appRoot: string, str: string
    ): Promise<string> {
        if (!_RE_EXTENDS.test(str)) return str;

        const templates = await this.prepareTemplate(appRoot, str);
        const templatesLength: number = templates.length - 1;
        const startTagPattern: RegExp = /<placeholder[^>]*>/gi;
        let parentTemplate: string = templates[templatesLength].replace(/\r\n/gi, '8rngx8').replace(/\n/gi, '8ngx8');
        let body: string = parentTemplate;

        for (let i = templatesLength - 1; i >= 0; i--) {
            const currentTemplate = templates[i].replace(/\r\n/gi, '8rngx8').replace(/\n/gi, '8ngx8');
            const matches: RegExpMatchArray | null = parentTemplate.match(startTagPattern);
            if (matches === null || (matches && matches.length === 0)) {
                throw new Error("Invalid master template. No placeholder tag found.");
            }
            parentTemplate = currentTemplate;
            body = this.mergeTemplate(matches, parentTemplate, body);
        }

        return body.replace(/8rngx8/gi, "\r\n").replace(/8ngx8/gi, "\n");
    }

    /**
     * Resolve `#extends` and `#attach` directives.
     * Rejects when a template/attachment is missing or malformed.
     */
    public static async parseAsync(
        appRoot: string, str: string
    ): Promise<string> {
        const istr = await this.implimentTemplateExtend(appRoot, str);
        const astr = await this.implimentAttachment(appRoot, istr);
        return astr.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
    }
}

export class TemplateCore {
    /**
     * Compile a template script into a reusable sandbox function.
     * Never throws; failures are reported in `CompilerResult.err`.
     */
    public static compileScript(
        str: string | undefined,
        vimCtx: Record<string, any>
    ): CompilerResult {

        if (!str) {
            return { str: "", err: new Error("No script found to compile....") };
        }

        try {

            const sandBox: string = `${generateRandomString(30)}_thisNext`;
            TemplateCtx.setCtx(sandBox, templateNext);

            // bug fix by rajib chy on 8:16 PM 3/23/2021
            // Error: ctx.addError(ctx, ex) argument error
            const script: _vm.Script = new _vm.Script(`cw.setCtx("${sandBox}", async function( ctx, next, isCompressed ){\nlet __v8val = "";\nctx.write = function( str ) { __v8val += str; }\ntry{\n ${str}\nreturn next( ctx, __v8val, isCompressed ), __v8val = void 0;\n\n}catch( ex ){\n ctx.addError(ex);\nreturn ctx.next(500);\n}\n});`);

            script.runInContext(_vm.createContext({
                ...vimCtx,
                ...global,       // includes standard globals
                Buffer,          // explicitly expose Buffer
                cw: TemplateCtx, // Template context
            }));

            const func: SandBox | undefined = TemplateCtx.getCtx(sandBox);

            TemplateCtx.deleteCtx(sandBox);

            return { str, isScript: true, sandBox: func };
        } catch (e: any) {
            return { str, err: e };
        }
    }

    /** @deprecated Use {@link compileScript} */
    public static compile(
        str: string | undefined, next: TemplateNextFunc,
        vimCtx: Record<string, any>
    ): void {
        const result = this.compileScript(str, vimCtx);
        process.nextTick(() => next(result));
    }

    private static parseScript(str: string): string | undefined {
        str = str.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
        const script = str.split('\n');
        let out = "/*__cw_template_script__*/";
        const scriptParser: IScriptParser = new ScriptParser();
        const parserInfo: IParserInfo = new ParserInfo();
        for (parserInfo.line of script) {
            out += "\n";
            if (!parserInfo.line || (parserInfo.line && parserInfo.line.trim().length === 0)) {
                out += "\r\n__v8val += '';"; continue;
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
            } else {
                parserInfo.line = parserInfo.line.replace(/\x0f/g, "'");
                out += parserInfo.line;
            }
        }
        scriptParser.dispose();
        out = out.replace(/__v8val \+\= '';/g, '');
        return out.replace(/^\s*$(?:\r\n?|\n)/gm, "\n");
    }

    private static isScript(str: string): boolean {
        return _RE_SCRIPT.test(str);
    }

    public static isTemplate(str: string): boolean {
        return _RE_ATTACH.test(str) || _RE_EXTENDS.test(str);
    }

    public static isScriptTemplate(str: string): boolean {
        const index = str.indexOf("\n");
        if (index < 0) return false;
        return str.substring(0, index).indexOf("__cw_template_script__") > -1;
    }

    /**
     * Resolve directives (`#extends`, `#attach`) and compile the script (if any).
     * Rejects when a template is missing or malformed.
     */
    public static async runAsync(
        ctx: IContext,
        appRoot: string,
        str: string
    ): Promise<CompilerResult> {

        const isTemplate = this.isTemplate(str);
        const fstr = isTemplate ? await TemplateParser.parseAsync(appRoot, str) : str;

        if (this.isScript(fstr)) {
            return this.compileScript(this.parseScript(fstr.replace(/<script runat="template-engine">([\s\S]+?)<\/script>/gi, (match: string): string => {
                return match.replace(/<script runat="template-engine">/gi, "{%").replace(/<\/script>/gi, "%}");
            })), ctx.server.createVimContext());
        }

        return { str: fstr, isScript: false, isTemplate };
    }

    /** @deprecated Use {@link runAsync} */
    public static run(
        ctx: IContext,
        appRoot: string,
        str: string,
        next: TemplateNextFunc
    ): void {
        this.runAsync(ctx, appRoot, str).then(
            (result) => next(result),
            (err) => ctx.transferError(err)
        );
    }
}

/** A cached template: either a compiled sandbox function or a plain html string. */
type TemplateEntry = { sandBox?: SandBox; html?: string; };

async function canReadFileCache(filePath: string, cachePath: string): Promise<boolean> {
    const { exists } = await _fileInfo.existsAsync(cachePath);

    if (!exists)
        return false;

    if (await fsw.compareFileAsync(filePath, cachePath)) {
        await _fsp.unlink(cachePath);
        _fileInfo.rmove(cachePath);
        return false;
    }

    return true;
}

function toEntry(result: CompilerResult): TemplateEntry {
    return result.sandBox ? { sandBox: result.sandBox } : { html: result.str };
}

class TemplateLink {
    private static _tw: Map<string, TemplateEntry> = new Map();
    private static _responders: Map<number, SandBoxNext> = new Map();

    private static processResponse(status: IResInfo): SandBoxNext {
        let responder = this._responders.get(status.code);

        if (!responder) {
            responder = async (ctx: IContext, body: string, isCompressed?: boolean): Promise<void> => {

                if (isCompressed && isCompressed === true) {

                    try {
                        const buff = await _gzipAsync(Buffer.from(body));

                        if (!ctx.isDisposed) {
                            ctx.res.type("html").noCache().status(status.code, {
                                'Content-Encoding': 'gzip',
                                'Content-Length': buff.length
                            }).end(buff);
                        }

                        return;

                    } catch (error: any) {
                        return ctx.handleError(error, () => void 0);
                    }
                }

                if (!ctx.isDisposed) {
                    ctx.res.type("html").noCache().status(status.code, {
                        'Content-Length': Buffer.byteLength(body)
                    }).end(body);
                }
            };

            this._responders.set(status.code, responder);
        }

        return responder;
    }

    private static _getCacheMape(str: string): string {
        return str.replace(/\\/gi, "_").replace(/-/gi, "_");
    }

    private static async _readSource(ctx: IContext, url: string): Promise<CompilerResult> {
        const data = await _fsp.readFile(url, "utf8");
        const result = await TemplateCore.runAsync(ctx, ctx.server.getPublic(), data.replace(/^\uFEFF/, ''));

        if (result.err)
            throw result.err;

        return result;
    }

    private static async _respondAsync(ctx: IContext, status: IResInfo, entry: TemplateEntry): Promise<void> {

        if (entry.sandBox) {

            try {
                // sandbox function handles its own errors (ctx.addError + ctx.next(500))
                await entry.sandBox(ctx, this.processResponse(status));
            } catch (e: any) {
                ctx.transferError(e);
            }

            return;
        }

        ctx.res.type("html").noCache().status(status.code).end(entry.html);
    }

    /** `template.cache = false`: compile on every request. */
    public static async tryLive(ctx: IContext, path: string, status: IResInfo): Promise<void> {
        try {
            const { exists, url } = await _fileInfo.existsAsync(path);

            if (!exists)
                return ctx.next(404);

            const result = await this._readSource(ctx, url);

            if (result.sandBox) {
                try {
                    await result.sandBox(ctx, this.processResponse(status), false);
                } catch (e: any) {
                    ctx.transferError(e);
                }
                return;
            }

            ctx.res.type("html").status(200).noCache().send(result.str);
        } catch (e: any) {
            ctx.transferError(e);
        }
    }

    /** `template.cacheType = "MEM"` */
    public static async tryMemCache(ctx: IContext, path: string, status: IResInfo): Promise<void> {
        try {
            const key = this._getCacheMape(path);
            let entry = this._tw.get(key);

            if (!entry) {
                const { exists, url } = await _fileInfo.existsAsync(path);

                if (!exists)
                    return ctx.next(404);

                entry = toEntry(await this._readSource(ctx, url));
                this._tw.set(key, entry);
            }

            return this._respondAsync(ctx, status, entry);
        } catch (e: any) {
            ctx.transferError(e);
        }
    }

    private static async _loadFileCacheOrLive(
        ctx: IContext, cacheKey: string, filePath: string
    ): Promise<TemplateEntry> {

        const cachePath: string = `${filePath}.cach`;
        const useFullOptimization: boolean = ctx.server.config.useFullOptimization;
        let entry: TemplateEntry;

        if (!await canReadFileCache(filePath, cachePath)) {
            const result = await this._readSource(ctx, filePath);
            entry = toEntry(result);

            await _fsp.writeFile(cachePath, result.str);
            // `cachePath` has been just created. forget the old "not exists" stat.
            _fileInfo.rmove(cachePath);
        } else {
            const data = await _fsp.readFile(cachePath, "utf8");

            if (TemplateCore.isScriptTemplate(data)) {
                const result = TemplateCore.compileScript(data, ctx.server.createVimContext());

                if (result.err)
                    throw result.err;

                entry = toEntry(result);
            } else {
                entry = { html: data };
            }
        }

        if (useFullOptimization) {
            this._tw.set(cacheKey, entry);
        }

        return entry;
    }

    /** `template.cacheType = "FILE"` (default) */
    public static async tryFileCacheOrLive(
        ctx: IContext, path: string, status: IResInfo
    ): Promise<void> {

        try {
            const cacheKey: string = this._getCacheMape(path);

            if (ctx.server.config.useFullOptimization) {
                const entry = this._tw.get(cacheKey);

                if (entry) {
                    ctx.res.setHeader('x-served-from', 'mem-cache');
                    return this._respondAsync(ctx, status, entry);
                }
            }

            const { exists, url } = await _fileInfo.existsAsync(path);

            if (!exists)
                return ctx.next(404);

            return this._respondAsync(
                ctx, status, await this._loadFileCacheOrLive(ctx, cacheKey, url)
            );
        } catch (e: any) {
            ctx.transferError(e);
        }
    }
}

export class Template {
    public static parse(ctx: IContext, path: string, status?: IResInfo): Promise<void> {

        if (!status)
            status = HttpStatus.getResInfo(path, 200);

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
