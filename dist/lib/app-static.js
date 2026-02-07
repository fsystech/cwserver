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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResInfo = exports.Session = exports.BufferArray = void 0;
exports.toString = toString;
exports.ToNumber = ToNumber;
exports.ToResponseTime = ToResponseTime;
/**
 * Class implementing a buffer array with dynamic buffer management.
 */
class BufferArray {
    /**
     * Retrieves the concatenated buffer data.
     *
     * @throws Error if the instance has been disposed.
     */
    get data() {
        this.shouldNotDisposed();
        return Buffer.concat(this._data, this.length);
    }
    /**
     * Retrieves the total length of the buffer array.
     *
     * @throws Error if the instance has been disposed.
     */
    get length() {
        this.shouldNotDisposed();
        return this._length;
    }
    /**
     * Initializes a new instance of the `BufferArray` class.
     */
    constructor() {
        this._data = [];
        this._isDisposed = false;
        this._length = 0;
    }
    /**
     * Ensures that the instance is not disposed before accessing data.
     *
     * @throws Error if the instance has been disposed.
     */
    shouldNotDisposed() {
        if (this._isDisposed)
            throw new Error("This `BufferArray` instance already disposed.");
    }
    /**
     * Adds a buffer or string to the buffer array.
     *
     * @param buff The buffer or string to add.
     * @returns The length of the added buffer.
     *
     * @throws Error if the instance has been disposed.
     */
    push(buff) {
        this.shouldNotDisposed();
        if (Buffer.isBuffer(buff)) {
            this._length += buff.length;
            this._data.push(buff);
            return buff.length;
        }
        const nBuff = Buffer.from(buff);
        this._length += nBuff.length;
        this._data.push(nBuff);
        return nBuff.length;
    }
    /**
     * Clears the buffer array by resetting stored data.
     *
     * @throws Error if the instance has been disposed.
     */
    clear() {
        this.shouldNotDisposed();
        this._data.length = 0;
        this._length = 0;
    }
    /**
     * Converts the buffer data to a string with optional encoding.
     *
     * @param encoding The encoding to use (default is UTF-8).
     * @returns The string representation of the buffer data.
     */
    toString(encoding) {
        return this.data.toString(encoding);
    }
    /**
     * Disposes of the buffer array, releasing stored data.
     */
    dispose() {
        if (!this._isDisposed) {
            this._isDisposed = true;
            this._data.length = 0;
            // @ts-ignore
            delete this._data;
            delete this._length;
        }
        return void 0;
    }
}
exports.BufferArray = BufferArray;
/**
 * Class representing a user session.
 *
 * Implements the ISession interface to manage session states, user authentication,
 * roles, and additional metadata associated with a session.
 */
