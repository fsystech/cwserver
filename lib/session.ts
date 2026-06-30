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
// updated 11:33 PM 6/30/2026
// by rajib chy

/**
 * # User Session
 * Interface representing a user session.
 * 
 * This interface defines the structure and required methods for managing user session data.
 */
export interface ISession {
    /**
     * Indicates is mobile app or not.
     */
    isMobileApp?: boolean;
    /**
     * Indicates whether the user is authenticated.
     */
    isAuthenticated: boolean;

    /**
     * Unique identifier for the logged-in user.
     */
    readonly loginId: string;

    /**
     * Role identifier assigned to the user.
     */
    readonly roleId: string;

    /**
     * Additional user-specific data.
     */
    readonly userData?: any;

    /**
     * IP segment or part of the user's IP address.
     */
    readonly ipPart?: string;

    /**
     * A dictionary for storing arbitrary session-related data.
     */
    readonly data: NodeJS.Dict<any>;

    /**
     * Checks if the user has a specific role.
     * 
     * @param roleId The role identifier to check.
     * @returns True if the user has the specified role; otherwise, false.
     */
    isInRole(roleId: string): boolean;
}

/**
 * Class representing a user session.
 * 
 * Implements the ISession interface to manage session states, user authentication,
 * roles, and additional metadata associated with a session.
 */
export class Session implements ISession {
    /**
     * Retrieves the login identifier of the user.
     */
    public get loginId() {
        return this._obj?.loginId;
    }

    /**
     * Checks whether the user is authenticated.
     */
    public get isAuthenticated() {
        return this._obj?.isAuthenticated;
    }

    /**
     * Updates the authentication status of the user.
     */
    public set isAuthenticated(value) {
        if (!this._obj) return;
        this._obj.isAuthenticated = value;
    }

    /**
     * Retrieves additional user data.
     */
    public get userData() {
        return this._obj?.userData;
    }

    /**
     * Retrieves the user's IP segment.
     */
    public get ipPart() {
        return this._obj?.ipPart;
    }

    /**
     * Retrieves the primary role identifier assigned to the user.
     */
    public get roleId() {
        return this._obj?.roleId;
    }

    /**
     * Retrieves the session data as a dictionary.
     */
    public get data() {
        return this._obj;
    }

    /**
     * Internal storage object for session data.
     */
    private _obj: {
        [key: string]: any;
        ipPart: string;
        loginId: string;
        roleId: string;
        isAuthenticated: boolean;
        userData: NodeJS.Dict<any>;
        roles: Set<string>;
    };

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
    public parseUserData(
        parseData: (data: any) => NodeJS.Dict<any>, prop?: string
    ): void {

        if (prop) {
            this._obj[prop] = parseData(this._obj[prop]);
        } else {
            this._obj.userData = parseData(this._obj.userData);
        }
    }

    /**
     * Converts the session data to a JSON string.
     * 
     * @returns A JSON string representing the session.
     */
    public toJson(): string {
        if (!this._obj) return '{}';
        return JSON.stringify(this._obj);
    }

    /**
     * Checks if the user has a specific role.
     * 
     * @param roleId The role identifier to check.
     * @returns True if the user has the specified role; otherwise, false.
     */
    public isInRole(roleId: string): boolean {
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
    public parse(data: string | any): ISession {

        if (typeof data === "string") {
            this._obj = JSON.parse(data);
        } else if (data && typeof data === "object") {
            this._obj = { ...data };
        } else {
            throw new TypeError("Session data must be a string or object.");
        }

        const roleId = this._obj.roleId;

        const roles = Array.isArray(roleId)
            ? new Set(roleId)
            : typeof roleId === "string" && roleId.length > 0
                ? new Set(roleId.split(","))
                : new Set();

        this._obj.roles = roles;
        this._obj.roleId = roles.values().next().value ?? null;

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
    public getData(key: string, prop?: string): any {
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
    public updateRoleId(roleIds: string | Array<string>): void {

        if (!this._obj)
            throw new Error("No active session found.")

        const roles = this._obj.roles;

        if (Array.isArray(roleIds)) {
            roleIds.forEach(id => roles.add(id));
        } else {
            roles.add(roleIds);
        }

        this._obj.roleId = roles.values().next().value ?? null;

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
    public updateData(key: string, obj: NodeJS.Dict<any>): void {
        if (key === 'roles' || key === 'roleId') {
            throw new Error(
                `Direct update for '${key}' is not supported. Use Session.updateRoleId instead.`
            );
        }

        this._obj[key] = { ...obj };
    }

    /**
     * Clears the session data, effectively resetting the session.
     */
    public clear(): void {
        if (!this._obj)
            return;

        this._obj.roles.clear()

        delete this._obj;
    }
}
