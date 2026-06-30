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
export declare class Session implements ISession {
    /**
     * Retrieves the login identifier of the user.
     */
    get loginId(): string;
    /**
     * Checks whether the user is authenticated.
     */
    get isAuthenticated(): boolean;
    /**
     * Updates the authentication status of the user.
     */
    set isAuthenticated(value: boolean);
    /**
     * Retrieves additional user data.
     */
    get userData(): NodeJS.Dict<any>;
    /**
     * Retrieves the user's IP segment.
     */
    get ipPart(): string;
    /**
     * Retrieves the primary role identifier assigned to the user.
     */
    get roleId(): string;
    /**
     * Retrieves the session data as a dictionary.
     */
    get data(): {
        [key: string]: any;
        ipPart: string;
        loginId: string;
        roleId: string;
        isAuthenticated: boolean;
        userData: NodeJS.Dict<any>;
        roles: Set<string>;
    };
    /**
     * Internal storage object for session data.
     */
    private _obj;
    /**
     * Constructs a new Session instance with default values.
     */
    constructor();
    /**
     * Parses user data and updates the specified property or the default `userData` property.
     *
     * @param {Function} parseData - A function that processes the data and returns a dictionary.
     * @param {string} [prop] - An optional property name to apply the parsing function to. If not provided, `userData` is used.
     */
    parseUserData(parseData: (data: any) => NodeJS.Dict<any>, prop?: string): void;
    /**
     * Converts the session data to a JSON string.
     *
     * @returns A JSON string representing the session.
     */
    toJson(): string;
    /**
     * Checks if the user has a specific role.
     *
     * @param roleId The role identifier to check.
     * @returns True if the user has the specified role; otherwise, false.
     */
    isInRole(roleId: string): boolean;
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
    parse(data: string | any): ISession;
    /**
     * Retrieves a value from the session data.
     *
     * @param key The key of the data to retrieve.
     * @param prop An optional property to access within the stored data.
     * @returns The value associated with the key, or undefined if not found.
     */
    getData(key: string, prop?: string): any;
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
    updateRoleId(roleIds: string | Array<string>): void;
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
    updateData(key: string, obj: NodeJS.Dict<any>): void;
    /**
     * Clears the session data, effectively resetting the session.
     */
    clear(): void;
}
