"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketClient = exports.SocketErr2 = exports.SocketErr1 = void 0;
const expect_1 = __importDefault(require("expect"));
const index_1 = require("../index");
const clientInfo = index_1.wsClient();
clientInfo.on("beforeInitiateConnection", (session, socket) => {
    /*if ( !session.isAuthenticated ) {
        return socket.emit( "unauthorized", "Authentication failed" ), socket.disconnect( true ), false;
    }*/
    return true;
});
clientInfo.on("getClient", (me, session, wsServer, server) => {
    const _client = {
        'test-msg': (data) => {
            expect_1.default(me.getSocket()).toBeDefined();
            expect_1.default(wsServer.isActiveSocket(me.token)).toEqual(true);
            expect_1.default(wsServer.getOwners(me.group || "no_group").length).toEqual(0);
            expect_1.default(wsServer.getOwners().length).toEqual(0);
            expect_1.default(wsServer.findByHash(me.hash || "no_hash").length).toEqual(me.isAuthenticated ? 1 : 0);
            expect_1.default(wsServer.findByLogin(me.loginId || "un_authorized").length).toEqual(me.isAuthenticated ? 1 : 0);
            expect_1.default(wsServer.toList([]).length).toEqual(0);
            if (me.isAuthenticated) {
                expect_1.default(wsServer.toList(wsServer.getClientByExceptHash(me.hash || "no_hash")).length).toEqual(0);
                expect_1.default(wsServer.toList(wsServer.findByHash(me.hash || "no_hash")).length).toBeGreaterThan(0);
                expect_1.default(wsServer.getClientByExceptLogin(me.loginId || "un_authorized").length).toEqual(0);
            }
            else {
                expect_1.default(wsServer.toList(wsServer.getClientByExceptHash(me.hash || "no_hash")).length).toBeGreaterThan(0);
                expect_1.default(wsServer.getClientByExceptLogin(me.loginId || "un_authorized").length).toBeGreaterThan(0);
            }
            expect_1.default(wsServer.getClientByExceptHash(me.hash || "no_hash", me.group || "no_group").length).toEqual(0);
            expect_1.default(wsServer.getClientByExceptLogin(me.loginId || "un_authorized", me.group || "no_group").length).toEqual(0);
            expect_1.default(wsServer.getClientByExceptToken(me.token, me.group || "no_group").length).toEqual(0);
            expect_1.default(wsServer.sendMsg("XX-INVALID-TOKEN", "on-test-msg", data)).toEqual(false);
            expect_1.default(wsServer.removeSocket("XX-INVALID-TOKEN")).toEqual(false);
            return wsServer.sendMsg(me.token, "on-test-msg", data);
        }
    };
    return !me ? {
        server: Object.keys(_client),
        client: []
    } : _client;
});
clientInfo.on("connected", (me, wsServer) => {
    const method = me.isReconnectd ? "on-re-connected-user" : "on-connect-user";
    wsServer.getClientByExceptToken(me.token).forEach(conn => {
        conn.sendMsg(method, {
            token: me.token, hash: me.hash, loginId: me.loginId
        });
    });
    // Here connect any user
    me.sendMsg(me.isReconnectd ? "on-re-connected" : "on-connected", {
        token: me.token, hash: me.hash, loginId: me.loginId
    });
});
clientInfo.on("disConnected", (me, wsServer) => {
    // Here disconnect any user
    wsServer.getClientByExceptToken(me.token).forEach(conn => {
        conn.sendMsg("on-disconnected-user", {
            token: me.token, hash: me.hash, loginId: me.loginId
        });
    });
});
const error1 = index_1.wsClient();
error1.on("getClient", (me, session, wsServer, server) => {
    const _client = {
        'test-msg': (data) => {
            return wsServer.sendMsg(me.token, "on-test-msg", data);
        }
    };
    return !me ? {
        server: Object.keys(_client),
        client: []
    } : _client;
});
function SocketErr1() {
    return error1;
}
exports.SocketErr1 = SocketErr1;
const error2 = index_1.wsClient();
error2.on("beforeInitiateConnection", (session, socket) => {
    /*if ( !session.isAuthenticated ) {
        return socket.emit( "unauthorized", "Authentication failed" ), socket.disconnect( true ), false;
    }*/
    return true;
});
function SocketErr2() {
    return error2;
}
exports.SocketErr2 = SocketErr2;
function SocketClient() {
    return clientInfo;
}
exports.SocketClient = SocketClient;
//# sourceMappingURL=socket-client.js.map