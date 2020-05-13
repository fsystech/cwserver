const {WsClientInfo} =  require("cwserver")
const clientInfo = new WsClientInfo((session,socket)=>{
    if ( !session.isAuthenticated ) {
        return socket.emit( "unauthorized", "Authentication failed" ), socket.disconnect( true ), false;
    }
    return true;
},(_me, session, _ws, _server)=>{
    var _client = {
        'register': data => {
            if ( _me.isAuthenticated === false ) return void 0;
            _me.isOwner = data.is_owner;
            return _me.sendMsg( "on-registered", {
                group: _me.group
            } );
        },
        'join': data => {
            if ( !_me.isAuthenticated ) return;
            _me.group = data.group;
            return _me.sendMsg( "on-join", data );
        },
        'stream': data => {
            if ( _me.isOwner === false || !_me.isAuthenticated || !_me.group ) return void 0;
            return _ws.getClient( _me.token, _me.group ).forEach( soc => {
                soc.sendMsg( 'stream', data );
            } ), void 0;
        },
        'audio': data => {
            if ( _me.isOwner === false || !_me.isAuthenticated || !_me.group ) return void 0;
            return _ws.getClient( _me.token, _me.group ).forEach( soc => {
                soc.sendMsg( 'audio', data );
            } ), void 0;
        },
        'get-offer': data => {
            if ( !_me.isAuthenticated || !_me.group ) {
                _server.log.error( "get-offer" );
                return;
            }
            let owner = _ws.getOwners( _me.group )[0];
            if ( !owner ) {
                return _me.sendMsg( "no-owner", {} );
            }
            return owner.sendMsg( "get-offer", {
                token: _me.token
            } );
        },
        'call-user': data => {
            if ( !_me.isAuthenticated || !_me.group ) return;
            return _ws.sendMsg( data.to, "call-made", {
                offer: data.offer,
                token: _me.token
            } );
        },
        'make-answer': data => {
            if ( !_me.isAuthenticated || !_me.group ) return;
            return _ws.sendMsg( data.to, "answer-made", {
                token: _me.token,
                answer: data.answer
            } );
        },
        'reject-call': data => {
            if ( !_me.isAuthenticated || !_me.group ) return;
            return _ws.sendMsg( data.from, "call-rejected", {
                token: _me.token
            } );
        },
        'active-user': data => {
            if ( !_me.isAuthenticated || !_me.group ) return;
            return _me.sendMsg( "on-active-user", {
                token: _ws.toList( _ws.getClient( _me.token, _me.group ) )
            } );
        }
    };
    if ( _server  ) {
        _client["get-owner"] = data => {
            if ( !_me.isAuthenticated || !_me.group ) return;
            let owner = _ws.getOwners( _me.group )[0];
            if ( !owner ) {
                return _me.sendMsg( "no-owner", {} );
            }
            return _me.sendMsg( "on-owner", {
                token: owner.token
            } );
        };
    }
    return !_me ? {
        server: Object.keys( _client ),
        client: []
    } : _client;
});
clientInfo.getServerEvent = function(){
    return this.client();
}
module.exports = clientInfo;