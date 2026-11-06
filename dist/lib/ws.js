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
    /**
     * Invokes the registered getClient handler and returns its result when it is an object.
     *
     * @returns The object returned by the getClient handler, or undefined if the result is not an object.
     */
    getServerEvent() {
        const obj = this.event.getClient();
        if (obj instanceof Object) {
            return obj;
        }
    }
    /**
     * Registers an event handler. getClient also sets the client handler, and beforeInitiateConnection
     * sets the pre-connection hook; other names are stored as events.
     *
     * @param ev Event name, such as getClient, beforeInitiateConnection, connected or disConnected.
     * @param handler Handler function for the event.
     */
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
    /**
     * Calls the handler registered for the event, if any, passing the socket info and socket server.
     *
     * @param ev Name of the event to emit.
     * @param me Socket info of the client the event relates to.
     * @param wsServer Socket server instance passed to the handler.
     * @returns Whatever the handler returns (nothing when no handler is registered).
     */
    emit(ev, me, wsServer) {
        if (this.event[ev]) {
            return this.event[ev](me, wsServer);
        }
    }
}
/**
 * Creates a new object used to register web socket event handlers for the server.
 *
 * @returns A new web socket client info instance.
 */
function wsClient() {
    return new WsClientInfo();
}
class CwSocketServer {
    /**
     * Gets the list of currently connected socket clients.
     *
     * @returns Array of socket info objects.
     */
    get clients() {
        return this._clients;
    }
    /**
     * Creates a socket server wrapper that tracks connected clients.
     *
     * @param server The cwserver instance the socket server belongs to.
     * @param wsClientInfo Registered event handlers for socket clients.
     */
    constructor(server, wsClientInfo) {
        this.implimented = false;
        this._clients = [];
        this.connected = false;
        this._server = server;
        this._wsClients = wsClientInfo;
    }
    /**
     * Checks whether a socket with the given token is currently connected.
     *
     * @param token Socket token to look for.
     * @returns True if a client with the token exists.
     */
    isActiveSocket(token) {
        return this._clients.some(soc => soc.token === token);
    }
    /**
     * Checks whether any connected socket has the given hash.
     *
     * @param hash Hash (MD5 of the login id) to look for.
     * @returns True if at least one client has the hash.
     */
    exists(hash) {
        return this._clients.some(soc => soc.hash === hash);
    }
    /**
     * Gets the sockets flagged as owners, optionally limited to a group.
     *
     * @param group Optional group name to filter by.
     * @returns Array of matching owner socket infos.
     */
    getOwners(group) {
        return group ? this._clients.filter(soc => soc.iCwner === true && soc.group === group) : this._clients.filter(soc => soc.iCwner === true);
    }
    /**
     * Finds all connected sockets with the given hash.
     *
     * @param hash Hash to match.
     * @returns Array of matching socket infos.
     */
    findByHash(hash) {
        return this._clients.filter(soc => soc.hash === hash);
    }
    /**
     * Finds all connected sockets for the given login id.
     *
     * @param loginId Login id to match.
     * @returns Array of matching socket infos.
     */
    findByLogin(loginId) {
        return this._clients.filter(soc => soc.loginId === loginId);
    }
    /**
     * Finds all connected sockets for the given role id.
     *
     * @param roleId Role id to match.
     * @returns Array of matching socket infos.
     */
    findByRoleId(roleId) {
        return this._clients.filter(soc => soc.roleId === roleId);
    }
    /**
     * Finds connected sockets with the given token.
     *
     * @param token Socket token to match.
     * @returns Array of matching socket infos.
     */
    findByToken(token) {
        return this._clients.filter(soc => soc.token === token);
    }
    /**
     * Converts socket infos to plain objects containing only token, hash and login id.
     *
     * @param clients Socket infos to convert.
     * @returns Array of simple objects; empty when no clients are given.
     */
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
    /**
     * Gets all connected sockets except those with the given hash, optionally limited to a group.
     *
     * @param exceptHash Hash to exclude.
     * @param group Optional group name to filter by.
     * @returns Array of matching socket infos.
     */
    getClientByExceptHash(exceptHash, group) {
        return !group ? this._clients.filter(soc => soc.hash !== exceptHash) : this._clients.filter(soc => soc.hash !== exceptHash && soc.group === group);
    }
    /**
     * Gets all connected sockets except those with the given login id, optionally limited to a group.
     *
     * @param exceptLoginId Login id to exclude.
     * @param group Optional group name to filter by.
     * @returns Array of matching socket infos.
     */
    getClientByExceptLogin(exceptLoginId, group) {
        return !group ? this._clients.filter(soc => soc.loginId !== exceptLoginId) : this._clients.filter(soc => soc.loginId !== exceptLoginId && soc.group === group);
    }
    /**
     * Gets all connected sockets except the one with the given token, optionally limited to a group.
     *
     * @param token Token to exclude.
     * @param group Optional group name to filter by.
     * @returns Array of matching socket infos.
     */
    getClientByExceptToken(token, group) {
        return !group ? this._clients.filter(soc => soc.token !== token) : this._clients.filter(soc => soc.token !== token && soc.group === group);
    }
    /**
     * Looks up a connected socket by token.
     *
     * @param token Socket token to find.
     * @returns The matching socket info, or undefined if none is found.
     */
    getSocket(token) {
        return this._clients.find(soc => soc.token === token);
    }
    /**
     * Removes the socket with the given token from the tracked client list.
     *
     * @param token Token of the socket to remove.
     * @returns True if a client was removed, false if none matched.
     */
    removeSocket(token) {
        const index = this._clients.findIndex((soc) => {
            return soc.token === token;
        });
        if (index < 0)
            return false;
        this._clients.splice(index, 1);
        return true;
    }
    /**
     * Sends a message to the socket with the given token by emitting the method event on it.
     *
     * @param token Token of the target socket.
     * @param method Event name to emit on the socket.
     * @param data Optional payload sent with the event.
     * @returns True if the socket was found and the message sent, false otherwise.
     */
    sendMsg(token, method, data) {
        const soc = this.getSocket(token);
        if (!soc)
            return false;
        return soc.sendMsg(method, data), true;
    }
    /**
     * Attaches socket.io to the HTTP server once: sets up session parsing and the pre-connection hook,
     * tracks connecting clients, registers client event handlers, and emits connected and disConnected
     * events. Closes socket.io when the server shuts down.
     *
     * @param ioserver The socket.io server factory function.
     * @param httpServer HTTP server to attach socket.io to.
     * @returns True if initialized, false if it was already initialized.
     */
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
                    token: app_util_1.Util.UUID(),
                    loginId: socket.request.session.loginId,
                    hash: void 0,
                    socketId: socket.id,
                    isAuthenticated: socket.request.session.isAuthenticated,
                    iCwner: false,
                    group: void 0,
                    isReconnectd: false,
                    roleId: "_INVALID_",
                    /**
                     * Gets the underlying socket.io socket of this client.
                     *
                     * @returns The socket.io socket object.
                     */
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
        /**
         * Gets the socket server that manages connected clients.
         *
         * @returns The socket server instance.
         */
        get wsServer() {
            return _ws;
        },
        /**
         * Indicates whether the socket server has been initialized through create.
         *
         * @returns True once create has been called.
         */
        get isConnectd() {
            return _ws.implimented;
        },
        /**
         * Gets the server event object provided by the getClient handler, caching it after the first read.
         *
         * @returns The event object, or undefined when unavailable.
         */
        get wsEvent() {
            return _wsEvent ? _wsEvent : (_wsEvent = wsClientInfo.getServerEvent(), _wsEvent);
        },
        /**
         * Initializes socket.io on the given HTTP server by delegating to the socket server.
         *
         * @param ioserver The socket.io server factory function.
         * @param httpServer HTTP server to attach socket.io to.
         * @returns True if initialized, false if it was already initialized.
         */
        create(ioserver, httpServer) {
            return _ws.create(ioserver, httpServer);
        }
    };
}
//# sourceMappingURL=ws.js.map