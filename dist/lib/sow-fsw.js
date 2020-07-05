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
exports.copyDirSync = exports.copyDir = exports.copyFileSync = exports.copyFile = exports.unlink = exports.rmdirSync = exports.rmdir = exports.mkdirSync = exports.mkdir = exports.readJsonSync = exports.readJson = exports.isExists = exports.compairFileSync = exports.compairFile = exports.moveFile = exports.stat = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 5:17 PM 6/15/2020
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
function stat(path, next, errHandler) {
    return isExists(path, (exists, url) => {
        if (!exists)
            return next();
        return _fs.stat(path, (err, stats) => {
            return errHandler(err, () => {
                return next(null, stats);
            });
        });
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
/** compairFile a stat.mtime > b stat.mtime */
function compairFile(a, b, next, errHandler) {
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
exports.compairFile = compairFile;
/** compairFileSync a stat.mtime > b stat.mtime */
function compairFileSync(a, b) {
    const astat = _fs.statSync(a);
    const bstat = _fs.statSync(b);
    if (astat.mtime.getTime() > bstat.mtime.getTime())
        return true;
    return false;
}
exports.compairFileSync = compairFileSync;
function isExists(path, next) {
    const url = _path.resolve(path);
    return _fs.exists(url, (exists) => {
        return next(exists, url);
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
        return fnext(true);
    return _fs.exists(path, (iexists) => {
        if (iexists)
            return fnext(false);
        return _fs.mkdir(path, (err) => {
            return errHandler(err, () => {
                fnext(false);
            });
        });
    });
}
function mkdir(rootDir, targetDir, next, errHandler) {
    if (rootDir.length === 0)
        return next(new Error("Argument missing..."));
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
    return _fs.exists(fullPath, (exists) => {
        if (exists) {
            return _fs.stat(fullPath, (err, stats) => {
                return errHandler(err, () => {
                    return next(stats.isDirectory() ? null : new Error("Invalid path found..."));
                });
            });
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
    return _fs.exists(path, (exists) => {
        if (!exists)
            return next(null);
        return _fs.stat(path, (err, stats) => {
            return errHandler(err, () => {
                if (stats.isDirectory()) {
                    return _fs.readdir(path, (rerr, files) => {
                        return errHandler(err, () => {
                            const forward = () => {
                                const npath = files.shift();
                                if (!npath) {
                                    return _fs.rmdir(path, (rmerr) => {
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
        _fs.rmdirSync(path);
    }
    else {
        _fs.unlinkSync(path);
    }
}
exports.rmdirSync = rmdirSync;
function unlink(path, next) {
    return _fs.exists(path, (exists) => {
        if (!exists)
            return next(null);
        return _fs.unlink(path, (err) => {
            return next(err);
        });
    });
}
exports.unlink = unlink;
function copyFile(src, dest, next, errHandler) {
    if (!_path.parse(src).ext)
        return next(new Error("Source file path required...."));
    if (!_path.parse(dest).ext)
        return next(new Error("Dest file path required...."));
    return _fs.exists(src, (exists) => {
        if (!exists)
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
    return _fs.exists(src, (exists) => {
        if (!exists)
            return next(new Error("Source directory | file not found."));
        return _fs.stat(src, (err, stats) => {
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
//# sourceMappingURL=sow-fsw.js.map