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
const _path = __importStar(require("path"));
const _isPlainObject = (obj) => {
    if (obj === null || obj === undefined)
        return false;
    return typeof (obj) === 'object' && Object.prototype.toString.call(obj) === "[object Object]";
};
const _extend = (destination, source) => {
    if (!_isPlainObject(destination) || !_isPlainObject(source))
        throw new TypeError(`Invalid arguments defined. Arguments should be Object instance. destination type ${typeof (destination)} and source type ${typeof (source)}`);
    for (const property in source) {
        if (property === "__proto__" || property === "constructor")
            continue;
        if (!source.hasOwnProperty(property))
            continue;
        destination[property] = source[property];
    }
    return destination;
};
const _deepExtend = (destination, source) => {
    if (typeof (source) === "function")
        source = source();
    if (!_isPlainObject(destination) || !_isPlainObject(source))
        throw new TypeError(`Invalid arguments defined. Arguments should be Object instance. destination type ${typeof (destination)} and source type ${typeof (source)}`);
    // tslint:disable-next-line: forin
    for (const property in source) {
        if (property === "__proto__" || property === "constructor")
            continue;
        if (!source.hasOwnProperty(property))
            continue;
        const s = source[property];
        const d = destination[property];
        if (_isPlainObject(d) && _isPlainObject(s)) {
            _deepExtend(d, s);
            continue;
        }
        destination[property] = source[property];
    }
    return destination;
};
// tslint:disable-next-line: no-namespace
var Util;
(function (Util) {
    function guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            // tslint:disable-next-line: no-bitwise
            const r = Math.random() * 16 | 0;
            // tslint:disable-next-line: no-bitwise
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    Util.guid = guid;
    function extend(destination, source, deep) {
        if (deep === true)
            return _deepExtend(destination, source);
        return _extend(destination, source);
    }
    Util.extend = extend;
    function clone(source) {
        return _extend({}, source);
    }
    Util.clone = clone;
    /** Checks whether the specified value is an object. true if the value is an object; false otherwise.*/
    function isPlainObject(obj) {
        return _isPlainObject(obj);
    }
    Util.isPlainObject = isPlainObject;
    /** Checks whether the specified value is an array object. true if the value is an array object; false otherwise.*/
    function isArrayLike(obj) {
        if (obj === null || obj === undefined)
            return false;
        const result = Object.prototype.toString.call(obj);
        return result === "[object NodeList]" || result === "[object Array]" ? true : false;
    }
    Util.isArrayLike = isArrayLike;
    /** compair a stat.mtime > b stat.mtime */
    function compairFile(a, b) {
        const astat = _fs.statSync(a);
        const bstat = _fs.statSync(b);
        if (astat.mtime.getTime() > bstat.mtime.getTime())
            return true;
        return false;
    }
    Util.compairFile = compairFile;
    function pipeOutputStream(absPath, ctx) {
        let openenedFile = _fs.createReadStream(absPath);
        openenedFile.pipe(ctx.res);
        return ctx.res.on('close', () => {
            if (openenedFile) {
                openenedFile.unpipe(ctx.res);
                openenedFile.close();
                openenedFile = Object.create(null);
            }
            ctx.next(200);
        }), void 0;
    }
    Util.pipeOutputStream = pipeOutputStream;
    function readJsonAsync(absPath) {
        const jsonstr = _fs.readFileSync(absPath, "utf8").replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "").replace(/^\s*$(?:\r\n?|\n)/gm, "");
        try {
            return JSON.parse(jsonstr);
        }
        catch (e) {
            return void 0;
        }
    }
    Util.readJsonAsync = readJsonAsync;
    function copyFileSync(src, dest) {
        if (_fs.existsSync(dest)) {
            _fs.unlinkSync(dest);
        }
        _fs.copyFileSync(src, dest);
    }
    Util.copyFileSync = copyFileSync;
    function rmdirSync(path) {
        if (!_fs.existsSync(path))
            return;
        const stats = _fs.statSync(path);
        if (stats.isDirectory()) {
            _fs.readdirSync(path).forEach((nextItem) => {
                rmdirSync(_path.join(path, nextItem));
            });
            _fs.rmdirSync(path);
        }
        else {
            _fs.unlinkSync(path);
        }
    }
    Util.rmdirSync = rmdirSync;
    function copySync(src, dest) {
        if (!_fs.existsSync(src))
            return;
        const stats = _fs.statSync(src);
        if (stats.isDirectory()) {
            if (!_fs.existsSync(dest))
                _fs.mkdirSync(dest);
            _fs.readdirSync(src).forEach((nextItem) => {
                copySync(_path.join(src, nextItem), _path.join(dest, nextItem));
            });
        }
        else {
            _fs.copyFileSync(src, dest);
        }
    }
    Util.copySync = copySync;
    function isExists(path, next) {
        const url = _path.resolve(path);
        if (!_fs.existsSync(url)) {
            // tslint:disable-next-line: no-unused-expression
            return (next ? next(404, true) : undefined), false;
        }
        return url;
    }
    Util.isExists = isExists;
    function mkdirSync(rootDir, targetDir) {
        if (!rootDir || typeof (rootDir) !== "string")
            throw new Error("Invalid argument");
        let fullPath = "";
        if (targetDir && typeof (targetDir) !== "string")
            throw new Error("Invalid argument");
        let sep = "";
        if (targetDir) {
            if (targetDir.charAt(0) === '.')
                throw new Error("No need to defined start point....");
            fullPath = _path.resolve(rootDir, targetDir);
            sep = "/";
        }
        else {
            fullPath = _path.resolve(rootDir);
            // so we've to start form drive:\
            targetDir = fullPath;
            sep = _path.sep;
            rootDir = _path.isAbsolute(targetDir) ? sep : '';
        }
        if (_fs.existsSync(fullPath))
            return true;
        targetDir.split(sep).reduce((parentDir, childDir) => {
            if (!childDir)
                return parentDir;
            const curDir = _path.resolve(parentDir, childDir);
            if (!_fs.existsSync(curDir)) {
                _fs.mkdirSync(curDir);
            }
            return curDir;
        }, rootDir);
        return _fs.existsSync(fullPath);
    }
    Util.mkdirSync = mkdirSync;
    function sendResponse(req, res, next, reqPath) {
        const url = isExists(reqPath, next);
        if (!url)
            return;
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(_fs.readFileSync(String(url)));
    }
    Util.sendResponse = sendResponse;
    function getExtension(reqPath) {
        const index = reqPath.lastIndexOf(".");
        if (index > 0) {
            return reqPath.substring(index + 1).toLowerCase();
        }
        return void 0;
    }
    Util.getExtension = getExtension;
})(Util = exports.Util || (exports.Util = {}));
