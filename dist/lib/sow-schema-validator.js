"use strict";
var __createBinding = ( this && this.__createBinding ) || ( Object.create ? ( function ( o, m, k, k2 ) {
    if ( k2 === undefined ) k2 = k;
    Object.defineProperty( o, k2, { enumerable: true, get: function () { return m[k]; } } );
} ) : ( function ( o, m, k, k2 ) {
    if ( k2 === undefined ) k2 = k;
    o[k2] = m[k];
} ) );
var __setModuleDefault = ( this && this.__setModuleDefault ) || ( Object.create ? ( function ( o, v ) {
    Object.defineProperty( o, "default", { enumerable: true, value: v } );
} ) : function ( o, v ) {
    o["default"] = v;
} );
var __importStar = ( this && this.__importStar ) || function ( mod ) {
    if ( mod && mod.__esModule ) return mod;
    var result = {};
    if ( mod != null ) for ( var k in mod ) if ( Object.hasOwnProperty.call( mod, k ) ) __createBinding( result, mod, k );
    __setModuleDefault( result, mod );
    return result;
};
Object.defineProperty( exports, "__esModule", { value: true } );
exports.Schema = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
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
    for ( const prop in schemaProperties ) {
        const cvalue = configProperties[prop];
        const svalue = schemaProperties[prop];
        const valueType = typeof ( cvalue );
        if ( valueType === "undefined" && svalue.minLength > 0 ) {
            throw new Error( `ERROR: Configuration doesn't match the required schema. Data path "${dataPath}" required properties (${prop}).` );
        }
        if ( valueType === "undefined" ) {
            configProperties[prop] = fillUpType( svalue.type );
            continue;
        }
        if ( svalue.type === "array" ) {
            if ( sow_util_1.Util.isArrayLike( cvalue ) ) {
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
( function ( Schema ) {
    function Validate( config ) {
        const parent = process.env.SCRIPT === "TS" ? _path.resolve( __dirname, '..' ) : _path.resolve( __dirname, '../..' );
        const absPath = _path.resolve( `${parent}/schema.json` );
        const schema = readSchemaAsync( absPath );
        const schemaRoot = _supportSchema[schema.$schema];
        if ( !schemaRoot ) {
            throw new Error( `Invalid schema file defined.\nPlease re-install cwserver.` );
        }
        if ( !sow_util_1.Util.isPlainObject( config ) ) {
            throw new Error( `Invalid config file defined.\nConfig file should be ${schema.type}.` );
        }
        if ( !config.$schema ) {
            throw new Error( `No schema defined in config file.\nConfig file should be use $schema:${schema.$schema}` );
        }
        delete config.$schema;
        if ( config.$comment ) {
            delete config.$comment;
        }
        schemaValidate( "config", schema.properties, config, schema.additionalProperties );
    }
    Schema.Validate = Validate;
} )( exports.Schema || ( exports.Schema = {} ) );
//# sourceMappingURL=sow-schema-validator.js.map