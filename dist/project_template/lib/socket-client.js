const { wsClient } = require( "cwserver" )
const clientInfo = wsClient();
clientInfo.on( "getClient", ( me, session, wsServer, server ) => {
    var _client = {
        'private-msg': ( hash, msg ) => {
            wsServer.findByHash( hash ).forEach( soc => {
                soc.sendMsg( "on-private-msg", me.hash, msg );
            } );
        },
        'public-msg': data => {
            me.getSocket().broadcast.emit( "on-public-msg", me.token, data.msg );
        },
    };
    return !me ? {
        server: Object.keys( _client ),
        client: []
    } : _client;
} );
clientInfo.on( "beforeInitiateConnection", ( session, socket ) => {
    if ( !session.isAuthenticated ) {
        return socket.emit( "unauthorized", "Authentication failed" ), socket.disconnect( true ), false;
    }
    return true;
} );
clientInfo.on( "onConnected", ( me, wsServer ) => {
    const method = me.isReconnectd ? "on-re-connected-user" : "on-connected-user";
    wsServer.getClientByExceptToken( me.token ).forEach( conn => {
        conn.sendMsg( method, {
            token: me.token, hash: me.hash, loginId: me.loginId
        } );
    } );
    //Here connect any user
    me.sendMsg( me.isReconnectd ? "on-re-connected" : "on-connected", {
        token: me.token, hash: me.hash, loginId: me.loginId
    } );
} );
clientInfo.on( "onDisConnected", ( me, wsServer ) => {
    //Here disconnect any user
    wsServer.getClientByExceptToken( me.token ).forEach( conn => {
        conn.sendMsg( "on-disconnected-user", {
            token: me.token, hash: me.hash, loginId: me.loginId
        } );
    } );
} );
module.exports = clientInfo;