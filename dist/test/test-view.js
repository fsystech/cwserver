"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldBeError = void 0;
// 4:38 AM 5/22/2020
const expect_1 = __importDefault(require("expect"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const socket_client_1 = require("./socket-client");
const index_1 = require("../index");
const mimeHandler = new index_1.HttpMimeHandler();
function shouldBeError(next) {
    try {
        next();
    }
    catch (e) {
        return e;
    }
}
exports.shouldBeError = shouldBeError;
;
global.sow.server.on("register-view", (app, controller, server) => {
    app.use("/app-error", (req, res, next) => {
        throw new Error("Application should be fire Error event");
    });
    expect_1.default(shouldBeError(() => { index_1.socketInitilizer(server, socket_client_1.SocketErr1()); })).toBeInstanceOf(Error);
    expect_1.default(shouldBeError(() => { index_1.socketInitilizer(server, socket_client_1.SocketErr2()); })).toBeInstanceOf(Error);
    const ws = index_1.socketInitilizer(server, socket_client_1.SocketClient());
    const io = require("socket.io");
    ws.create(io);
    expect_1.default(ws.create(io)).toEqual(false);
    expect_1.default(ws.isConnectd).toEqual(true);
    controller.get('/ws-server-event', (ctx) => {
        ctx.res.json(ws.wsEvent);
        ctx.next(200);
        return void 0;
    });
});
global.sow.server.on("register-view", (app, controller, server) => {
    expect_1.default(shouldBeError(() => { mimeHandler.getMimeType("NO_EXT"); })).toBeInstanceOf(Error);
    const vDir = path.join(path.resolve(server.getRoot(), '..'), "/project_template/test/");
    server.addVirtualDir("/vtest", vDir, (ctx) => {
        if (!mimeHandler.isValidExtension(ctx.extension))
            return ctx.next(404);
        mimeHandler.getMimeType(ctx.extension);
        return mimeHandler.render(ctx, vDir, true);
    });
    expect_1.default(shouldBeError(() => {
        server.addVirtualDir("/vtest", vDir);
    })).toBeInstanceOf(Error);
    server.addVirtualDir("/test-virtual", vDir);
    server.addVirtualDir("/vtest/virtual/", vDir);
});
global.sow.server.on("register-view", (app, controller, server) => {
    const streamDir = path.join(path.resolve(server.getRoot(), '..'), "/project_template/test/");
    server.addVirtualDir("/web-stream", streamDir, (ctx) => {
        if (ctx.server.config.liveStream.indexOf(ctx.extension) > -1) {
            const absPath = path.resolve(`${streamDir}/${ctx.path}`);
            if (!index_1.Util.isExists(absPath, ctx.next))
                return;
            const mimeType = mimeHandler.getMimeType(ctx.extension);
            return index_1.Streamer.stream(ctx, absPath, mimeType, fs.statSync(absPath));
        }
        return ctx.next(404);
    });
    server.addVirtualDir("/static-file", streamDir, (ctx) => {
        return mimeHandler.render(ctx, streamDir, true);
    });
});
global.sow.server.on("register-view", (app, controller, server) => {
    const downloadDir = server.mapPath("/upload/data/");
    if (!fs.existsSync(downloadDir)) {
        index_1.Util.mkdirSync(server.mapPath("/"), "/upload/data/");
    }
    const tempDir = server.mapPath("/upload/temp/");
    controller.post('/post', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const task = typeof (ctx.req.query.task) === "string" ? ctx.req.query.task.toString() : void 0;
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        if (task && task === "ERROR") {
            try {
                yield parser.readDataAsync();
            }
            catch (e) {
                expect_1.default(e).toBeInstanceOf(Error);
            }
        }
        parser.readData((err) => {
            if (parser.isMultipart()) {
                return ctx.next(404);
            }
            const result = {};
            if (parser.isAppJson()) {
                result.isJson = true;
            }
            expect_1.default(shouldBeError(() => {
                parser.saveAs(downloadDir);
            })).toBeInstanceOf(Error);
            expect_1.default(shouldBeError(() => {
                parser.getFiles((pf) => { return; });
            })).toBeInstanceOf(Error);
            if (err && err instanceof Error) {
                ctx.res.json(index_1.Util.extend(result, { error: true, msg: err.message }));
            }
            else {
                ctx.res.json(index_1.Util.extend(result, parser.getJson()));
            }
            return ctx.next(200);
        });
    })).post('/post-async/:id', (ctx, routeParam) => __awaiter(void 0, void 0, void 0, function* () {
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        if (parser.isUrlEncoded() || parser.isAppJson()) {
            yield parser.readDataAsync();
            ctx.res.writeHead(200, { 'Content-Type': 'application/json' });
            return ctx.res.end(JSON.stringify(parser.getJson())), ctx.next(200);
        }
        parser.saveAs(downloadDir);
        return ctx.res.asHTML(200).end("<h1>success</h1>");
    })).post('/upload', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        const saveTo = typeof (ctx.req.query.saveto) === "string" ? ctx.req.query.saveto.toString() : void 0;
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        expect_1.default(shouldBeError(() => {
            parser.saveAs(downloadDir);
        })).toBeInstanceOf(Error);
        parser.readData((err) => {
            if (err) {
                if (typeof (err) === "string" && err === "CLIENET_DISCONNECTED")
                    return ctx.next(-500);
                parser.clear();
                server.addError(ctx, err instanceof Error ? err.message : err);
                return ctx.next(500);
            }
            if (!parser.isMultipart()) {
                ctx.next(404);
            }
            else {
                const data = [];
                parser.getFiles((file) => {
                    data.push({
                        content_type: file.getContentType(),
                        name: file.getName(),
                        file_name: file.getFileName(),
                        content_disposition: file.getContentDisposition(),
                        file_size: file.getFileSize(),
                        temp_path: file.getTempPath()
                    });
                    expect_1.default(file.read()).toBeInstanceOf(Buffer);
                    if (saveTo) {
                        if (saveTo === "C")
                            file.clear();
                        return;
                    }
                    file.saveAs(`${downloadDir}/${index_1.Util.guid()}_${file.getFileName()}`);
                    expect_1.default(shouldBeError(() => {
                        file.read();
                    })).toBeInstanceOf(Error);
                    expect_1.default(shouldBeError(() => {
                        file.saveAs(`${downloadDir}/${index_1.Util.guid()}_${file.getFileName()}`);
                    })).toBeInstanceOf(Error);
                });
                if (saveTo && saveTo !== "C") {
                    parser.saveAs(downloadDir);
                }
                expect_1.default(shouldBeError(() => {
                    parser.getData();
                })).toBeInstanceOf(Error);
                ctx.res.json(data.shift() || {});
                ctx.next(200);
            }
            parser.clear();
        });
    }));
});
global.sow.server.on("register-view", (app, controller, server) => {
    controller
        .any('/test-any/*', (ctx, match) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/test-any/*", q: match });
    })
        .get('/task/:id/*', (ctx, match) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/task/:id/*", q: match });
    })
        .get('/test-c/:id', (ctx, match) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/test-c/:id", q: match });
    })
        .get('/dist/*', (ctx, match) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/dist/*", q: match });
    })
        .get('/user/:id/settings', (ctx, match) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/user/:id/settings", q: match });
    });
});
global.sow.server.on("register-view", (app, controller, server) => {
    controller
        .get('/get-file', (ctx) => {
        return index_1.Util.sendResponse(ctx, server.mapPath("index.html"), "text/plain");
    })
        .any('/cookie', (ctx) => {
        ctx.res.cookie("test-1", "test", {
            domain: "localhost", path: "/",
            expires: new Date(), secure: true,
            sameSite: true
        });
        ctx.res.cookie("test-2", "test", {
            domain: "localhost", path: "/",
            expires: new Date(), secure: true,
            sameSite: 'lax'
        });
        ctx.res.cookie("test-3", "test", {
            domain: "localhost", path: "/",
            expires: new Date(), secure: true,
            sameSite: 'none'
        });
        ctx.res.json({ task: "done" });
        return void 0;
    })
        .any('/echo', (ctx) => {
        ctx.res.writeHead(200, {
            "Content-Type": ctx.req.headers["content-type"] || "text/plain"
        });
        ctx.req.pipe(ctx.res);
        return void 0;
    })
        .any('/response', (ctx) => {
        if (ctx.req.method === "GET") {
            if (ctx.req.query.task === "gzip") {
                const data = ctx.req.query.data;
                return ctx.res.json(typeof (data) === "string" ? JSON.parse(data) : data, true, (err) => {
                    ctx.server.addError(ctx, err || "");
                    ctx.next(500);
                }), void 0;
            }
        }
        return ctx.next(404);
    })
        .get('/is-authenticate', (ctx) => {
        if (!ctx.req.query.loginId)
            return ctx.next(401);
        if (ctx.session.loginId !== ctx.req.query.loginId)
            return ctx.next(401);
        ctx.res.json(ctx.session);
        return ctx.next(200);
    })
        .any('/redirect', (ctx) => {
        return ctx.redirect("/"), ctx.next(301, false);
    })
        .any('/pass-error', (ctx) => {
        server.addError(ctx, new Error('test pass-error'));
        server.addError(ctx, 'test pass-error');
        return server.passError(ctx), void 0;
    })
        .get('/authenticate', (ctx) => {
        if (!ctx.req.query.loginId) {
            if (!ctx.req.session.isAuthenticated)
                return ctx.next(401);
            return ctx.res.status(301).redirect("/"), ctx.next(301, false);
        }
        const loginID = ctx.req.query.loginId.toString();
        const result = {
            code: 200,
            data: {
                token: "",
                hash: "",
                userInfo: {
                    loginId: ""
                },
                error: false
            }
        };
        if (ctx.req.session.isAuthenticated) {
            result.data.hash = index_1.Encryption.toMd5(ctx.req.session.loginId);
            result.data.userInfo.loginId = ctx.req.session.loginId;
        }
        else {
            // server.db.query()
            // perform pgsql here with this incomming token
            result.data.token = index_1.Util.guid();
            result.data.hash = index_1.Encryption.toMd5(loginID);
            result.data.userInfo.loginId = loginID;
            result.data.error = false;
            // res, loginId, roleId, userData
            server.setSession(ctx, /*loginId*/ loginID, /*roleId*/ "Admin", /*userData*/ { token: result.data.token });
        }
        ctx.res.writeHead(result.code, { 'Content-Type': 'application/json' });
        ctx.write(JSON.stringify(result.data));
        ctx.res.end();
        ctx.next(200);
    });
});
//# sourceMappingURL=test-view.js.map