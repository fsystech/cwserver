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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
const fsw = __importStar(require("../lib/sow-fsw"));
const sow_server_core_1 = require("../lib/sow-server-core");
const sow_server_1 = require("../lib/sow-server");
const sow_http_cache_1 = require("../lib/sow-http-cache");
const socket_client_1 = require("./socket-client");
const index_1 = require("../index");
const sow_util_1 = require("../lib/sow-util");
const mimeHandler = new index_1.HttpMimeHandler();
function shouldBeError(next, printerr) {
    try {
        next();
    }
    catch (e) {
        if (printerr === true)
            console.log(e);
        return e;
    }
}
exports.shouldBeError = shouldBeError;
;
global.sow.server.on("register-view", (app, controller, server) => {
    expect_1.default(sow_server_core_1.parseCookie(["test"])).toBeInstanceOf(Object);
    expect_1.default(sow_server_core_1.parseCookie({})).toBeInstanceOf(Object);
    app.use("/app-error", (req, res, next) => {
        expect_1.default(req.session).toBeInstanceOf(Object);
        expect_1.default(sow_server_core_1.getClientIpFromHeader(req.headers)).toBeUndefined();
        throw new Error("Application should be fire Error event");
    }).prerequisites((req, res, next) => {
        expect_1.default(req.session).toBeInstanceOf(Object);
        return next();
    });
    expect_1.default(shouldBeError(() => { index_1.socketInitilizer(server, socket_client_1.SocketErr1()); })).toBeInstanceOf(Error);
    expect_1.default(shouldBeError(() => { index_1.socketInitilizer(server, socket_client_1.SocketErr2()); })).toBeInstanceOf(Error);
    const ws = index_1.socketInitilizer(server, socket_client_1.SocketClient());
    const io = require("socket.io");
    ws.create(io);
    expect_1.default(ws.create(io)).toEqual(false);
    expect_1.default(ws.isConnectd).toEqual(true);
    controller.get('/ws-server-event', (ctx, requestParam) => {
        const event = ws.wsEvent;
        expect_1.default(event).toBeInstanceOf(Object);
        ctx.res.json(ws.wsEvent || {});
        ctx.next(200);
        return void 0;
    });
    controller.any("/test-head", (ctx, requestParam) => {
        return ctx.res.status(200).send();
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
    server.addVirtualDir("/vtest/virtual", vDir);
    expect_1.default(shouldBeError(() => {
        app.use("/:error", (req, res, next, requestParam) => {
            //
        });
    })).toBeInstanceOf(Error);
});
global.sow.server.on("register-view", (app, controller, server) => {
    const streamDir = path.join(path.resolve(server.getRoot(), '..'), "/project_template/test/");
    server.addVirtualDir("/web-stream", streamDir, (ctx, requestParam) => {
        if (ctx.server.config.liveStream.indexOf(ctx.extension) > -1) {
            const absPath = path.resolve(`${streamDir}/${ctx.path}`);
            if (!sow_util_1.Util.isExists(absPath, ctx.next))
                return;
            const mimeType = mimeHandler.getMimeType(ctx.extension);
            return index_1.Streamer.stream(ctx, absPath, mimeType, fs.statSync(absPath));
        }
        return ctx.next(404);
    });
    server.addVirtualDir("/static-file", streamDir, (ctx, requestParam) => {
        return mimeHandler.render(ctx, streamDir, true);
    });
    expect_1.default(shouldBeError(() => {
        server.addVirtualDir("/static-file/*", streamDir);
    })).toBeInstanceOf(Error);
    expect_1.default(shouldBeError(() => {
        server.addVirtualDir("/:static-file", streamDir);
    })).toBeInstanceOf(Error);
});
global.sow.server.on("register-view", (app, controller, server) => {
    const downloadDir = server.mapPath("/upload/data/");
    if (!fs.existsSync(downloadDir)) {
        fsw.mkdirSync(server.mapPath("/"), "/upload/data/");
    }
    const tempDir = server.mapPath("/upload/temp/");
    fsw.mkdirSync(tempDir);
    controller.post('/post', (ctx, requestParam) => __awaiter(void 0, void 0, void 0, function* () {
        const task = typeof (ctx.req.query.task) === "string" ? ctx.req.query.task.toString() : void 0;
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        if (parser.isMultipart()) {
            return ctx.next(404);
        }
        if (task && task === "ERROR") {
            try {
                yield parser.readDataAsync();
            }
            catch (e) {
                expect_1.default(e).toBeInstanceOf(Error);
            }
        }
        parser.readData((err) => {
            const result = {};
            if (parser.isAppJson()) {
                result.isJson = true;
            }
            expect_1.default(shouldBeError(() => {
                parser.saveAsSync(downloadDir);
            })).toBeInstanceOf(Error);
            expect_1.default(shouldBeError(() => {
                parser.getFiles((pf) => { return; });
            })).toBeInstanceOf(Error);
            expect_1.default(shouldBeError(() => {
                parser.getUploadFileInfo();
            })).toBeInstanceOf(Error);
            if (err && err instanceof Error) {
                ctx.res.json(sow_util_1.Util.extend(result, { error: true, msg: err.message }));
            }
            else {
                ctx.res.json(sow_util_1.Util.extend(result, parser.getJson()));
            }
            return ctx.next(200);
        });
    })).post('/post-async/:id', (ctx, requestParam) => __awaiter(void 0, void 0, void 0, function* () {
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        if (parser.isUrlEncoded() || parser.isAppJson()) {
            yield parser.readDataAsync();
            ctx.res.writeHead(200, { 'Content-Type': 'application/json' });
            return ctx.res.end(JSON.stringify(parser.getJson())), ctx.next(200);
        }
        parser.saveAsSync(downloadDir);
        parser.clear();
        return ctx.res.asHTML(200).end("<h1>success</h1>");
    })).post('/upload-invalid-file', (ctx, requestParam) => __awaiter(void 0, void 0, void 0, function* () {
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        let err;
        try {
            yield parser.readDataAsync();
        }
        catch (e) {
            err = e;
        }
        parser.clear();
        if (err) {
            if (err.message.indexOf("Invalid file header") > -1)
                return ctx.next(500);
        }
        console.log(err);
        throw new Error("Should not here...");
    })).post('/abort-error', (ctx, requestParam) => __awaiter(void 0, void 0, void 0, function* () {
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        let err;
        try {
            yield parser.readDataAsync();
        }
        catch (e) {
            err = e;
        }
        parser.clear();
        if (err) {
            if (err.message.indexOf("CLIENET_DISCONNECTED") > -1)
                return ctx.next(-500);
        }
        throw new Error("Should not here...");
    })).post('/upload-malformed-data', (ctx, requestParam) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.req.push("This is normal line\n".repeat(5));
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        let err;
        try {
            yield parser.readDataAsync();
        }
        catch (e) {
            err = e;
        }
        parser.clear();
        if (err) {
            server.addError(ctx, err);
            return server.transferRequest(ctx, 500);
        }
        throw new Error("Should not here...");
    })).post('/upload-test', (ctx, requestParam) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const parser = new index_1.PayloadParser(ctx.req, tempDir);
            expect_1.default(shouldBeError(() => {
                parser.getFiles((pf) => {
                    console.log(pf);
                });
            })).toBeInstanceOf(Error);
            expect_1.default(shouldBeError(() => {
                parser.getUploadFileInfo();
            })).toBeInstanceOf(Error);
            expect_1.default(shouldBeError(() => {
                parser.getData();
            })).toBeInstanceOf(Error);
            yield parser.readDataAsync();
            const data = parser.getUploadFileInfo();
            parser.saveAsSync(downloadDir);
            parser.clear();
            ctx.res.json(data.shift() || {});
            ctx.next(200);
        }
        catch (e) {
            throw e;
        }
    })).post('/upload-non-bolock', (ctx, requestParam) => {
        if (ctx.res.isAlive) {
            expect_1.default(ctx.req.get("content-type")).toBeDefined();
            const parser = new index_1.PayloadParser(ctx.req, tempDir);
            return parser.readData((err) => {
                sow_util_1.assert(err === undefined, "parser.readData");
                const data = parser.getUploadFileInfo();
                return parser.getFiles((file, done) => {
                    if (!file || !done)
                        return ctx.res.status(200).send(data.shift() || {});
                    return file.read((rerr, buff) => {
                        sow_util_1.assert(rerr === null, "file.read");
                        expect_1.default(buff).toBeInstanceOf(Buffer);
                        return parser.saveAs(downloadDir, (serr) => {
                            sow_util_1.assert(serr === null, "file.saveAs");
                            expect_1.default(shouldBeError(() => {
                                ctx.res.status(0).send("Nothing....");
                            })).toBeInstanceOf(Error);
                            ctx.res.status(200).send(data.shift() || {});
                            expect_1.default(shouldBeError(() => {
                                ctx.res.send("Nothing....");
                            })).toBeInstanceOf(Error);
                        }, ctx.handleError.bind(ctx));
                    });
                });
            });
        }
    }).post('/upload', (ctx, requestParam) => __awaiter(void 0, void 0, void 0, function* () {
        const saveTo = typeof (ctx.req.query.saveto) === "string" ? ctx.req.query.saveto.toString() : void 0;
        const parser = new index_1.PayloadParser(ctx.req, tempDir);
        expect_1.default(shouldBeError(() => {
            parser.saveAsSync(downloadDir);
        })).toBeInstanceOf(Error);
        parser.readData((err) => {
            sow_util_1.assert(err === undefined, "parser.readData");
            if (!parser.isMultipart()) {
                ctx.next(404);
            }
            else {
                const data = parser.getUploadFileInfo();
                parser.getFilesSync((file) => {
                    expect_1.default(file.readSync()).toBeInstanceOf(Buffer);
                    if (saveTo) {
                        if (saveTo === "C")
                            file.clear();
                        return;
                    }
                    file.saveAsSync(`${downloadDir}/${sow_util_1.Util.guid()}_${file.getFileName()}`);
                    expect_1.default(shouldBeError(() => {
                        file.readSync();
                    })).toBeInstanceOf(Error);
                    expect_1.default(shouldBeError(() => {
                        file.saveAsSync(`${downloadDir}/${sow_util_1.Util.guid()}_${file.getFileName()}`);
                    })).toBeInstanceOf(Error);
                });
                if (saveTo && saveTo !== "C") {
                    expect_1.default(shouldBeError(() => {
                        parser.saveAsSync(server.mapPath("/upload/data/schema.json"));
                    })).toBeInstanceOf(Error);
                    parser.saveAsSync(downloadDir);
                }
                expect_1.default(shouldBeError(() => {
                    parser.getData();
                })).toBeInstanceOf(Error);
                ctx.res.json(data.shift() || {});
                ctx.next(200);
            }
            parser.clear();
            expect_1.default(parser.clear()).not.toBeInstanceOf(Error);
        });
    }));
});
global.sow.server.on("register-view", (app, controller, server) => {
    controller
        .get("/test-context", (ctx, requestParam) => {
        try {
            const nctx = server.createContext(ctx.req, ctx.res, ctx.next);
            nctx.path = "/not-found/404/";
            nctx.req.path = "/not-found/404/";
            nctx.next = (code, transfer) => {
                // Nothing to do....!
                expect_1.default(code).toEqual(404);
            };
            const oldDoc = server.config.defaultDoc;
            server.config.defaultDoc = [];
            controller.processAny(nctx);
            server.config.defaultDoc = oldDoc;
            nctx.path = "";
            nctx.req.path = "";
            controller.processAny(nctx);
            const oldext = server.config.defaultExt;
            server.config.defaultExt = "";
            server.config.defaultDoc = [];
            controller.processAny(nctx);
            nctx.path = "/not-found/";
            nctx.req.path = "/not-found/";
            controller.processAny(nctx);
            server.config.defaultExt = oldext;
            server.config.defaultDoc = oldDoc;
            nctx.path = "/not-found/index";
            nctx.req.path = "/not-found/index";
            controller.processAny(nctx);
            const oldEncoding = ctx.req.headers['accept-encoding'];
            ctx.req.headers['accept-encoding'] = void 0;
            expect_1.default(sow_http_cache_1.SowHttpCache.isAcceptedEncoding(ctx.req.headers, "NOTHING")).toBeFalsy();
            ctx.req.headers['accept-encoding'] = oldEncoding;
            const treq = ctx.transferRequest;
            ctx.transferRequest = (toPath) => {
                if (typeof (toPath) === "string")
                    expect_1.default(toPath.indexOf("404")).toBeGreaterThan(-1);
                else
                    expect_1.default(toPath).toEqual(404);
            };
            mimeHandler.render(ctx);
            expect_1.default(mimeHandler.isValidExtension(ctx.extension)).toBeFalsy();
            ctx.transferRequest = treq;
            (() => {
                const oldEnd = ctx.res.end;
                ctx.res.end = (...arg) => {
                    expect_1.default(arg.length).toBeGreaterThanOrEqual(0);
                };
                ctx.res.status(204).send();
                expect_1.default(shouldBeError(() => {
                    ctx.res.status(200).send();
                })).toBeInstanceOf(Error);
                ctx.res.status(200).send("Nothing to do...");
                ctx.res.setHeader('Content-Type', "");
                ctx.res.send(true);
                ctx.res.setHeader('Content-Type', "");
                ctx.res.send(1000);
                ctx.res.setHeader('Content-Type', "");
                ctx.res.send(Buffer.from("Nothing to do...."));
                ctx.res.end = oldEnd;
            })();
            (() => {
                const parser = new index_1.PayloadParser(ctx.req, server.mapPath("/upload/temp/"));
                expect_1.default(shouldBeError(() => {
                    parser.getData();
                })).toBeInstanceOf(Error);
                parser.clear();
            })();
            process.env.TASK_TYPE = 'TESTX';
            ctx.req.cleanSocket = true;
            ctx.res.cleanSocket = true;
            ctx.res.json({
                done: true
            });
        }
        catch (e) {
            console.log(e);
            ctx.res.json({
                done: true
            });
        }
    })
        .get('/controller-error', (ctx, requestParam) => {
        throw new Error("runtime-error");
    })
        .any('/test-any/*', (ctx, requestParam) => {
        expect_1.default(server.passError(ctx)).toBeFalsy();
        ctx.res.json({ reqPath: ctx.path, servedFrom: "/test-any/*", q: requestParam });
        server.addError(ctx, new Error("__INVALID___"));
        expect_1.default(server.passError(ctx)).toBeFalsy();
        sow_server_1.disposeContext(ctx);
        sow_server_1.disposeContext(ctx);
        sow_server_1.removeContext("12");
        sow_server_1.getMyContext("12");
    })
        .get('/task/:id/*', (ctx, requestParam) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/task/:id/*", q: requestParam });
    })
        .get('/test-c/:id', (ctx, requestParam) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/test-c/:id", q: requestParam });
    })
        .get('/dist/*', (ctx, requestParam) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/dist/*", q: requestParam });
    })
        .get('/user/:id/settings', (ctx, requestParam) => {
        return ctx.res.json({ reqPath: ctx.path, servedFrom: "/user/:id/settings", q: requestParam });
    })
        .get('/404', (ctx, requestParam) => {
        return sow_util_1.Util.sendResponse(ctx, "/invalid/not-found/no.html");
    });
});
global.sow.server.on("register-view", (app, controller, server) => {
    controller
        .get('/get-file', (ctx, requestParam) => {
        return sow_util_1.Util.sendResponse(ctx, server.mapPath("index.html"), "text/plain");
    })
        .any('/cookie', (ctx, requestParam) => {
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
        expect_1.default(ctx.req.cookies).toBeInstanceOf(Object);
        expect_1.default(ctx.req.ip).toBeDefined();
        expect_1.default(ctx.req.ip).toBeDefined();
        expect_1.default(ctx.res.get('Set-Cookie')).toBeDefined();
        expect_1.default(ctx.req.get('cookie')).toBeDefined();
        expect_1.default(ctx.res.get('server')).toEqual("SOW Frontend");
        expect_1.default(ctx.res.isAlive).toBeTruthy();
        server.setDefaultProtectionHeader(ctx.res);
        expect_1.default(shouldBeError(() => {
            server.transferRequest(ctx, 200);
        })).toBeInstanceOf(Error);
        ctx.res.json({ task: "done" });
        return void 0;
    })
        .any('/echo', (ctx, requestParam) => {
        ctx.res.writeHead(200, {
            "Content-Type": ctx.req.headers["content-type"] || "text/plain"
        });
        ctx.req.pipe(ctx.res);
        return void 0;
    })
        .any('/response', (ctx, requestParam) => {
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
        .get('/is-authenticate', (ctx, requestParam) => {
        if (!ctx.req.query.loginId)
            return ctx.next(401);
        if (ctx.session.loginId !== ctx.req.query.loginId)
            return ctx.next(401);
        ctx.res.json(ctx.session);
        return ctx.next(200);
    })
        .any('/redirect', (ctx, requestParam) => {
        return ctx.redirect("/"), ctx.next(301, false);
    })
        .any('/pass-error', (ctx, requestParam) => {
        server.addError(ctx, new Error('test pass-error'));
        server.addError(ctx, 'test pass-error');
        return server.passError(ctx), void 0;
    })
        .get('/authenticate', (ctx, requestParam) => {
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
            result.data.token = sow_util_1.Util.guid();
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