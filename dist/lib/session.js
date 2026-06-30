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
exports.Session = void 0;
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
            userData: {},
            loginId: undefined,
            roleId: undefined,
            ipPart: undefined,
            isAuthenticated: false,
            roles: new Set(),
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
        return this._obj.roles.has(roleId);
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
        var _a;
        if (typeof data === "string") {
            this._obj = JSON.parse(data);
        }
        else if (data && typeof data === "object") {
            this._obj = Object.assign({}, data);
        }
        else {
            throw new TypeError("Session data must be a string or object.");
        }
        const roleId = this._obj.roleId;
        const roles = Array.isArray(roleId)
            ? new Set(roleId)
            : typeof roleId === "string" && roleId.length > 0
                ? new Set(roleId.split(","))
                : new Set();
        this._obj.roles = roles;
        this._obj.roleId = (_a = roles.values().next().value) !== null && _a !== void 0 ? _a : null;
        this._obj.isAuthenticated = true;
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
     * Updates the role identifiers associated with the session.
     *
     * This method adds one or more role IDs to the existing session role set
     * and updates the primary role ID using the first available role.
     *
     * @param {string | Array<string>} roleIds
     * A single role ID or an array of role IDs to add to the session.
     *
     * @returns {void}
     * Does not return a value.
     */
    updateRoleId(roleIds) {
        var _a;
        if (!this._obj)
            throw new Error("No active session found.");
        const roles = this._obj.roles;
        if (Array.isArray(roleIds)) {
            roleIds.forEach(id => roles.add(id));
        }
        else {
            roles.add(roleIds);
        }
        this._obj.roleId = (_a = roles.values().next().value) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Updates a session data value for the specified key.
     *
     * This method stores a shallow copy of the provided object in the session data.
     * Direct updates to protected role-related fields are not allowed and must be
     * performed through the dedicated role update handler.
     *
     * @param {string} key
     * The session data key to update.
     *
     * @param {NodeJS.Dict<any>} obj
     * The object value to store for the specified key.
     *
     * @throws {Error}
     * Throws an error if attempting to directly update restricted role fields.
     *
     * @returns {void}
     * Does not return a value.
     */
    updateData(key, obj) {
        if (key === 'roles' || key === 'roleId') {
            throw new Error(`Direct update for '${key}' is not supported. Use Session.updateRoleId instead.`);
        }
        this._obj[key] = Object.assign({}, obj);
    }
    /**
     * Clears the session data, effectively resetting the session.
     */
    clear() {
        if (!this._obj)
            return;
        this._obj.roles.clear();
        delete this._obj;
    }
}
exports.Session = Session;
//# sourceMappingURL=session.js.map