// Copyright (c) 2022 Safe Online World Ltd.
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

// 1:20 AM 5/13/2020
// by rajib chy
import * as _fs from 'node:fs';
import * as _path from 'node:path';
import { Util, getAppDir, assert } from './app-util';
export interface IPropertiesDescription {
	type?: string;
	minLength: number;
	enum?: string[];
	description: string;
	properties?: IProperties;
	items?: { type: string; properties?: IProperties };
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
const _supportSchema: { [id: string]: string } = {
	"http://json-schema.org/draft-07/schema": "draft-07"
};
function readSchemaAsync(absPath: string): ISchema {
	const jsonstr = _fs.readFileSync(absPath, "utf8");
	try {
		return JSON.parse(jsonstr);
	} catch (e) {
		throw new Error(`Invalid schema file defined.\nPlease re-install cwserver.`);
	}
}
function propertiValidate(
	dataPath: string,
	configProperties: { [id: string]: any },
	schemaProperties: IProperties,
	additionalProperties: boolean
): void {
	for (const prop in configProperties) {
		const svalue: IPropertiesDescription | undefined = schemaProperties[prop];
		if (!svalue) {
			if (additionalProperties) continue;
			throw new Error(`ERROR: Configuration doesn't match the required schema. Data path "${dataPath}" should NOT have additional property (${prop}).`);
		}
		const cvalue: any = configProperties[prop];
		if (svalue.type === "array") {
			if (!Util.isArrayLike<any>(cvalue)) {
				throw new Error(`ERROR: Data path "${dataPath}.${prop}" should be value type ${svalue.type}`);
			}
			continue;
		}
		if (typeof (cvalue) !== svalue.type) {
			throw new Error(`ERROR: Configuration doesn't match the required schema. Data path "${dataPath}.${prop}" should be value type ${svalue.type}`);
		}
	}
}
export function fillUpType(type?: string): any {
	switch (type) {
		case "array": return [];
		case "number": return 0;
		case "boolean": return false;
		case "string": return "";
		case "object": return {};
	}
	return void 0;
}
export function schemaValidate(
	dataPath: string,
	schemaProperties: IProperties,
	configProperties: { [id: string]: any },
	additionalProperties: boolean
): void {
	// check config properties are valid
	propertiValidate(dataPath, configProperties, schemaProperties, additionalProperties);
	for (const prop in schemaProperties) {
		const cvalue = configProperties[prop];
		const svalue = schemaProperties[prop];
		const valueType = typeof (cvalue);
		if (valueType === "undefined" && svalue.minLength > 0) {
			throw new Error(`ERROR: Configuration doesn't match the required schema. Data path "${dataPath}" required properties (${prop}).`);
		}
		if (valueType === "undefined") {
			configProperties[prop] = fillUpType(svalue.type);
			continue;
		}
		if (svalue.type === "array") {
			if (Util.isArrayLike<any>(cvalue)) {
				if (cvalue.length < svalue.minLength) {
					throw new Error(`ERROR: Data path "${dataPath}.${prop}" minmum length required ${svalue.minLength}`);
				}
				if (svalue.items) {
					const itemType = svalue.items.type;
					if (itemType === "object" && svalue.items.properties) {
						const itemprop: IProperties = svalue.items.properties;
						cvalue.forEach((a, index) => {
							if (typeof (a) !== itemType) {
								throw new Error(`ERROR: Data path "${dataPath}.${prop}" should be item value type ${itemType}`);
							}
							schemaValidate(`${dataPath}.${prop}[${index}]`, itemprop, a, svalue.additionalProperties ? svalue.additionalProperties : false);
						});
						continue;
					}
					cvalue.forEach(a => {
						if (typeof (a) !== itemType) {
							throw new Error(`ERROR: Data path "${dataPath}.${prop}" should be item value type ${itemType}`);
						}
					});
				}
			}
			continue;
		}
		if (svalue.type === "object") {
			if (svalue.properties && Object.keys(svalue.properties).length > 0) {
				schemaValidate(`${dataPath}.${prop}`, svalue.properties, cvalue, svalue.additionalProperties ? svalue.additionalProperties : false);
			}
			continue;
		}
		if (svalue.const) {
			if (svalue.const !== cvalue)
				throw new Error(`ERROR: Data path "${dataPath}.${prop}" should not change '${svalue.const}' to '${cvalue}'`);
			continue;
		}
		if (svalue.type === "string") {
			if (svalue.enum) {
				if (svalue.enum.indexOf(cvalue) < 0) {
					throw new Error(`ERROR: Data path "${dataPath}.${prop}" should be between ${svalue.enum}`);
				}
			}
			if (svalue.minLength > 0) {
				if (cvalue.length < svalue.minLength)
					throw new Error(`ERROR: Data path "${dataPath}.${prop}" minmum length required ${svalue.minLength}`);
			}
		}
	}
}
export class Schema {
	public static Validate(config: { [id: string]: any } | any): void {
		const parent: string = getAppDir();
		const absPath: string = _path.resolve(`${parent}/schema.json`);
		const schema: ISchema = readSchemaAsync(absPath);
		const schemaRoot: string | undefined = _supportSchema[schema.$schema];
		assert(schemaRoot, 'Invalid schema file defined.\nPlease re-install cwserver.');
		if (!Util.isPlainObject(config)) {
			throw new Error(`Invalid config file defined.\nConfig file should be ${schema.type}.`);
		}
		assert(config.$schema, `No schema defined in config file.\nConfig file should be use $schema:${schema.$schema}`);
		delete config.$schema;
		if (config.$comment) {
			delete config.$comment;
		}
		schemaValidate("config", schema.properties, config, schema.additionalProperties);
	}
}