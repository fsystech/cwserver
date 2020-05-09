"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _fs = require("fs");
const _path = require("path");
const _isPlainObject = (obj) => {
    if (obj === null || obj === undefined)
        return false;
    return typeof (obj) === 'object';
};
const _extend = (destination, source) => {
    if (!_isPlainObject(destination) || !_isPlainObject(source))
        throw new TypeError(`Invalid arguments defined. Arguments should be Object instance. destination type ${typeof (destination)} and source type ${typeof (source)}`);
    for (const property in source)
        destination[property] = source[property];
    return destination;
};
const _deepExtend = (destination, source) => {
    if (typeof (source) === "function")
        source = source();
    if (!_isPlainObject(destination) || !_isPlainObject(source))
        throw new TypeError(`Invalid arguments defined. Arguments should be Object instance. destination type ${typeof (destination)} and source type ${typeof (source)}`);
    for (const property in source) {
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
var Util;
(function (Util) {
    function guid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
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
    function isPlainObject(obj) {
        return _isPlainObject(obj);
    }
    Util.isPlainObject = isPlainObject;
    function isArrayLike(obj) {
        if (obj === null || obj === undefined)
            return false;
        const result = Object.prototype.toString.call(obj);
        return result === "[object NodeList]" || result === "[object Array]" ? true : false;
    }
    Util.isArrayLike = isArrayLike;
    function isFileModified(a, b) {
        const astat = _fs.statSync(a), bstat = _fs.statSync(b);
        if (astat.mtime.getTime() > bstat.mtime.getTime())
            return true;
        return false;
    }
    Util.isFileModified = isFileModified;
    function isExists(path, next) {
        const url = _path.resolve(path);
        if (!_fs.existsSync(url)) {
            return (next ? next(404, true) : undefined), false;
        }
        return url;
    }
    Util.isExists = isExists;
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
//# sourceMappingURL=sow-util.js.map