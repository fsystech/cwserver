//#!/usr/bin/env node
/**
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
//10:48 PM 4/24/2020
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
const { Util } = require( "cwserver" );
const _pg = require( 'pg' );
const _sp_q = 'SELECT _ret_val as ret_val, _ret_msg as ret_msg, _ret_data_table as ret_data_table FROM';
const _default_config = {
    host: "localhost",
    port: 5432,
    user: "postgres"
};
function parse_out_field( name ) {
    if ( name.charAt( 0 ) !== '_' ) return name;
    return name.substring( 1 );
}
function parse_result( rs ) {
    let result = {};
    rs.fields.forEach( ( field_info ) => {
        result[parse_out_field( field_info.name )] = rs.rows[0][field_info.name];
    } );
    return result;
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
    constructor( connectionInfo ) {
        this.connectionInfo = Util.clone( _default_config );
        Util.extend( this.connectionInfo, connectionInfo );
    }
    getClient() {
        return new ( _pg.Client )( this.connectionInfo );
    }
    executeIo( sp, ctx, form_obj, next ) {
        var client = new ( _pg.Client )( this.connectionInfo );
        return client.connect( cerr => {
            if ( cerr ) return client = void 0, next( { ret_val: -1, ret_msg: cerr.message } );
            client.query( `${_sp_q} ${sp}($1::jsonb, $2::jsonb)`, [ctx, form_obj], ( err, rs ) => {
                if ( err ) return next( { ret_val: -1, ret_msg: err.message } );
                client.end( function ( err ) {
                    return client = void 0, next( parse_result( rs ) );
                } );
            } );
        } ), void 0;
    }
    executeIoAsync( sp, ctx, form_obj ) {
        return new Promise( async ( resolve, reject ) => {
            var client = new ( _pg.Client )( this.connectionInfo );
            try {
                await client.connect();
                let res = await client.query( `${_sp_q} ${sp}($1::jsonb, $2::jsonb)`, [ctx, form_obj] );
                await client.end();
                return client = void 0, resolve( parse_result( res ) );
            } catch ( e ) {
                return client = void 0, resolve( { ret_val: -1, ret_msg: e.message } );
            }
        } );
    }
}
module.exports = PgSQL;
/*
//async function getData( server, ctx ) {
    let result = await server.db.pgsql.executeIoAsync( "my_shcema.__get_dataset", JSON.stringify( {
        login_id: ctx.req.session.loginId
    } ), JSON.stringify( {
        trade_date: "2020-02-03"
    } ) );
//    console.log( `${t}==>${result.ret_msg}` );
//}
*/