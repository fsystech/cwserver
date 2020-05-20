"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
const sow_encryption_1 = require("./sow-encryption");
const sow_util_1 = require("./sow-util");
class WsClientInfo {
    constructor() {
        this.beforeInitiateConnection = Object.create(null);
        this.client = Object.create(null);
        this.event = {};
    }
    getServerEvent() {
        if (!this.event["getClient"])
            throw new Error("`getClient` event did not registered...");
        const obj = this.event["getClient"]();
        if (obj instanceof Array)
            return obj;
        return [];
    }
    on(ev, handler) {
        if (ev === "getClient") {
            this.event[ev] = handler;
            return this.client = handler, void 0;
        }
        if (ev === 'beforeInitiateConnection') {
            return this.beforeInitiateConnection = handler, void 0;
        }
        this.event[ev] = handler;
    }
    emit(ev, me, wsServer) {
        if (!this.event[ev])
            return void 0;
        return this.event[ev](me, wsServer);
    }
}
function wsClient() {
    return new WsClientInfo();
}
exports.wsClient = wsClient;
// tslint:disable-next-line: max-classes-per-file
class SowSocket {
    constructor(server, wsClientInfo) {
        this.implimented = false;
        this.socket = [];
        this.connected = false;
        this._server = server;
        this._wsClients = wsClientInfo;
    }
    isActiveSocket(token) {
        return this.socket.some((a) => { return a.token === token; });
    }
    getOwners(group) {
        return group ? this.socket.filter(soc => soc.isOwner === true && soc.group === group) : this.socket.filter(soc => soc.isOwner === true);
    }
    findByHash(hash) {
        return this.socket.filter(soc => soc.hash === hash);
    }
    findByLogin(loginId) {
        return this.socket.filter(soc => soc.loginId === loginId);
    }
    toList(sockets) {
        const list = [];
        if (!sockets)
            return list;
        sockets.forEach(a => {
            list.push({
                token: a.token, hash: a.hash, loginId: a.loginId
            });
        });
        return list;
    }
    getClientByExceptHash(exceptHash, group) {
        return !group ? this.socket.filter(soc => soc.hash !== exceptHash) : this.socket.filter(soc => soc.hash !== exceptHash && soc.group === group);
    }
    getClientByExceptLogin(exceptLoginId, group) {
        return !group ? this.socket.filter(soc => soc.loginId !== exceptLoginId) : this.socket.filter(soc => soc.loginId !== exceptLoginId && soc.group === group);
    }
    getClientByExceptToken(token, group) {
        return !group ? this.socket.filter(soc => soc.token !== token) : this.socket.filter(soc => soc.token !== token && soc.group === group);
    }
    getSocket(token) {
        return this.socket.find(soc => soc.token === token);
    }
    removeSocket(token) {
        let index = -1;
        this.socket.find((soc, i) => {
            return (soc.token === token ? (index = i, true) : false);
        });
        if (index < 0)
            return false;
        this.socket.splice(index, 1);
        return true;
    }
    sendMsg(token, method, data) {
        const soc = this.getSocket(token);
        if (!soc)
            return false;
        return soc.sendMsg(method, data), true;
    }
    create(ioserver) {
        if (this.implimented)
            return void 0;
        this.implimented = true;
        const io = ioserver(this._server.getHttpServer(), {
            path: this._server.config.socketPath,
            pingTimeout: (1000 * 5),
            cookie: true
        });
        this._server.on("shutdown", () => {
            io.close();
        });
        if (!this._server.config.socketPath) {
            this._server.config.socketPath = io._path;
        }
        io.use((socket, next) => {
            if (!socket.request.session) {
                socket.request.session = this._server.parseSession(socket.request.headers.cookie);
            }
            if (!this._wsClients.beforeInitiateConnection(socket.request.session, socket))
                return void 0;
            return next();
        });
        return io.on("connect", (socket) => {
            this.connected = socket.connected;
        }).on('connection', (socket) => {
            if (!socket.request.session) {
                socket.request.session = this._server.parseSession(socket.handshake.headers.cookie);
            }
            if (!this._wsClients.beforeInitiateConnection(socket.request.session, socket))
                return void 0;
            const _me = (() => {
                const token = sow_util_1.Util.guid();
                this.socket.push({
                    token,
                    loginId: socket.request.session.loginId,
                    hash: socket.request.session.isAuthenticated ? sow_encryption_1.Encryption.toMd5(socket.request.session.loginId) : void 0,
                    socketId: socket.id,
                    isAuthenticated: socket.request.session.isAuthenticated,
                    isOwner: false,
                    group: void 0,
                    isReconnectd: false,
                    getSocket: () => { return socket; },
                    sendMsg: (method, data) => {
                        if (!socket)
                            return this;
                        return socket.emit(method, data), this;
                    },
                });
                const socketInfo = this.getSocket(token);
                if (!socketInfo)
                    throw new Error("Should not here...");
                return socketInfo;
            })();
            socket.on('disconnect', () => {
                if (!this.removeSocket(_me.token))
                    return;
                return this._wsClients.emit("disConnected", _me, this), void 0;
            });
            const client = this._wsClients.client(_me, socket.request.session, this, this._server);
            // tslint:disable-next-line: forin
            for (const method in client) {
                socket.on(method, client[method]);
            }
            return this._wsClients.emit("connected", _me, this), void 0;
        }), void 0;
    }
}
/** If you want to use it you've to install socket.io */
function socketInitilizer(server, wsClientInfo) {
    if (typeof (wsClientInfo.client) !== "function") {
        throw new Error("`getClient` event did not registered...");
    }
    if (typeof (wsClientInfo.beforeInitiateConnection) !== "function") {
        throw new Error("`beforeInitiateConnection` event did not registered...");
    }
    let _ws_event = void 0;
    const _ws = new SowSocket(server, wsClientInfo);
    return {
        get isConnectd() {
            return _ws.implimented;
        },
        get wsEvent() {
            return _ws_event ? _ws_event : (_ws_event = wsClientInfo.getServerEvent(), _ws_event);
        },
        create(ioserver) {
            if (_ws.implimented)
                return;
            return _ws.create(ioserver);
        }
    };
}
exports.socketInitilizer = socketInitilizer;
