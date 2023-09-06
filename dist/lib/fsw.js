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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveFileAsync = exports.existsAsync = exports.mkdirAsync = exports.writeFileAsync = exports.unlinkAsync = exports.getFilesAsync = exports.opendirAsync = exports.copyDirSync = exports.copyDir = exports.copyFileSync = exports.copyFile = exports.unlink = exports.rmdirSync = exports.rmdir = exports.mkdirSync = exports.mkdir = exports.readJsonSync = exports.readJson = exports.isExists = exports.compareFileSync = exports.compareFile = exports.moveFile = exports.stat = void 0;
// 5:17 PM 6/15/2020
// by rajib chy
const _fs = __importStar(require("node:fs"));
const _path = __importStar(require("node:path"));
const _fsRmdir = typeof (_fs.rm) === "function" ? _fs.rm : _fs.rmdir;
const _fsRmdirSync = typeof (_fs.rmSync) === "function" ? _fs.rmSync : _fs.rmdirSync;
function stat(path, next) {
    return _fs.stat(path, (err, stats) => {
        if (err)
            return next(err);
        return next(null, stats);
    });
}
exports.stat = stat;
function isSameDrive(src, dest) {
    const aroot = _path.parse(src).root;
    const broot = _path.parse(dest).root;
    return aroot.substring(0, aroot.indexOf(":")) === broot.substring(0, broot.indexOf(":"));
}
function moveFile(src, dest, next, force) {
    if (force !== true && isSameDrive(src, dest)) {
        return _fs.rename(src, dest, (err) => {
            return next(err);
        });
    }
    return _fs.copyFile(src, dest, (err) => {
        if (err)
            return next(err);
        return _fs.unlink(src, (uerr) => {
            return next(uerr);
        });
    });
}
exports.moveFile = moveFile;
/** compareFile a stat.mtime > b stat.mtime */
function compareFile(a, b, next, errHandler) {
    return _fs.stat(a, (err, astat) => {
        return errHandler(err, () => {
            return _fs.stat(b, (serr, bstat) => {
                return errHandler(serr, () => {
                    return next(null, astat.mtime.getTime() > bstat.mtime.getTime());
                });
            });
        });
    });
}
exports.compareFile = compareFile;
/** compareFileSync a stat.mtime > b stat.mtime */
function compareFileSync(a, b) {
    const astat = _fs.statSync(a);
    const bstat = _fs.statSync(b);
    if (astat.mtime.getTime() > bstat.mtime.getTime())
        return true;
    return false;
}
exports.compareFileSync = compareFileSync;
function isExists(path, next) {
    const url = _path.resolve(path);
    return _fs.stat(url, (err, stats) => {
        return next(err ? false : true, url);
    });
}
exports.isExists = isExists;
function readJson(absPath, next, errHandler) {
    return _fs.readFile(absPath, (err, data) => {
        return errHandler(err, () => {
            try {
                return next(null, JSON.parse(data.toString("utf8").replace(/^\uFEFF/, '')));
            }
            catch (e) {
                return next(e);
            }
        });
    });
}
exports.readJson = readJson;
function readJsonSync(absPath) {
    const jsonstr = _fs.readFileSync(absPath, "utf8").replace(/^\uFEFF/, '').replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "").replace(/^\s*$(?:\r\n?|\n)/gm, "");
    try {
        return JSON.parse(jsonstr);
    }
    catch (e) {
        return void 0;
    }
}
exports.readJsonSync = readJsonSync;
function mkdirCheckAndCreate(errHandler, fnext, path) {
    if (!path)
        return process.nextTick(() => fnext(true));
    return _fs.stat(path, (err, stats) => {
        if (!err)
            return fnext(false);
        return _fs.mkdir(path, (merr) => {
            return errHandler(merr, () => {
                fnext(false);
            });
        });
    });
}
function mkdir(rootDir, targetDir, next, errHandler) {
    if (rootDir.length === 0) {
        return process.nextTick(() => next(new Error("Argument missing...")));
    }
    let fullPath = "";
    let sep = "";
    if (targetDir && targetDir.length > 0) {
        if (targetDir.charAt(0) === '.')
            return next(new Error("No need to defined start point...."));
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
    return _fs.stat(fullPath, (err, stats) => {
        if (!err) {
            return next(stats.isDirectory() ? null : new Error("Invalid path found..."));
        }
        if (_path.parse(fullPath).ext)
            return next(new Error("Directory should be end without extension...."));
        const tobeCreate = [];
        targetDir.split(sep).reduce((parentDir, childDir) => {
            const curDir = _path.resolve(parentDir, childDir);
            tobeCreate.push(curDir);
            return curDir;
        }, rootDir);
        function doNext(done) {
            if (done) {
                return next(null);
            }
            return mkdirCheckAndCreate(errHandler, doNext, tobeCreate.shift());
        }
        return doNext(false);
    });
}
exports.mkdir = mkdir;
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
exports.mkdirSync = mkdirSync;
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
exports.rmdir = rmdir;
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
exports.rmdirSync = rmdirSync;
function unlink(path, next) {
    return _fs.unlink(path, (err) => {
        return next(err);
    });
}
exports.unlink = unlink;
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
exports.copyFile = copyFile;
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
exports.copyFileSync = copyFileSync;
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
exports.copyDir = copyDir;
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
exports.copyDirSync = copyDirSync;
/** Async */
/** opendir async */
function opendirAsync(absolute) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            return _fs.opendir(absolute, (err, dir) => {
                if (err)
                    return reject(err);
                return resolve(dir);
            });
        });
    });
}
exports.opendirAsync = opendirAsync;
/** Get all file(s) async from given directory */
function getFilesAsync(dir, recursive) {
    return __asyncGenerator(this, arguments, function* getFilesAsync_1() {
        var _a, e_1, _b, _c;
        try {
            for (var _d = true, _e = __asyncValues(yield __await(opendirAsync(dir))), _f; _f = yield __await(_e.next()), _a = _f.done, !_a;) {
                _c = _f.value;
                _d = false;
                try {
                    const d = _c;
                    const entry = _path.join(dir, d.name);
                    if (d.isDirectory()) {
                        if (recursive)
                            yield __await(yield* __asyncDelegator(__asyncValues(yield __await(getFilesAsync(entry, recursive)))));
                    }
                    else if (d.isFile())
                        yield yield __await(entry);
                }
                finally {
                    _d = true;
                }
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
exports.getFilesAsync = getFilesAsync;
/** unlink Async */
function unlinkAsync(absolute) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            return _fs.unlink(absolute, (err) => {
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    });
}
exports.unlinkAsync = unlinkAsync;
/** WriteFile Async */
function writeFileAsync(absolute, data) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            _fs.writeFile(absolute, data, { flag: 'w' }, (err) => {
                if (err)
                    return reject(err);
                return resolve();
            });
        }));
    });
}
exports.writeFileAsync = writeFileAsync;
/** Make Dir Async */
function mkdirAsync(errHandler, rootDir, targetDir) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            mkdir(rootDir, targetDir, (err) => {
                return resolve(true);
            }, errHandler);
        });
    });
}
exports.mkdirAsync = mkdirAsync;
/** Check File or Dir is exists */
function existsAsync(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            return isExists(path, (exists) => {
                resolve(exists);
            });
        });
    });
}
exports.existsAsync = existsAsync;
/** Move file async */
function moveFileAsync(src, dest) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            return moveFile(src, dest, (err) => {
                if (err)
                    return reject(err);
                resolve(true);
            }, true);
        });
    });
}
exports.moveFileAsync = moveFileAsync;
//# sourceMappingURL=fsw.js.map