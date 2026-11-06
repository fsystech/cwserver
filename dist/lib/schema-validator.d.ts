export interface IPropertiesDescription {
    type?: string;
    minLength: number;
    enum?: string[];
    description: string;
    properties?: IProperties;
    items?: {
        type: string;
        properties?: IProperties;
    };
    required?: string[];
    const?: any;
    additionalProperties?: boolean;
}
export interface IProperties {
    [id: string]: IPropertiesDescription;
}
export interface ISchema {
    $schema: string;
    type: string;
    additionalProperties: boolean;
    properties: IProperties;
}
/**
 * Returns the default empty value for a schema type name.
 *
 * @param type Schema type name such as array, number, boolean, string or object.
 * @returns An empty array, 0, false, empty string or empty object for the type, otherwise undefined.
 */
export declare function fillUpType(type?: string): any;
/**
 * Recursively validates a configuration object against schema properties, throwing on type, length,
 * enum, const or missing required value violations. Fills missing optional properties with default
 * values of their type.
 *
 * @param dataPath Path of the object being validated, used in error messages.
 * @param schemaProperties Schema property definitions.
 * @param configProperties Configuration object to validate; modified in place with defaults.
 * @param additionalProperties Whether properties not in the schema are allowed.
 */
export declare function schemaValidate(dataPath: string, schemaProperties: IProperties, configProperties: {
    [id: string]: any;
}, additionalProperties: boolean): void;
export declare class Schema {
    /**
     * Validates an application config object against the bundled schema.json, filling in defaults. Throws
     * if the schema or config is invalid or does not match.
     *
     * @param config Configuration object to validate; modified in place.
     */
    static Validate(config: {
        [id: string]: any;
    } | any): void;
}
