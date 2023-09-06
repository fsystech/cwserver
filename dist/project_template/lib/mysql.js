//#!/usr/bin/env node
/**
* Copyright (c) 2018, SOW ( https://fsys.tech, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 7:17 PM 5/19/2020
const { Util } = require( "cwserver" );
const _mysql = require( 'mysql' );
const _default_config = {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: void 0
};
/** this lib created according to ISowDatabaseType*/
/**
 * in my app.config.json database section now like this
 * "database":[
 * {
 *   "module": "mysql",
 *   "path": "$root/$public/lib/mysql.js",
 *   "dbConn": {
 *      "database": "mydb",
 *      "password": "123456"
 *   }
 * }
 * ]
 * Us it anywhere of application e.g
 * server.db.mysql.*
 * */
class MySql {
    constructor( connectionInfo ) {
        this.connectionInfo = Util.clone( _default_config );
        Util.extend( this.connectionInfo, connectionInfo );
    }
    getConn() {
        return _mysql.createConnection( this.connectionInfo );;
    }
    query( queryText, values, callback ) {
        const conn = this.getConn();
        return conn.connect( cerr => {
            if ( cerr ) return callback( { isError: true, err: err } );
            return conn.query( queryText, values || [], ( err, res, fields ) => {
                if ( err ) return callback( { isError: true, err: err } );
                conn.end( function ( err ) {
                    return callback( {
                        isError: false, res: {
                            rows: res,
                            fields
                        }
                    } );
                } );
            } );
        } );
    }
    queryAsync( queryText, values ) {
        return new Promise( async ( resolve, reject ) => {
            const conn = this.getConn();
            return conn.connect( cerr => {
                if ( cerr ) return resolve( { isError: true, err: err } );
                return conn.query( queryText, values || [], ( err, res, fields ) => {
                    if ( err ) return resolve( { isError: true, err: err } );
                    conn.end( function ( err ) {
                        return resolve( {
                            isError: false, res: {
                                rows: res,
                                fields
                            }
                        } );
                    } );
                } );
            } );
        } );
    }
    executeIo( sp, ctx, form_obj, next ) {
        throw new Error( 'Method not implemented.' );
    }
    executeIoAsync( sp, ctx, form_obj ) {
        throw new Error( 'Method not implemented.' );
    }
}
module.exports = MySql;