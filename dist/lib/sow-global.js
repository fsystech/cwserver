"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sow_http_mime_types_1 = require("./sow-http-mime-types");
class SowGlobalServer {
    constructor() {
        this._evt = [];
        this._isInitilized = false;
    }
    emit(ev, app, controller, server) {
        this._isInitilized = true;
        this._evt.forEach(handler => {
            return handler(app, controller, server);
        });
        this._evt.length = 0;
    }
    on(ev, next) {
        if (this._isInitilized) {
            throw new Error("After initilize view, you should not register new veiw.");
        }
        this._evt.push(next);
    }
}
class SowGlobal {
    constructor() {
        this._server = new SowGlobalServer();
        this.isInitilized = false;
        this._HttpMime = sow_http_mime_types_1.loadMimeType();
        this._templateCtx = {};
    }
    get templateCtx() {
        return this._templateCtx;
    }
    get server() {
        return this._server;
    }
    get HttpMime() {
        return this._HttpMime;
    }
}
global.sow = new SowGlobal();
//# sourceMappingURL=sow-global.js.map