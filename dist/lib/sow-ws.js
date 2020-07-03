"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketInitilizer = exports.wsClient = void 0;
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
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
        const obj = this.event.getClient();
        if (obj instanceof Object) {
            return obj;
        }
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
        return void 0;
    }
    emit(ev, me, wsServer) {
        if (this.event[ev]) {
            return this.event[ev](me, wsServer);
        }
    }
}
function wsClient() {
    return new WsClientInfo();
}
exports.wsClient = wsClient;
class SowSocket {
    constructor(server, wsClientInfo) {
        this.implimented = false;
        this.socket = [];
        this.connected = false;
        this._server = server;
        this._wsClients = wsClientInfo;
    }
    isActiveSocket(token) {
        return this.socket.some(soc => soc.token === token);
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
        if (sockets.length === 0)
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
        const index = this.socket.findIndex((soc) => {
            return soc.token === token;
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
    create(ioserver, httpServer) {
        if (this.implimented)
            return false;
        this.implimented = true;
        const io = ioserver(httpServer, {
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
            socket.request.session = this._server.parseSession(socket.request.headers.cookie);
            if (this._wsClients.beforeInitiateConnection(socket.request.session, socket)) {
                return next();
            }
        });
        return io.on("connect", (socket) => {
            this.connected = socket.connected;
        }).on('connection', (socket) => {
            const _me = (() => {
                const socketInfo = {
                    token: sow_util_1.Util.guid(),
                    loginId: socket.request.session.loginId,
                    hash: socket.request.session.isAuthenticated ? sow_encryption_1.Encryption.toMd5(socket.request.session.loginId) : void 0,
                    socketId: socket.id,
                    isAuthenticated: socket.request.session.isAuthenticated,
                    isOwner: false,
                    group: void 0,
                    isReconnectd: false,
                    getSocket: () => { return socket; },
                    sendMsg: (method, data) => {
                        return socket.emit(method, data), void 0;
                    },
                };
                this.socket.push(socketInfo);
                return socketInfo;
            })();
            socket.on('disconnect', (...args) => {
                if (!this.removeSocket(_me.token))
                    return;
                return this._wsClients.emit("disConnected", _me, this), void 0;
            });
            const client = this._wsClients.client(_me, socket.request.session, this, this._server);
            for (const method in client) {
                socket.on(method, client[method]);
            }
            return this._wsClients.emit("connected", _me, this), void 0;
        }), true;
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
    let _wsEvent = void 0;
    const _ws = new SowSocket(server, wsClientInfo);
    return {
        get isConnectd() {
            return _ws.implimented;
        },
        get wsEvent() {
            return _wsEvent ? _wsEvent : (_wsEvent = wsClientInfo.getServerEvent(), _wsEvent);
        },
        create(ioserver, httpServer) {
            return _ws.create(ioserver, httpServer);
        }
    };
}
exports.socketInitilizer = socketInitilizer;
//# sourceMappingURL=sow-ws.js.map