class Session {
    /**
     * Retrieves the login identifier of the user.
     */
    get loginId() {
        var _a;
        return (_a = this._obj) === null || _a === void 0 ? void 0 : _a.loginId;
    }
    /**
     * Checks whether the user is authenticated.
     */
    get isAuthenticated() {
        var _a;
        return (_a = this._obj) === null || _a === void 0 ? void 0 : _a.isAuthenticated;
    }
    /**
     * Updates the authentication status of the user.
     */
    set isAuthenticated(value) {
        if (!this._obj)
            return;
        this._obj.isAuthenticated = value;
    }
    /**
     * Retrieves additional user data.
     */
    get userData() {
        var _a;
        return (_a = this._obj) === null || _a === void 0 ? void 0 : _a.userData;
    }
    /**
     * Retrieves the user's IP segment.
     */
    get ipPart() {
        var _a;
        return (_a = this._obj) === null || _a === void 0 ? void 0 : _a.ipPart;
    }
    /**
     * Retrieves the primary role identifier assigned to the user.
     */
    get roleId() {
        var _a;
        return (_a = this._obj) === null || _a === void 0 ? void 0 : _a.roleId;
    }
    /**
     * Retrieves the session data as a dictionary.
     */
    get data() {
        return this._obj;
    }
    /**
     * Constructs a new Session instance with default values.
     */
    constructor() {
        this._obj = {
            roleIds: [],
            userData: {},
            loginId: undefined,
            roleId: undefined,
            ipPart: undefined,
            isAuthenticated: false,
        };
    }
    /**
     * Parses user data and updates the specified property or the default `userData` property.
     *
     * @param {Function} parseData - A function that processes the data and returns a dictionary.
     * @param {string} [prop] - An optional property name to apply the parsing function to. If not provided, `userData` is used.
     */
    parseUserData(parseData, prop) {
        if (prop) {
            this._obj[prop] = parseData(this._obj[prop]);
        }
        else {
            this._obj.userData = parseData(this._obj.userData);
        }
    }
    /**
     * Converts the session data to a JSON string.
     *
     * @returns A JSON string representing the session.
     */
    toJson() {
        if (!this._obj)
            return '{}';
        return JSON.stringify(this._obj);
    }
    /**
     * Checks if the user has a specific role.
     *
     * @param roleId The role identifier to check.
     * @returns True if the user has the specified role; otherwise, false.
     */
    isInRole(roleId) {
        if (!this._obj)
            return false;
        if (this._obj.roleId === roleId)
            return true;
        return this._obj.roleIds.includes(roleId);
    }
    /**
     * Parses the provided data and updates the session instance accordingly.
     *
     * This method accepts either a JSON string or an object. If a JSON string is provided,
     * it attempts to parse it into an object. Regardless of input type, the session data
     * is updated, authentication is enabled, and role information is properly structured.
     *
     * @param data A JSON string or an object representing session data.
     * @returns The updated session instance.
     */
    parse(data) {
        if (typeof data === 'string') {
            try {
                this._obj = JSON.parse(data);
            }
            catch (_a) { }
        }
        else {
            this._obj = Object.assign({}, data);
        }
        try {
            if (Array.isArray(this._obj.roleId)) {
                this._obj.roleIds = this._obj.roleId;
                this._obj.roleId = this._obj.roleIds[0];
                delete this._obj.roleId;
            }
            else {
                if (this._obj.roleId) {
                    this._obj.roleIds = this._obj.roleId.split(',');
                    this._obj.roleId = this._obj.roleIds[0];
                }
                else {
                    this._obj.roleIds = [];
                }
            }
            this._obj.isAuthenticated = true;
        }
        catch (_b) { }
        return this;
    }
    /**
     * Retrieves a value from the session data.
     *
     * @param key The key of the data to retrieve.
     * @param prop An optional property to access within the stored data.
     * @returns The value associated with the key, or undefined if not found.
     */
    getData(key, prop) {
        if (!this._obj)
            return undefined;
        if (!prop) {
            return this._obj[key];
        }
        const value = this._obj[key];
        if (!value)
            return undefined;
        return value[prop];
    }
    /**
     * Updates a value in the session data.
     *
     * @param key The key of the data to update.
     * @param obj The new object data to store under the specified key.
     */
    updateData(key, obj) {
        this._obj[key] = Object.assign({}, obj);
    }
    /**
     * Clears the session data, effectively resetting the session.
     */
    clear() {
        delete this._obj;
    }
}
exports.Session = Session;
class ResInfo {
    constructor() {
        this.code = 0;
        this.isValid = false;
        this.isErrorCode = false;
        this.isInternalErrorCode = false;
        this.description = "Ok";
    }
    ;
}
exports.ResInfo = ResInfo;
function toString(val) {
    if (!val)
        return "";
    return typeof (val) === "string" ? val : String(val);
}
function ToNumber(obj) {
    if (!obj)
        return 0;
    if (typeof (obj) === "number")
        return obj;
    if (isNaN(obj))
        return 0;
    return parseFloat(obj);
}
const _map = {
    month: {
        1: 'Jan',
        2: 'Feb',
        3: 'Mar',
        4: 'Apr',
        5: 'May',
        6: 'Jun',
        7: 'July',
        8: 'Aug',
        9: 'Sep',
        10: 'Oct',
        11: 'Nov',
        12: 'Dec'
    },
    day: {
        0: "Sun",
        1: "Mon",
        2: "Tue",
        3: "Wed",
        4: "Thu",
        5: "Fri",
        6: "Sat"
    }
};
const dfo = (t) => {
    t = t === 0 ? 1 : t;
    return _map.day[t];
};
const dfon = (t) => {
    t = t === 0 ? 1 : t;
    return t <= 9 ? "0" + t : t;
};
const dfm = (t) => {
    t += 1;
    return _map.month[t];
};
function ToResponseTime(timestamp) {
    // Thu, 01 May 2020 23:34:07 GMT
    let date;
    if (timestamp) {
        if (typeof (timestamp) === "number") {
            date = new Date(timestamp);
        }
        else {
            date = timestamp;
        }
    }
    else {
        date = new Date();
    }
    return `${dfo(date.getDay())}, ${dfon(date.getDate())} ${dfm(date.getMonth())} ${date.getFullYear()} ${dfon(date.getHours())}:${dfon(date.getMinutes())}:${dfon(date.getSeconds())} GMT`;
}
//# sourceMappingURL=app-static.js.map