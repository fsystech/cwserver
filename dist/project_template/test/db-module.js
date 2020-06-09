//#!/usr/bin/env node
class DBContext {
    constructor( connectionInfo ) {
        //demo
    }
    getConn() {
        return {};
    }
    query( queryText, values, callback) {
        return callback( { isError: false, res: void 0 } );
    }
    queryAsync( queryText, values ) {
        return new Promise( async ( resolve, reject ) => {
            setTimeout( () => {
                return resolve( { isError: false, res: void 0 } );
            }, 100 );
        } );
    }
    executeIo( sp, ctx, form_obj, next ) {
        return void 0;
    }
    executeIoAsync( sp, ctx, form_obj ) {
        return new Promise( async ( resolve, reject ) => {
            setTimeout( () => {
                return resolve( { ret_val: 1, ret_msg: "success" } );
            }, 100 );
        } );
    }
}
module.exports = DBContext;