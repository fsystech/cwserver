"use strict";
// Copyright (c) 2022 FSys Tech Ltd.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsClient = wsClient;
exports.socketInitilizer = socketInitilizer;
// 9:19 PM 5/8/2020
// by rajib chy
const encryption_1 = require("./encryption");
const app_util_1 = require("./app-util");
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
class CwSocketServer {
    get clients() {
        return this._clients;
    }
    constructor(server, wsClientInfo) {
        this.implimented = false;
        this._clients = [];
        this.connected = false;
        this._server = server;
        this._wsClients = wsClientInfo;
    }
    isActiveSocket(token) {
        return this._clients.some(soc => soc.token === token);
    }
    exists(hash) {
        return this._clients.some(soc => soc.hash === hash);
    }
    getOwners(group) {
        return group ? this._clients.filter(soc => soc.iCwner === true && soc.group === group) : this._clients.filter(soc => soc.iCwner === true);
    }
    findByHash(hash) {
        return this._clients.filter(soc => soc.hash === hash);
    }
    findByLogin(loginId) {
        return this._clients.filter(soc => soc.loginId === loginId);
    }
    findByRoleId(roleId) {
        return this._clients.filter(soc => soc.roleId === roleId);
    }
    findByToken(token) {
        return this._clients.filter(soc => soc.token === token);
    }
    toList(clients) {
        const list = [];
        if (clients.length === 0) {
            return list;
        }
        clients.forEach((a) => {
            list.push({
                token: a.token, hash: a.hash, loginId: a.loginId
            });
        });
        return list;
    }
    getClientByExceptHash(exceptHash, group) {
        return !group ? this._clients.filter(soc => soc.hash !== exceptHash) : this._clients.filter(soc => soc.hash !== exceptHash && soc.group === group);
    }
    getClientByExceptLogin(exceptLoginId, group) {
        return !group ? this._clients.filter(soc => soc.loginId !== exceptLoginId) : this._clients.filter(soc => soc.loginId !== exceptLoginId && soc.group === group);
    }
    getClientByExceptToken(token, group) {
        return !group ? this._clients.filter(soc => soc.token !== token) : this._clients.filter(soc => soc.token !== token && soc.group === group);
    }
    getSocket(token) {
        return this._clients.find(soc => soc.token === token);
    }
    removeSocket(token) {
        const index = this._clients.findIndex((soc) => {
            return soc.token === token;
        });
        if (index < 0)
            return false;
        this._clients.splice(index, 1);
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
            socket.request.session = this._server.parseSession(socket.request.headers, socket.request.headers.cookie);
            if (this._wsClients.beforeInitiateConnection(socket.request.session, socket)) {
                return next();
            }
        });
        return io.on("connect", (socket) => {
            this.connected = socket.connected;
        }).on('connection', (socket) => {
            const _me = (() => {
                const socketInfo = {
                    token: app_util_1.Util.guid(),
                    loginId: socket.request.session.loginId,
                    hash: void 0,
                    socketId: socket.id,
                    isAuthenticated: socket.request.session.isAuthenticated,
                    iCwner: false,
                    group: void 0,
                    isReconnectd: false,
                    roleId: "_INVALID_",
                    get socket() { return socket; },
                    sendMsg: (method, data) => {
                        return socket.emit(method, data), void 0;
                    },
                };
                if (socket.request.session.isAuthenticated) {
                    socketInfo.hash = encryption_1.Encryption.toMd5(socket.request.session.loginId);
                    socketInfo.roleId = socket.request.session.roleId;
                }
                this._clients.push(socketInfo);
                return socketInfo;
            })();
            socket.on('disconnect', (...args) => {
                /*if ( this.removeSocket( _me.token ) ) {
                    this._wsClients.emit( "disConnected", _me, this );
                }*/
                this.removeSocket(_me.token);
                this._wsClients.emit("disConnected", _me, this);
                return void 0;
            });
            const client = this._wsClients.client(_me, socket.request.session, this, this._server);
            for (const method in client) {
                socket.on(method, client[method]);
            }
            return this._wsClients.emit("connected", _me, this), void 0;
        }), true;
    }
}
/**
 * If you want to use it you've to install socket.io
 * const ws = socketInitilizer( server, SocketClient() );
 * ws.create( require( "socket.io" ), app.httpServer );
 */
function socketInitilizer(server, wsClientInfo) {
    if (typeof (wsClientInfo.client) !== "function") {
        throw new Error("`getClient` event did not registered...");
    }
    if (typeof (wsClientInfo.beforeInitiateConnection) !== "function") {
        throw new Error("`beforeInitiateConnection` event did not registered...");
    }
    let _wsEvent = void 0;
    const _ws = new CwSocketServer(server, wsClientInfo);
    return {
        get wsServer() {
            return _ws;
        },
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
//# sourceMappingURL=ws.js.map