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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statAsync = statAsync;
exports.stat = stat;
exports.moveFileAsync = moveFileAsync;
exports.moveFile = moveFile;
exports.compareFileAsync = compareFileAsync;
exports.compareFile = compareFile;
exports.compareFileSync = compareFileSync;
exports.isExists = isExists;
exports.isExistsAsync = isExistsAsync;
exports.readJsonAsync = readJsonAsync;
exports.readJson = readJson;
exports.readJsonSync = readJsonSync;
exports.mkdirAsyncx = mkdirAsyncx;
exports.mkdir = mkdir;
exports.mkdirSync = mkdirSync;
exports.rmdir = rmdir;
exports.rmdirSync = rmdirSync;
exports.unlink = unlink;
exports.copyFile = copyFile;
exports.copyFileSync = copyFileSync;
exports.copyDir = copyDir;
exports.copyDirSync = copyDirSync;
exports.opendirAsync = opendirAsync;
exports.getFilesAsync = getFilesAsync;
exports.unlinkAsync = unlinkAsync;
exports.writeFileAsync = writeFileAsync;
exports.mkdirAsync = mkdirAsync;
exports.existsAsync = existsAsync;
// 5:17 PM 6/15/2020
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const _fsp = _fs.promises;
const _fsRmdirSync = typeof (_fs.rmSync) === "function" ? _fs.rmSync : _fs.rmdirSync;
function _fsRmdir(path, options, callback) {
    if (typeof (_fs.rm) === "function") {
        return _fs.rm(path, options, callback);
    }
    return _fs.rmdir(path, callback);
}
function statAsync(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield _fsp.stat(path);
    });
}
function stat(path, next) {
    statAsync(path).then(rs => next(null, rs)).catch(ex => next(ex));
}
function isSameDrive(src, dest) {
    const aroot = _path.parse(src).root;
    const broot = _path.parse(dest).root;
    return aroot.substring(0, aroot.indexOf(":")) === broot.substring(0, broot.indexOf(":"));
}
/** Move file async */
function moveFileAsync(src_1, dest_1) {
    return __awaiter(this, arguments, void 0, function* (src, dest, force = false) {
        if (force !== true && isSameDrive(src, dest)) {
            return yield _fsp.rename(src, dest), true;
        }
        yield _fsp.copyFile(src, dest);
        yield _fsp.unlink(src);
        return true;
    });
}
function moveFile(src, dest, next, force) {
    moveFileAsync(src, dest, force).then(() => next()).catch((ex) => next(ex));
}
function compareFileAsync(a, b) {
    return __awaiter(this, void 0, void 0, function* () {
        const [astat, bstat] = yield Promise.all([
            _fsp.stat(a),
            _fsp.stat(b)
        ]);
        return astat.mtime.getTime() > bstat.mtime.getTime();
    });
}
/** compareFile a stat.mtime > b stat.mtime */
function compareFile(a, b, next, errHandler) {
    compareFileAsync(a, b).then(r => errHandler(null, () => next(null, r))).catch(ex => errHandler(ex, () => next(ex)));
}
/** compareFileSync a stat.mtime > b stat.mtime */
function compareFileSync(a, b) {
    const astat = _fs.statSync(a);
    const bstat = _fs.statSync(b);
    if (astat.mtime.getTime() > bstat.mtime.getTime())
        return true;
    return false;
}
function isExists(path, next) {
    isExistsAsync(path).then(rs => {
        return next(rs.exists, rs.url);
    });
}
function isExistsAsync(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = _path.resolve(path);
        try {
            yield _fsp.stat(url);
            return { exists: true, url };
        }
        catch (ex) {
            return { exists: false, url };
        }
    });
}
function readJsonAsync(absPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield _fsp.readFile(absPath);
        return JSON.parse(data.toString("utf8").replace(/^\uFEFF/, ''));
    });
}
function readJson(absPath, next, errHandler) {
    readJsonAsync(absPath).then(rs => {
        errHandler(null, () => next(null, rs));
    }).catch(ex => errHandler(ex, () => next(ex)));
}
function readJsonSync(absPath) {
    try {
        const jsonstr = _fs.readFileSync(absPath, "utf8").replace(/^\uFEFF/, '').replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "").replace(/^\s*$(?:\r\n?|\n)/gm, "");
        return JSON.parse(jsonstr);
    }
    catch (_a) {
        return null;
    }
}
function mkdirCheckAndCreateAsync(path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!path)
            return false;
        try {
            yield _fsp.stat(path);
            return true;
        }
        catch (_a) {
            try {
                yield _fsp.mkdir(path);
                return true;
            }
            catch (_b) { }
        }
        return false;
    });
}
function mkdirAsyncx(rootDir, targetDir) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!rootDir || rootDir.length === 0) {
            throw new Error("Argument missing...");
        }
        let fullPath = "";
        let sep = "";
        if (targetDir && targetDir.length > 0) {
            if (targetDir.charAt(0) === '.')
                throw new Error("No need to defined start point....");
            fullPath = _path.join(rootDir, targetDir);
            sep = "/";
        }
        else {
            fullPath = _path.resolve(rootDir);
            // so we've to start form drive:\
            targetDir = fullPath;
            sep = _path.sep;
            rootDir = _path.isAbsolute(targetDir) ? sep : '';
        }
        let rootState = null;
        try {
            rootState = yield _fsp.stat(fullPath);
            if (rootState.isDirectory())
                return;
        }
        catch (_a) { }
        if (rootState !== null) {
            throw new Error("Invalid path found...");
        }
        if (_path.parse(fullPath).ext)
            throw new Error("Directory should be end without extension....");
        const tobeCreate = [];
        targetDir.split(sep).reduce((parentDir, childDir) => {
            const curDir = _path.resolve(parentDir, childDir);
            tobeCreate.push(curDir);
            return curDir;
        }, rootDir);
        for (const part of tobeCreate) {
            yield mkdirCheckAndCreateAsync(part);
        }
    });
}
function mkdir(rootDir, targetDir, next, errHandler) {
    mkdirAsyncx(rootDir, targetDir).then(() => errHandler(null, () => next(null))).catch(ex => errHandler(ex, () => next(ex)));
}
function mkdirSync(rootDir, targetDir) {
    if (rootDir.length === 0)
        return false;
    let fullPath = "";
    let sep = "";
    if (targetDir) {
        if (targetDir.charAt(0) === '.')
            throw new Error("No need to defined start point....");
        fullPath = _path.join(rootDir, targetDir);
        sep = "/";
    }
    else {
        fullPath = _path.resolve(rootDir);
        // so we've to start form drive:\
        targetDir = fullPath;
        sep = _path.sep;
        rootDir = _path.isAbsolute(targetDir) ? sep : '';
    }
    if (_fs.existsSync(fullPath)) {
        return _fs.statSync(fullPath).isDirectory();
    }
    if (_path.parse(fullPath).ext)
        return false;
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
function rmdir(path, next, errHandler) {
    return _fs.stat(path, (err, stats) => {
        if (err)
            return next(err);
        if (stats.isDirectory()) {
            return _fs.readdir(path, (rerr, files) => {
                return errHandler(err, () => {
                    const forward = () => {
                        const npath = files.shift();
                        if (!npath) {
                            return _fsRmdir(path, { recursive: true, force: true }, (rmerr) => {
                                return next(rmerr);
                            });
                        }
                        rmdir(_path.join(path, npath), (ferr) => {
                            return errHandler(ferr, () => {
                                return forward();
                            });
                        }, errHandler);
                    };
                    return forward();
                });
            });
        }
        return _fs.unlink(path, (uerr) => {
            return next(uerr);
        });
    });
}
function rmdirSync(path) {
    if (!_fs.existsSync(path))
        return;
    const stats = _fs.statSync(path);
    if (stats.isDirectory()) {
        _fs.readdirSync(path).forEach((nextItem) => {
            rmdirSync(_path.join(path, nextItem));
        });
        _fsRmdirSync(path, { recursive: true, force: true });
    }
    else {
        _fs.unlinkSync(path);
    }
}
function unlink(path, next) {
    return _fs.unlink(path, (err) => {
        return next(err);
    });
}
function copyFile(src, dest, next, errHandler) {
    if (!_path.parse(src).ext)
        return process.nextTick(() => next(new Error("Source file path required....")));
    if (!_path.parse(dest).ext)
        return process.nextTick(() => next(new Error("Dest file path required....")));
    return _fs.stat(src, (errs, stats) => {
        if (errs)
            return next(new Error(`Source directory not found ${src}`));
        return unlink(dest, (err) => {
            return errHandler(err, () => {
                return _fs.copyFile(src, dest, (cerr) => {
                    return next(cerr);
                });
            });
        });
    });
}
function copyFileSync(src, dest) {
    let parse = _path.parse(src);
    if (!parse.ext)
        throw new Error("Source file path required....");
    parse = _path.parse(dest);
    if (!parse.ext)
        throw new Error("Dest file path required....");
    if (!_fs.existsSync(src))
        throw new Error(`Source directory not found ${src}`);
    if (_fs.existsSync(dest))
        _fs.unlinkSync(dest);
    _fs.copyFileSync(src, dest);
}
function copyDir(src, dest, next, errHandler) {
    return _fs.stat(src, (err, stats) => {
        if (err)
            return next(err);
        return errHandler(err, () => {
            if (stats.isDirectory()) {
                return mkdir(dest, "", (merr) => {
                    return errHandler(merr, () => {
                        return _fs.readdir(src, (rerr, files) => {
                            return errHandler(rerr, () => {
                                const forward = () => {
                                    const npath = files.shift();
                                    if (!npath)
                                        return next(null);
                                    return copyDir(_path.join(src, npath), _path.join(dest, npath), (copyErr) => {
                                        return errHandler(copyErr, () => {
                                            return forward();
                                        });
                                    }, errHandler);
                                };
                                return forward();
                            });
                        });
                    });
                }, errHandler);
            }
            return _fs.copyFile(src, dest, (cerr) => {
                return next(cerr);
            });
        });
    });
}
function copyDirSync(src, dest) {
    if (!_fs.existsSync(src))
        return;
    const stats = _fs.statSync(src);
    if (stats.isDirectory()) {
        if (!_fs.existsSync(dest))
            _fs.mkdirSync(dest);
        _fs.readdirSync(src).forEach((nextItem) => {
            copyDirSync(_path.join(src, nextItem), _path.join(dest, nextItem));
        });
    }
    else {
        _fs.copyFileSync(src, dest);
    }
}
/** Async */
/** opendir async */
function opendirAsync(absolute) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield _fsp.opendir(absolute);
    });
}
/** Get all file(s) async from given directory */
function getFilesAsync(dir, recursive) {
    return __asyncGenerator(this, arguments, function* getFilesAsync_1() {
        var _a, e_1, _b, _c;
        try {
            for (var _d = true, _e = __asyncValues(yield __await(opendirAsync(dir))), _f; _f = yield __await(_e.next()), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const d = _c;
                const entry = _path.join(dir, d.name);
                if (d.isDirectory()) {
                    if (recursive)
                        yield __await(yield* __asyncDelegator(__asyncValues(yield __await(getFilesAsync(entry, recursive)))));
                }
                else if (d.isFile())
                    yield yield __await(entry);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield __await(_b.call(_e));
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
/** unlink Async */
function unlinkAsync(absolute) {
    return __awaiter(this, void 0, void 0, function* () {
        yield _fsp.unlink(absolute);
    });
}
/** WriteFile Async */
function writeFileAsync(absolute, data) {
    return __awaiter(this, void 0, void 0, function* () {
        yield _fsp.writeFile(absolute, data, { flag: 'w' });
    });
}
/** Make Dir Async */
function mkdirAsync(errHandler, rootDir, targetDir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mkdirAsyncx(rootDir, targetDir);
        }
        catch (ex) {
            errHandler(ex, () => { });
        }
    });
}
/** Check File or Dir is exists */
function existsAsync(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield isExistsAsync(path)).exists;
    });
}
//# sourceMappingURL=fsw.js.map