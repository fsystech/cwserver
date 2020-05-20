const { wsClient } = require( "../../index" )
const clientInfo = wsClient();
clientInfo.on( "beforeInitiateConnection", ( session, socket ) => {
    /*if ( !session.isAuthenticated ) {
        return socket.emit( "unauthorized", "Authentication failed" ), socket.disconnect( true ), false;
    }*/
    return true;
} );
clientInfo.on( "getClient", ( me, session, wsServer, server ) => {
    var _client = {
        'test-msg': data => {
            return me.sendMsg( "on-test-msg", data );
        }
    };
    return !me ? {
        server: Object.keys( _client ),
        client: []
    } : _client;
} );
clientInfo.on( "connected", ( me, wsServer ) => {
    //const method = me.isReconnectd ? "on-re-connected-user" : "on-connect-user";
    //wsServer.getClientByExceptToken( me.token ).forEach( conn => {
    //    conn.sendMsg( method, {
    //        token: me.token, hash: me.hash, loginId: me.loginId
    //    } );
    //} );
    //Here connect any user
    //me.sendMsg( me.isReconnectd ? "on-re-connected" : "on-connected", {
    //    token: me.token, hash: me.hash, loginId: me.loginId
    //} );
} );
clientInfo.on( "disConnected", ( me, wsServer ) => {
    //Here disconnect any user
    //wsServer.getClientByExceptToken( me.token ).forEach( conn => {
    //    conn.sendMsg( "on-disconnected-user", {
    //        token: me.token, hash: me.hash, loginId: me.loginId
    //    } );
    //} );
} );
module.exports = clientInfo;