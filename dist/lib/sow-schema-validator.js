"use strict";
var __importStar = ( this && this.__importStar ) || function ( mod ) {
    if ( mod && mod.__esModule ) return mod;
    var result = {};
    if ( mod != null ) for ( var k in mod ) if ( Object.hasOwnProperty.call( mod, k ) ) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty( exports, "__esModule", { value: true } );
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 1:20 AM 5/13/2020
const _fs = __importStar( require( "fs" ) );
const _path = __importStar( require( "path" ) );
const sow_util_1 = require( "./sow-util" );
const _supportSchema = {
    "http://json-schema.org/draft-07/schema": "draft-07"
};
function readSchemaAsync( absPath ) {
    const jsonstr = _fs.readFileSync( absPath, "utf8" );
    try {
        return JSON.parse( jsonstr );
    }
    catch ( e ) {
        throw new Error( `Invalid schema file defined.\nPlease re-install cwserver.` );
    }
}
function propertiValidate( dataPath, configProperties, schemaProperties, additionalProperties ) {
    // tslint:disable-next-line: forin
    for ( const prop in configProperties ) {
        const svalue = schemaProperties[prop];
        if ( !svalue ) {
            if ( additionalProperties )
                continue;
            throw new Error( `ERROR: Configuration doesn't match the required schema. Data path "${dataPath}" should NOT have additional property (${prop}).` );
        }
        const cvalue = configProperties[prop];
        if ( svalue.type === "array" ) {
            if ( !sow_util_1.Util.isArrayLike( cvalue ) ) {
                throw new Error( `ERROR: Data path "${dataPath}.${prop}" should be value type ${svalue.type}` );
            }
            continue;
        }
        if ( typeof ( cvalue ) !== svalue.type ) {
            throw new Error( `ERROR: Configuration doesn't match the required schema. Data path "${dataPath}.${prop}" should be value type ${svalue.type}` );
        }
    }
}
function fillUpType( type ) {
    switch ( type ) {
        case "array": return [];
        case "number": return 0;
        case "boolean": return false;
        case "string": return "";
        case "object": return {};
    }
    return void 0;
}
function schemaValidate( dataPath, schemaProperties, configProperties, additionalProperties ) {
    // check config properties are valid
    propertiValidate( dataPath, configProperties, schemaProperties, additionalProperties );
    // tslint:disable-next-line: forin
    for ( const prop in schemaProperties ) {
        const hasProp = configProperties.hasOwnProperty( prop );
        const cvalue = configProperties[prop];
        const svalue = schemaProperties[prop];
        if ( svalue.type === "boolean" ) {
            if ( typeof ( cvalue ) !== svalue.type ) {
                throw new Error( `ERROR: Data path "${dataPath}.${prop}" should be value type ${svalue.type}` );
            }
            continue;
        }
        if ( cvalue === undefined && svalue.minLength > 0 ) {
            if ( !hasProp ) {
                throw new Error( `ERROR: Configuration doesn't match the required schema. Data path "${dataPath}" required properties (${prop}).` );
            }
            throw new Error( `ERROR: Data path "${dataPath}.${prop}" value should not left blank` );
        }
        if ( cvalue === undefined ) {
            configProperties[prop] = fillUpType( svalue.type );
            continue;
        }
        if ( svalue.type === "array" ) {
            if ( !sow_util_1.Util.isArrayLike( cvalue ) ) {
                throw new Error( `ERROR: Data path "${dataPath}.${prop}" should be value type ${svalue.type}` );
            }
            if ( cvalue.length < svalue.minLength ) {
                throw new Error( `ERROR: Data path "${dataPath}.${prop}" minmum length required ${svalue.minLength}` );
            }
            if ( svalue.items ) {
                const itemType = svalue.items.type;
                if ( itemType === "object" && svalue.items.properties ) {
                    const itemprop = svalue.items.properties;
                    cvalue.forEach( ( a, index ) => {
                        if ( typeof ( a ) !== itemType ) {
                            throw new Error( `ERROR: Data path "${dataPath}.${prop}" should be item value type ${itemType}` );
                        }
                        schemaValidate( `${dataPath}.${prop}[${index}]`, itemprop, a, svalue.additionalProperties ? svalue.additionalProperties : false );
                    } );
                    continue;
                }
                cvalue.forEach( a => {
                    if ( typeof ( a ) !== itemType ) {
                        throw new Error( `ERROR: Data path "${dataPath}.${prop}" should be item value type ${itemType}` );
                    }
                } );
            }
            continue;
        }
        if ( svalue.type === "object" ) {
            if ( svalue.properties && Object.keys( svalue.properties ).length > 0 ) {
                schemaValidate( `${dataPath}.${prop}`, svalue.properties, cvalue, svalue.additionalProperties ? svalue.additionalProperties : false );
            }
            continue;
        }
        if ( svalue.const ) {
            if ( svalue.const !== cvalue )
                throw new Error( `ERROR: Data path "${dataPath}.${prop}" should not change '${svalue.const}' to '${cvalue}'` );
            continue;
        }
        if ( svalue.type === "string" ) {
            if ( svalue.enum ) {
                if ( svalue.enum.indexOf( cvalue ) < 0 ) {
                    throw new Error( `ERROR: Data path "${dataPath}.${prop}" should be between ${svalue.enum}` );
                }
            }
            if ( svalue.minLength > 0 ) {
                if ( cvalue.length < svalue.minLength )
                    throw new Error( `ERROR: Data path "${dataPath}.${prop}" minmum length required ${svalue.minLength}` );
            }
        }
    }
}
// tslint:disable-next-line: no-namespace
( function ( Schema ) {
    function Validate( config ) {
        const parent = _path.resolve( __dirname, '../..' );
        const absPath = _path.resolve( `${parent}/schema.json` );
        const schema = readSchemaAsync( absPath );
        const schemaRoot = _supportSchema[schema.$schema];
        if ( !schemaRoot ) {
            throw new Error( `Invalid schema file defined.\nPlease re-install cwserver.` );
        }
        if ( !config.$schema ) {
            throw new Error( `No schema defined in config file.\nConfig file should be use $schema:${schema.$schema}.` );
        }
        delete config.$schema;
        if ( config.$comment ) {
            delete config.$comment;
        }
        if ( typeof ( config ) !== schema.type ) {
            throw new Error( `Invalid config file defined.\nConfig file should be ${schema.type}.` );
        }
        schemaValidate( "config", schema.properties, config, schema.additionalProperties );
    }
    Schema.Validate = Validate;
} )( exports.Schema || ( exports.Schema = {} ) );