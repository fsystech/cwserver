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
exports.moveFileAsync = exports.existsAsync = exports.mkdirAsync = exports.writeFileAsync = exports.unlinkAsync = exports.getFilesAsync = exports.opendirAsync = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:43 PM 10/13/2020
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const sow_fsw_1 = require("./sow-fsw");
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
        var e_1, _a;
        try {
            for (var _b = __asyncValues(yield __await(opendirAsync(dir))), _c; _c = yield __await(_b.next()), !_c.done;) {
                const d = _c.value;
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
                if (_c && !_c.done && (_a = _b.return)) yield __await(_a.call(_b));
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
            sow_fsw_1.mkdir(rootDir, targetDir, (err) => {
                return resolve();
            }, errHandler);
        });
    });
}
exports.mkdirAsync = mkdirAsync;
/** Check File or Dir is exists */
function existsAsync(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            return sow_fsw_1.isExists(path, (exists) => {
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
            return sow_fsw_1.moveFile(src, dest, (err) => {
                if (err)
                    return reject(err);
                resolve();
            }, true);
        });
    });
}
exports.moveFileAsync = moveFileAsync;
//# sourceMappingURL=sow-fs-async.js.map