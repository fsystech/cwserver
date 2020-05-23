import expect from 'expect';
import { wsClient } from '../index';
const clientInfo = wsClient();
clientInfo.on( "beforeInitiateConnection", ( session, socket ) => {
    /*if ( !session.isAuthenticated ) {
        return socket.emit( "unauthorized", "Authentication failed" ), socket.disconnect( true ), false;
    }*/
    return true;
} );
clientInfo.on( "getClient", ( me, session, wsServer, server ) => {
    const _client = {
        'test-msg': ( data: any ) => {
            expect( me.getSocket() ).toBeDefined();
            expect( wsServer.isActiveSocket( me.token ) ).toEqual( true );
            expect( wsServer.getOwners( me.group ).length ).toEqual( 0 );
            expect( wsServer.getOwners().length ).toEqual( 0 );
            expect( wsServer.findByHash( me.hash || "no_hash" ).length ).toEqual( 0 );
            expect( wsServer.findByLogin( me.loginId || "un_authorized" ).length ).toEqual( 0 );
            expect( wsServer.toList( wsServer.getClientByExceptHash( me.hash || "no_hash" ) ).length ).toBeGreaterThan( 0 );
            expect( wsServer.getClientByExceptHash( me.hash || "no_hash", me.group || "no_group" ).length ).toEqual( 0 );
            expect( wsServer.getClientByExceptLogin( me.loginId || "un_authorized" ).length ).toBeGreaterThan( 0 );
            expect( wsServer.getClientByExceptLogin( me.loginId || "un_authorized", me.group || "no_group" ).length ).toEqual( 0 );
            return wsServer.sendMsg( me.token, "on-test-msg", data );
        }
    };
    return !me ? {
        server: Object.keys( _client ),
        client: []
    } : _client;
} );
clientInfo.on( "connected", ( me, wsServer ) => {
     const method = me.isReconnectd ? "on-re-connected-user" : "on-connect-user";
     wsServer.getClientByExceptToken( me.token ).forEach( conn => {
        conn.sendMsg( method, {
            token: me.token, hash: me.hash, loginId: me.loginId
        } );
     } );
     // Here connect any user
     me.sendMsg( me.isReconnectd ? "on-re-connected" : "on-connected", {
        token: me.token, hash: me.hash, loginId: me.loginId
     } );
} );
clientInfo.on( "disConnected", ( me, wsServer ) => {
     // Here disconnect any user
     wsServer.getClientByExceptToken( me.token ).forEach( conn => {
        conn.sendMsg( "on-disconnected-user", {
            token: me.token, hash: me.hash, loginId: me.loginId
        } );
     } );
} );
export function SocketClient() {
    return clientInfo;
}