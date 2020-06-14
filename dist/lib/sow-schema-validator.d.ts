/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
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
export declare function fillUpType( type?: string ): any;
export declare function schemaValidate( dataPath: string, schemaProperties: IProperties, configProperties: {
    [id: string]: any;
}, additionalProperties: boolean ): void;
export declare namespace Schema {
    function Validate( config: {
        [id: string]: any;
    } | any ): void;
}