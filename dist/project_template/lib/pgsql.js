//#!/usr/bin/env node
/**
* Copyright (c) 2018, SOW ( https://fsys.tech, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:48 PM 4/24/2020
/**
 CREATE OR REPLACE FUNCTION my_shcema.__get_dataset(
    IN _ct jsonb,
    IN _obj jsonb,
    OUT _ret_data_table jsonb,
    OUT _ret_val bigint,
    OUT _ret_msg character varying)
  RETURNS record AS
$BODY$

declare
	__login_id varchar;
begin
	-- 3:37 PM 5/14/2020
	
	--[INITIALIZATION]
	_ret_val						:= -1998;
	_ret_msg						:= 'Failed due to Uncaught Escape';
	--[/INITIALIZATION]
	
	-- ctx		==> _ct
	-- formObj	==>	_obj
	
	__login_id						:= 	_ct->>'login_id';
		
	select
		jsonb_agg(mr)
	into
		_ret_data_table 
	from(
		SELECT
			_ct as ctx, _obj as form_obj
		
	)as mr;

	_ret_val 						:=	1;
	_ret_msg 						:=	'Success';

end;

$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;
ALTER FUNCTION my_shcema.__get_dataset(jsonb, jsonb)
  OWNER TO postgres;
*/
/**
 * @typedef {{host: string; port: number;user: string; database: string; password: string;}} IConnectionInfo
 */
const { Util } = require( "cwserver" );
const _pg = require( 'pg' );
/** @type {string} */
const _sp_q = 'SELECT _ret_val as ret_val, _ret_msg as ret_msg, _ret_data_table as ret_data_table FROM';
/** @type {IConnectionInfo} */
const _default_config = {
    host: "localhost",
    port: 5432,
    user: "postgres",
    database: void 0,
    password: void 0
};
/**
 * Parse out direction properties
 * @param {string} name 
 */
function parseOutField( name ) {
    if ( name.charAt( 0 ) !== '_' ) return name;
    return name.substring( 1 );
}
/**
 * Parse PGSQL Stored Procedure response result
 * @param {import('pg').QueryResult} response
 * @param {(prop:string, value:any)=>any} transform
 * @returns {NodeJS.Dict<any>} result
 */
function parseResult( response, transform ) {
    let result = {};
    response.fields.forEach( ( fieldInfo ) => {
        const prop = parseOutField( fieldInfo.name );
        result[prop] = transform( prop, response.rows[0][fieldInfo.name] );
    } );
    return result;
}
/**
 * Transform Databse Result
 * @param {string} prop
 * @param {any} val
 * @returns {any}
 */
function transformResult( prop, val ) {
    switch ( prop ) {
        case "ret_val": return parseInt( val );
        case "ret_msg": return typeof ( val ) === "string" ? val : String( val );
        case "ret_data_table": return typeof ( val ) === "string" ? JSON.parse( val ) : val;
    }
    return val;
}
/** this lib created according to ISowDatabaseType*/
/**
 * in my app.config.json database section now like this
 * "database":[
 * {
 *   "module": "pgsql",
 *   "path": "$root/$public/lib/pgsql.js",
 *   "dbConn": {
 *      "database": "mydb",
 *      "password": "123456"
 *   }
 * }
 * ]
 * Us it anywhere of application e.g
 * server.db.pgsql.*
 * */
class PgSQL {
    /**
     * PGSQL instance initilize
     * @param {IConnectionInfo} connectionInfo
     * @returns {PgSQL}
     */
    constructor( connectionInfo ) {
        /** @type {IConnectionInfo} */
        this.connectionInfo = Util.clone( _default_config );
        Util.extend( this.connectionInfo, connectionInfo );
    }
    /**
     * Get PGSQL Client 
     * @returns {_pg.Client}
     */
    getConn() {
        return new ( _pg.Client )( this.connectionInfo );
    }
    /**
     * PGSQL Execute plain text quary
     * @param {string} queryText
     * @param {any[]} values
     * @param {(result: import('cwserver/dist/lib/sow-db-type').QResult<R>) => void} callback
     * @returns {void}
     */
    query( queryText, values, callback ) {
        const conn = this.getConn();
        return conn.connect( cerr => {
            if ( cerr ) return callback( { isError: true, err: cerr } );
            return conn.query( queryText, values, ( err, res ) => {
                if ( err ) return callback( { isError: true, err: err } );
                conn.end( function ( err ) {
                    return callback( { isError: false, res: res } );
                } );
            } );
        } );
    }
    /**
     * PGSQL Execute Async plain text quary
     * @param {string} queryText
     * @param {any[]} values
     * @returns {Promise<import('cwserver/dist/lib/sow-db-type').QResult<R>>}
     */
    queryAsync( queryText, values ) {
        return new Promise( async ( resolve, reject ) => {
            const conn = this.getConn();
            try {
                await conn.connect();
                let res = await conn.query( queryText, values );
                await conn.end();
                return resolve( { isError: false, res: res } );
            } catch ( err ) {
                return resolve( { isError: true, err: err } );
            }
        } );
    }
    /**
     * PGSQL Execute Stored Procedure
     * @param {string} sp
     * @param {string} ctx
     * @param {string} form_obj
     * @param {(result: import('cwserver/dist/lib/sow-db-type').IoResult) => void} next
     * @returns {void}
     */
    executeIo( sp, ctx, form_obj, next ) {
        const conn = this.getConn();
        return conn.connect( cerr => {
            if ( cerr ) return next( { ret_val: -1, ret_msg: cerr.message } );
            conn.query( `${_sp_q} ${sp}($1::jsonb, $2::jsonb)`, [ctx, form_obj], ( err, rs ) => {
                if ( err ) return next( { ret_val: -1, ret_msg: err.message } );
                conn.end( function ( err ) {
                    return next( parseResult( rs, transformResult ) );
                } );
            } );
        } ), void 0;
    }
    /**
     * PGSQL Execute Stored Procedure
     * @param {string} sp
     * @param {string} ctx
     * @param {string} form_obj
     * @returns {Promise<import('cwserver/dist/lib/sow-db-type').IoResult>}
     */
    executeIoAsync( sp, ctx, form_obj ) {
        return new Promise( async ( resolve, reject ) => {
            try {
                const conn = this.getConn();
                await conn.connect();
                let res = await conn.query( `${_sp_q} ${sp}($1::jsonb, $2::jsonb)`, [ctx, form_obj] );
                await conn.end();
                return resolve( parseResult( res, transformResult ) );
            } catch ( e ) {
                return resolve( { ret_val: -1, ret_msg: e.message } );
            }
        } );
    }
}
module.exports = PgSQL;