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
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 4:38 AM 5/22/2020
require("mocha");
const expect_1 = __importDefault(require("expect"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const request = __importStar(require("superagent"));
const io = __importStar(require("socket.io-client"));
const fsw = __importStar(require("../lib/sow-fsw"));
const sow_http_status_1 = require("../lib/sow-http-status");
const cwserver = __importStar(require("../index"));
const sow_static_1 = require("../lib/sow-static");
const sow_server_1 = require("../lib/sow-server");
const sow_router_1 = require("../lib/sow-router");
const sow_util_1 = require("../lib/sow-util");
const sow_schema_validator_1 = require("../lib/sow-schema-validator");
const sow_template_1 = require("../lib/sow-template");
const test_view_1 = require("./test-view");
const sow_logger_1 = require("../lib/sow-logger");
let app;
const appRoot = process.env.SCRIPT === "TS" ? path.join(path.resolve(__dirname, '..'), "/dist/test/") : __dirname;
const projectRoot = 'test_web';
const logDir = path.resolve('./log/');
let authCookies = "";
const agent = request.agent();
let appIsLestening = false;
let appUtility;
const createRequest = (method, url, ensure) => {
    expect_1.default(appIsLestening).toEqual(true);
    const client = method === "GET" ? agent.get(url) : agent.post(url);
    if (!ensure)
        return client;
    const key = ensure;
    const end = client.end.bind(client);
    client.end = function (callback) {
        expect_1.default(this.get(key).length).toBeGreaterThan(0);
        end(callback);
    };
    return client;
};
const getAgent = () => {
    expect_1.default(appIsLestening).toEqual(true);
    return agent;
};
const shutdownApp = (done) => {
    try {
        app.shutdown((err) => {
            if (!done)
                return;
            return done();
        });
    }
    catch (e) {
        if (!done)
            return;
        return done(e);
    }
};
describe("cwserver-default-project-template", () => {
    it("create project template", function (done) {
        this.timeout(5000);
        cwserver.createProjectTemplate({
            appRoot,
            projectRoot,
            allExample: false,
            force: true,
            isTest: true // add test view
        });
        done();
    });
});
function handleError(err, next) {
    sow_util_1.Util.throwIfError(err);
    return next();
}
describe("cwserver-core", () => {
    it("initilize server throw error (mismatch between given appRoot and config.hostInfo.root)", (done) => {
        const root = path.resolve(`${appRoot}/ewww`); // path.resolve( appRoot, "/ewww" );
        fsw.mkdir(appRoot, "/ewww/config", (err) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(fs.existsSync(root)).toEqual(true);
            const filePath = path.resolve(root + "/config/app.config.json");
            const fromFile = path.resolve(`${appRoot}/${projectRoot}/config/app.config.json`);
            expect_1.default(fs.existsSync(fromFile)).toEqual(true);
            fs.copyFileSync(fromFile, filePath);
            expect_1.default(test_view_1.shouldBeError(() => {
                cwserver.initilizeServer(appRoot, `ewww`);
            })).toBeInstanceOf(Error);
            done();
        }, handleError);
    });
    it("initilize server throw error (invalid app.config.json)", function (done) {
        this.timeout(5000);
        const root = path.resolve(`${appRoot}/ewww`);
        // Util.mkdirSync( appRoot, "/ewww/config" );
        // expect( fs.existsSync( root ) ).toEqual( true );
        const filePath = path.resolve(root + "/config/app.config.json");
        fs.writeFile(filePath, "INVALID_FILE", (err) => {
            const orginalCfg = path.resolve(`${appRoot}/${projectRoot}/config/app.config.json`);
            setTimeout(() => {
                fsw.compairFileSync(filePath, orginalCfg);
                fsw.compairFileSync(filePath, filePath);
                expect_1.default(test_view_1.shouldBeError(() => {
                    cwserver.initilizeServer(appRoot, `ewww`);
                })).toBeInstanceOf(Error);
                fsw.rmdir(path.join(root, "nobody"), (nerr) => {
                    expect_1.default(nerr).toBeNull();
                    done();
                }, handleError);
            }, 300);
        });
    });
    it("initilize server throw error (projectRoot not provided)", (done) => {
        expect_1.default(test_view_1.shouldBeError(() => {
            cwserver.initilizeServer(appRoot);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server throw error (projectRoot not provided)", (done) => {
        expect_1.default(test_view_1.shouldBeError(() => {
            cwserver.initilizeServer(appRoot);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server throw error (projectRoot not provided while you using IISNODE)", (done) => {
        process.env.IISNODE_VERSION = "iisnode";
        expect_1.default(test_view_1.shouldBeError(() => {
            cwserver.initilizeServer(appRoot);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server throw error (projectRoot not found)", (done) => {
        expect_1.default(test_view_1.shouldBeError(() => {
            cwserver.initilizeServer(appRoot, `${projectRoot}_not_found`);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server throw error (app.config.json not found)", (done) => {
        expect_1.default(test_view_1.shouldBeError(() => {
            cwserver.initilizeServer(appRoot, `/`);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server", (done) => {
        if (fs.existsSync(logDir)) {
            fsw.rmdirSync(logDir);
        }
        appUtility = cwserver.initilizeServer(appRoot, projectRoot);
        expect_1.default(appUtility.public).toEqual(projectRoot);
        console.log(`\t\t\tcwserver ${appUtility.server.version}`);
        done();
    });
    it("initilize server throw error (Server instance can initilize 1 time)", (done) => {
        expect_1.default(test_view_1.shouldBeError(() => {
            cwserver.initilizeServer(appRoot, projectRoot);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize application", function (done) {
        this.timeout(5000);
        app = appUtility.init();
        done();
    });
    it("application listen", (done) => {
        app.listen(appUtility.port, () => {
            appUtility.log.write(`
    [+] Maintance      : https://www.safeonline.world
    [+] Server         : http://localhost:${appUtility.port}
    [+] Socket         : ws://localhost:${appUtility.port}${appUtility.socketPath}
    [~] Running appUtility...
            `, cwserver.ConsoleColor.FgMagenta);
            shutdownApp(done);
        });
    });
    it("throw application already shutdown", (done) => {
        app.shutdown((err) => {
            expect_1.default(err).toBeInstanceOf(Error);
            done();
        });
    });
    it("throw application already listen", (done) => {
        app.listen(appUtility.port, () => {
            expect_1.default(test_view_1.shouldBeError(() => {
                app.listen(appUtility.port);
            })).toBeInstanceOf(Error);
            // await app.shutdown();
            appIsLestening = true;
            done();
        });
    });
});
describe("cwserver-router", () => {
    it("router validation", (done) => {
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_router_1.getRouteMatcher("/nobody/");
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_router_1.getRouteMatcher("/*/nobody/*");
        })).toBeInstanceOf(Error);
        expect_1.default(sow_router_1.getRouteMatcher("/nobody/*").repRegExp).toBeUndefined();
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_router_1.getRouteMatcher("/nobody/*/:id");
        })).toBeInstanceOf(Error);
        const router = [];
        expect_1.default(sow_router_1.getRouteInfo("", router, "ANY")).toBeUndefined();
        router.push({
            method: "GET",
            handler: "",
            route: "/test/*",
            pathArray: "/test/*".split("/"),
            routeMatcher: sow_router_1.getRouteMatcher("/test/*")
        });
        expect_1.default(sow_router_1.getRouteInfo("", router, "ANY")).toBeUndefined();
        router.push({
            method: "GET",
            handler: "",
            route: "/vertual/*",
            pathArray: [],
            routeMatcher: void 0
        });
        expect_1.default(sow_router_1.getRouteInfo("/vertual/test/body", router, "GET")).toBeUndefined();
        router.length = 0;
        router.push({
            method: "GET",
            handler: "",
            route: "/test/:id/zoo/ticket/*",
            pathArray: "/test/:id/zoo/ticket/*".split("/"),
            routeMatcher: sow_router_1.getRouteMatcher("/test/:id/zoo/ticket/*")
        });
        expect_1.default(sow_router_1.getRouteInfo("/test/1/zoo/ticket/nothing/todo", router, "GET")).toBeDefined();
        expect_1.default(sow_router_1.pathToArray("/vertual/test/body", [])).not.toBeInstanceOf(Error);
        expect_1.default(sow_router_1.pathToArray("dfa/", [])).not.toBeInstanceOf(Error);
        done();
    });
    it("test head", (done) => {
        getAgent()
            .head(`http://localhost:${appUtility.port}/test-head`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            done();
        });
    });
});
describe("cwserver-view", () => {
    it('register view', (done) => {
        const invoke = (ctx) => {
            ctx.res.writeHead(200, {
                "Content-Type": "text/plain"
            });
            ctx.res.end("Hello test-controller");
            return ctx.next(200);
        };
        appUtility.controller.get("/test-controller", invoke)
            .post("/test-controller", invoke)
            .any("/any-controller", invoke);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.get("/test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.post("/test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.post("/any-controller", invoke);
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.any("/test-controller", invoke);
        })).toBeInstanceOf(Error);
        appUtility.controller.get("/get-test-controller", invoke)
            .post("/post-test-controller", invoke);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.get("/get-test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.post("/post-test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.any("/get-test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.any("/post-test-controller", invoke);
        })).toBeInstanceOf(Error);
        appUtility.controller.any("/any-test-controller", invoke);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.any("/any-test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.get("/any-test-controller", invoke);
        })).toBeInstanceOf(Error);
        done();
    });
    it('should throw error (After initilize view, you should not register new veiw)', (done) => {
        expect_1.default(test_view_1.shouldBeError(() => {
            // tslint:disable-next-line: no-empty
            global.sow.server.on("register-view", (_app, controller, server) => { });
        })).toBeInstanceOf(Error);
        done();
    });
});
describe("cwserver-session", () => {
    const loginId = "rajib";
    it('authenticate-request', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/authenticate`)
            .query({ loginId })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.header["set-cookie"]).toBeDefined();
            expect_1.default(res.body).toBeInstanceOf(Object);
            expect_1.default(res.body.userInfo).toBeInstanceOf(Object);
            expect_1.default(res.body.userInfo.loginId).toEqual(loginId);
            expect_1.default(res.body.hash).toEqual(cwserver.Encryption.toMd5(loginId));
            authCookies = res.header["set-cookie"];
            expect_1.default(authCookies).toBeInstanceOf(Array);
            done();
        });
    });
    it('should-be-user-authenticated', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/is-authenticate`)
            .query({ loginId })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body).toBeInstanceOf(Object);
            expect_1.default(res.body.loginId).toEqual(loginId);
            expect_1.default(res.body.userData).toBeDefined();
            done();
        });
    });
    it('authenticated-user-should-be-redirect-to-home', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/authenticate`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.redirects.length).toEqual(1); // should be redirect home page
            expect_1.default(res.redirects.indexOf(`http://localhost:${appUtility.port}/`)).toBeGreaterThan(-1);
            done();
        });
    });
});
describe("cwserver-get", () => {
    it('send get request to application', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            done();
        });
    });
    it('test applicaton cookie', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/cookie`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            const cook = res.get("Set-Cookie");
            expect_1.default(cook.length).toEqual(3);
            done();
        });
    });
    it('try to access config.hiddenDirectory', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/lib/`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('try to access $root', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/$root/`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('get-raw-file', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/get-file`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            done();
        });
    });
    it('redirect request to controller', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/redirect`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.redirects.length).toEqual(1); // should be redirect home page
            expect_1.default(res.redirects.indexOf(`http://localhost:${appUtility.port}/`)).toBeGreaterThan(-1);
            done();
        });
    });
    it('test route target /test-any/*', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-any/param/go`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body).toBeInstanceOf(Object);
            expect_1.default(res.body.servedFrom).toEqual('/test-any/*');
            expect_1.default(res.body.q.query).toBeInstanceOf(Object);
            expect_1.default(res.body.q.match).toBeInstanceOf(Array);
            expect_1.default(res.body.q.match.indexOf("param")).toBeGreaterThan(-1);
            done();
        });
    });
    it('test context', function (done) {
        this.timeout(5000);
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-context`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body).toBeInstanceOf(Object);
            expect_1.default(res.body.done).toBeTruthy();
            done();
        });
    });
    it('test route target /task/:id/*', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/task/1/test_request/next`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body).toBeInstanceOf(Object);
            expect_1.default(res.body.servedFrom).toEqual('/task/:id/*');
            expect_1.default(res.body.q.query).toBeInstanceOf(Object);
            expect_1.default(res.body.q.query.id).toEqual("1");
            expect_1.default(res.body.q.match).toBeInstanceOf(Array);
            expect_1.default(res.body.q.match.indexOf("test_request")).toBeGreaterThan(-1);
            done();
        });
    });
    it('test route target /dist/*', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/dist/`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body).toBeInstanceOf(Object);
            expect_1.default(res.body.servedFrom).toEqual('/dist/*');
            done();
        });
    });
    it('test route target /user/:id/settings', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/user/10/settings/100`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('should be 404 route target /test-c/:id', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-c/10/df/a`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('should be 404 target route /test-c/:id not match', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-c/`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('target route /*', (done) => {
        const route = "/*";
        appUtility.controller.any(route, (ctx, routeParam) => {
            return ctx.res.json({ reqPath: ctx.path, servedFrom: "/*", q: routeParam });
        });
        appUtility.controller.sort();
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-c/zxy`)
            .end((err, res) => {
            expect_1.default(appUtility.controller.remove(route)).toEqual(true);
            expect_1.default(appUtility.controller.remove("/_NOP_/")).toEqual(false);
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.body.servedFrom).toEqual('/*');
            done();
        });
    });
});
describe("cwserver-template-engine", () => {
    it('should served from server mem cache', (done) => {
        const old = sow_util_1.Util.clone(appUtility.server.config.template);
        appUtility.server.config.template.cacheType = "MEM";
        appUtility.server.config.template.cache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
            sow_util_1.Util.extend(appUtility.server.config.template, old);
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            done();
        });
    });
    it('should served from server non-template and no cache', (done) => {
        const old = sow_util_1.Util.clone(appUtility.server.config.template);
        appUtility.server.config.template.cacheType = "MEM";
        appUtility.server.config.template.cache = false;
        const filePath = appUtility.server.mapPath("/no_template.html");
        expect_1.default(fs.existsSync(filePath)).toEqual(false);
        fs.writeFileSync(filePath, "<h1>Hello World</h1>");
        expect_1.default(fs.existsSync(filePath)).toEqual(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/no_template`)
            .end((err, res) => {
            sow_util_1.Util.extend(appUtility.server.config.template, old);
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("text/html; charset=UTF-8");
            done();
        });
    });
    it('should throw template runtime error', (done) => {
        const filePath = appUtility.server.mapPath("/test.html");
        expect_1.default(fs.existsSync(filePath)).toEqual(false);
        fs.writeFileSync(filePath, "{% ctx.server.transferRequest(); %}");
        expect_1.default(fs.existsSync(filePath)).toEqual(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/test`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(500);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            fs.unlinkSync(filePath);
            done();
        });
    });
    it('should template response as gzip', (done) => {
        const filePath = appUtility.server.mapPath("/test.html");
        expect_1.default(fs.existsSync(filePath)).toEqual(false);
        fs.writeFileSync(filePath, "{% isCompressed = true; %}\r\nHello world...");
        expect_1.default(fs.existsSync(filePath)).toEqual(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/test`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            fs.unlinkSync(filePath);
            done();
        });
    });
    it('send get request should be 404 response config.defaultExt = .html', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/index.html`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            done();
        });
    });
    it('send get request should be 404 response', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/404`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            done();
        });
    });
    it('send get request should be 200 response', (done) => {
        const defaultExt = appUtility.server.config.defaultExt;
        appUtility.server.config.defaultExt = "";
        getAgent()
            .get(`http://localhost:${appUtility.port}/index.html`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            appUtility.server.config.defaultExt = defaultExt;
            done();
        });
    });
    let templateConf;
    it('route `/` then should use config.defaultDoc and create template cache', (done) => {
        templateConf = sow_util_1.Util.clone(appUtility.server.config.template);
        appUtility.server.config.template.cache = true;
        appUtility.server.config.template.cacheType = "FILE";
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            done();
        });
    });
    it('should be served from template cache', (done) => {
        expect_1.default(sow_util_1.Util.isPlainObject(templateConf)).toBe(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
            if (templateConf) {
                sow_util_1.Util.extend(appUtility.server.config.template, templateConf);
            }
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("text/html");
            done();
        });
    });
    it('should be template engine define file has been change', function (done) {
        this.timeout(5000);
        appUtility.server.config.template.cache = true;
        appUtility.server.config.template.cacheType = "FILE";
        const indexPath = appUtility.server.mapPath("/index.html");
        return fs.readFile(indexPath, "utf8", (rerr, data) => {
            setTimeout(() => {
                return fs.writeFile(indexPath, `\r\n${data}\r\n`, (werr) => {
                    getAgent()
                        .get(`http://localhost:${appUtility.port}/`)
                        .end((err, res) => {
                        expect_1.default(err).not.toBeInstanceOf(Error);
                        expect_1.default(res.status).toBe(200);
                        expect_1.default(res.header["content-type"]).toBe("text/html");
                        done();
                    });
                });
            }, 200);
        });
    });
    it('test template utility', function (done) {
        this.timeout(5000);
        expect_1.default(sow_template_1.TemplateCore.isScriptTemplate("")).toBe(false);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_template_1.templateNext(Object.create(null), Object.create(null));
        })).toBeInstanceOf(Error);
        sow_template_1.TemplateCore.compile(void 0, (params) => {
            expect_1.default(params.err).toBeInstanceOf(Error);
        });
        const filePath = path.resolve(`${appRoot}/${projectRoot}/template/invalid.html`);
        const tasks = [];
        const forward = () => {
            const nextFunc = tasks.shift();
            if (!nextFunc) {
                if (fs.existsSync(filePath))
                    fs.unlinkSync(filePath);
                return done();
            }
            return nextFunc();
        };
        const ctx = appUtility.server.createContext(Object.create({ id: sow_util_1.Util.guid() }), Object.create(null), (err) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
        });
        ctx.handleError = (err, next) => {
            if (sow_util_1.Util.isError(err)) {
                return forward();
            }
            return next();
        };
        ctx.transferError = (err) => {
            return forward();
        };
        const spublic = appUtility.server.getPublic();
        tasks.push(() => {
            sow_template_1.TemplateCore.run(ctx, spublic, `#extends /template/readme.htmls\r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params) => {
                return forward();
            });
        });
        tasks.push(() => {
            sow_template_1.TemplateCore.run(ctx, spublic, `#attach /template/readme.html\r\n`, (params) => {
                expect_1.default(params.str).toBeDefined();
                return forward();
            });
        });
        tasks.push(() => {
            sow_template_1.TemplateCore.run(ctx, spublic, `#extends \r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params) => {
                return forward();
            });
        });
        tasks.push(() => {
            sow_template_1.TemplateCore.run(ctx, spublic, `#attach /template/readme.htmls \r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params) => {
                return forward();
            });
        });
        tasks.push(() => {
            fs.writeFileSync(filePath, "INVALID_FILE");
            sow_template_1.TemplateCore.run(ctx, spublic, `#extends /template/invalid.html\r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params) => {
                return forward();
            });
        });
        tasks.push(() => {
            fs.writeFileSync(filePath, "<placeholder id><placeholder/>");
            sow_template_1.TemplateCore.run(ctx, spublic, `#extends /template/invalid.html\r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params) => {
                return forward();
            });
        });
        tasks.push(() => {
            fs.writeFileSync(filePath, '<placeholder id=""><placeholder/>');
            sow_template_1.TemplateCore.run(ctx, spublic, `#extends /template/invalid.html\r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params) => {
                return forward();
            });
        });
        tasks.push(() => {
            fs.writeFileSync(filePath, '<placeholder id="test">\r\n</placeholder>{% ERROR %} {= NOPX =}\r\n\r\n\r\n');
            sow_template_1.TemplateCore.run(ctx, spublic, `#extends /template/invalid.html\r\n<impl-placeholder id="test">\r\nNO\r\n</impl-placeholder>`, (params) => {
                return forward();
            });
        });
        return forward();
    });
});
describe("cwserver-bundler", () => {
    let eTag = "";
    let lastModified = "";
    it('js file bundler with gizp response (server file cache)', (done) => {
        const temp = appUtility.server.mapPath(`/web/temp/`);
        if (fs.existsSync(temp)) {
            fsw.rmdirSync(temp);
        }
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                    $virtual_vtest/socket-client.js,
                    static/script/test-1.js,
                    static/script/test-2.js|__owner__`),
            ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            expect_1.default(res.header.etag).not.toBeUndefined();
            expect_1.default(res.header["last-modified"]).toBeDefined();
            lastModified = res.header['last-modified'];
            eTag = res.header.etag;
            done();
        });
    });
    it('bundler should compair if-modified-since header and send 304 (server file cache)', (() => {
        const sendReq = (done, tryCount) => {
            if (tryCount > 0) {
                console.log(`Try Count: ${tryCount} and if-modified-since: ${lastModified}`);
            }
            createRequest("GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-modified-since")
                .set("if-modified-since", lastModified)
                .query({
                g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            })
                .end((err, res) => {
                if (!sow_util_1.Util.isError(err) && tryCount === 0) {
                    return setTimeout(() => {
                        tryCount++;
                        return sendReq(done, tryCount);
                    }, 300), void 0;
                }
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(304);
                expect_1.default(res.header["x-server-revalidate"]).toBe("true");
                return done();
            });
        };
        return (done) => {
            expect_1.default(lastModified.length).toBeGreaterThan(0);
            return sendReq(done, 0);
        };
    })());
    it('bundler should compair if-none-match and send 304 (server file cache)', (() => {
        const sendReq = (done, tryCount) => {
            if (tryCount > 0) {
                console.log(`Try Count: ${tryCount} and if-none-match: ${eTag}`);
            }
            createRequest("GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-none-match")
                .set("if-none-match", eTag)
                .query({
                g: appUtility.server.createBundle(`
					    $virtual_vtest/socket-client.js,
					    static/script/test-1.js,
					    static/script/test-2.js|__owner__`),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            })
                .end((err, res) => {
                if (!sow_util_1.Util.isError(err) && tryCount === 0) {
                    return setTimeout(() => {
                        tryCount++;
                        return sendReq(done, tryCount);
                    }, 300), void 0;
                }
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(304);
                expect_1.default(res.header["x-server-revalidate"]).toBe("true");
                return done();
            });
        };
        return (done) => {
            expect_1.default(eTag.length).toBeGreaterThan(0);
            return sendReq(done, 0);
        };
    })());
    it('js file bundler with gizp response (no server cache)', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        appUtility.server.config.bundler.compress = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                    $virtual_vtest/socket-client.js,
                    static/script/test-1.js,
                    static/script/test-2.js|__owner__`),
            ck: "bundle_no_cache_js", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toEqual(200);
            expect_1.default(res.header["content-type"]).toEqual("application/x-javascript; charset=utf-8");
            expect_1.default(res.header["content-encoding"]).toEqual("gzip");
            expect_1.default(res.header["last-modified"]).toBeDefined();
            lastModified = res.header['last-modified'];
            done();
        });
    });
    (() => {
        const sendReq = (done, tryCount) => {
            if (tryCount > 0) {
                console.log(`Try Count: ${tryCount} and if-modified-since: ${lastModified}`);
            }
            createRequest("GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-modified-since")
                .set("if-modified-since", lastModified)
                .query({
                g: appUtility.server.createBundle(`
						$virtual_vtest/socket-client.js,
						static/script/test-1.js,
						static/script/test-2.js|__owner__`),
                ck: "bundle_no_cache_js", ct: "text/javascript", rc: "Y"
            })
                .end((err, res) => {
                if (!sow_util_1.Util.isError(err) && tryCount === 0) {
                    return setTimeout(() => {
                        tryCount++;
                        return sendReq(done, tryCount);
                    }, 300), void 0;
                }
                try {
                    expect_1.default(err).toBeInstanceOf(Error);
                }
                catch (e) {
                    console.log(e);
                    console.log(err);
                    console.log(typeof (err));
                    throw e;
                }
                expect_1.default(res.status).toEqual(304);
                expect_1.default(res.header["x-server-revalidate"]).toEqual("true");
                return done();
            });
        };
        it("bundler should compair if-modified-since header and send 304 (no server cache)", function (done) {
            this.timeout(5000);
            expect_1.default(lastModified.length).toBeGreaterThan(0);
            appUtility.server.config.bundler.fileCache = false;
            appUtility.server.config.bundler.compress = true;
            setTimeout(() => {
                sendReq(done, 0);
            }, 300);
            return void 0;
        });
    })();
    it('js file bundler not gizp response (no server cache)', (done) => {
        appUtility.server.config.bundler.compress = false;
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`),
            ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
            expect_1.default(res.header["content-encoding"]).toBeUndefined();
            done();
        });
    });
    it('css file bundler with gizp response (server file cache)', (done) => {
        appUtility.server.config.bundler.fileCache = true;
        appUtility.server.config.bundler.compress = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                       static/css/test-1.css,
                       static/css/test-2.css|__owner__`),
            ck: "bundle_test_css", ct: "text/css", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("text/css");
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            expect_1.default(res.header.etag).not.toBeUndefined();
            expect_1.default(res.header["last-modified"]).not.toBeUndefined();
            done();
        });
    });
    it('js file bundler not gizp response (server cache)', (done) => {
        appUtility.server.config.bundler.compress = false;
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                    $virtual_vtest/socket-client.js,
                    static/script/test-1.js`),
            ck: "bundle_no_zip", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
            expect_1.default(res.header["content-encoding"]).toBeUndefined();
            done();
        });
    });
});
describe("cwserver-bundler-error", () => {
    it('bundler should be virtual file error (server cache)', (done) => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                    $virtual_vtest/xsocket-client.js,
                    $root/$public/static/script/test-1.js,
                    $root/$public/static/script/test-2.js|__owner__`),
            ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(500);
            done();
        });
    });
    it('bundler should be virtual file error (no server cache)', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                        $virtual_vtest/xsocket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`),
            ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(500);
            done();
        });
    });
    it('bundler should be virtual error', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                        $virtual_xvtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`),
            ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(500);
            done();
        });
    });
    it('bundler should be unsupported content type error  (server cache)', (done) => {
        appUtility.server.config.bundler.fileCache = true;
        appUtility.server.config.bundler.enable = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`),
            ck: "bundle_test_jsx", ct: "text/plain", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('bundler should be unsupported content type error  (no server cache)', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`),
            ck: "bundle_test_jsx", ct: "text/plain", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('bundler should be path parse error', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        $rootx/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`),
            ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(500);
            done();
        });
    });
    it('bundler should be encryption error', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: `$virtual_vtest/socket-client.js`,
            ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('bundler should be error (no param (no cache))', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('bundler should be error (no param (server cache))', (done) => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('bundler should be encryption error (server cache)', (done) => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
            g: `$virtual_vtest/socket-client.js`,
            ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('bundler should be skip invalid if-modified-since header and send 200', (done) => {
        request
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .set("if-modified-since", `AAAZZZ`)
            .query({
            g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`),
            ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
        })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
            done();
        });
    });
});
describe("cwserver-post", () => {
    it('send post request content type application/json', (done) => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post`)
            .send(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
            .set('Content-Type', 'application/json')
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body.name).toBe('rajibs');
            done();
        });
    });
    it('send post request unknown content type application/jsons', (done) => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post?task=ERROR`)
            .send(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
            .set('Content-Type', 'application/jsons')
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body.error).toBe(true);
            done();
        });
    });
    it('send post request content type urlencoded', (done) => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post`)
            .type('form')
            .send({ name: 'rajibs', occupation: 'kutukutu' })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body.name).toBe('rajibs');
            done();
        });
    });
    it('send post request to async handler', (done) => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post-async/10`)
            .type('form')
            .send({ name: 'rajibs', occupation: 'kutukutu', kv: '' })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body.name).toBe('rajibs');
            done();
        });
    });
    it('should post request not found', (done) => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post/invalid-route`)
            .send(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
            .set('Content-Type', 'application/json')
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
});
describe("cwserver-multipart-paylod-parser", () => {
    const processReq = (done, saveto, reqPath) => {
        let fileName = "";
        let filePath = "";
        let contentType = "";
        if (process.env.SCRIPT === "TS") {
            fileName = "schema.json";
            contentType = "application/json";
            filePath = path.resolve(`./${fileName}`);
        }
        else {
            fileName = "module.spec.js";
            contentType = "application/javascript";
            filePath = path.resolve(`./dist/test/${fileName}`);
        }
        const readStream = fs.createReadStream(filePath);
        const req = getAgent()
            .post(`http://localhost:${appUtility.port}${reqPath || "/upload"}`)
            .query({ saveto });
        if (!reqPath) {
            req.field('post-file', readStream)
                .field('post-file_2', readStream)
                .field('post-file_3', readStream);
        }
        else {
            req.field('post-file', readStream);
        }
        req.end((err, res) => {
            readStream.close();
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body).toBeInstanceOf(Object);
            expect_1.default(res.body.contentType).toBe(contentType);
            expect_1.default(res.body.fileName).toBe(fileName);
            expect_1.default(res.body.name).toBe("post-file");
            done();
        });
    };
    it('should post multipart post file', (done) => {
        processReq(done);
    });
    it('should post multipart post file and save as bulk', (done) => {
        processReq(done, "true");
    });
    it('test multipart post file and clear', (done) => {
        processReq(done, "C");
    });
    it('test multipart post file process non-bolock', (done) => {
        processReq(done, undefined, "/upload-non-bolock");
    });
    it('invalid multipart posted file', function (done) {
        this.timeout(5000 * 10);
        const tempz = appUtility.server.mapPath("/web/.tempz");
        fs.writeFile(tempz, Buffer.from("This is normal line\n".repeat(5)), (err) => {
            const readStream = fs.createReadStream(tempz);
            const req = getAgent()
                .post(`http://localhost:${appUtility.port}/upload-invalid-file`)
                .attach('post-file', readStream, {
                contentType: " ",
                filename: "temp"
            });
            req.end((rerr, res) => {
                readStream.close();
                expect_1.default(rerr).toBeInstanceOf(Error);
                done();
            });
        });
    });
    it('test multipart post file', function (done) {
        this.timeout(5000 * 10);
        const leargeFile = appUtility.server.mapPath("/web/learge.txt");
        const writer = fs.createWriteStream(leargeFile);
        let size = 0;
        function write(wdone) {
            while (true) {
                const buff = Buffer.from("This is normal line\n".repeat(5));
                size += buff.byteLength;
                if (!writer.write(buff)) {
                    writer.once("drain", () => {
                        write(wdone);
                    });
                }
                if (size >= (16400 + 200)) {
                    return wdone();
                }
            }
        }
        write(() => {
            writer.end(() => {
                const readStream = fs.createReadStream(leargeFile);
                getAgent()
                    .post(`http://localhost:${appUtility.port}/upload-test`)
                    .field('post-file', readStream)
                    .end((err, res) => {
                    readStream.close();
                    if (err) {
                        console.log(err);
                    }
                    expect_1.default(err).not.toBeInstanceOf(Error);
                    expect_1.default(res.status).toBe(200);
                    expect_1.default(res.header["content-type"]).toBe("application/json");
                    expect_1.default(res.body).toBeInstanceOf(Object);
                    expect_1.default(res.body.name).toBe("post-file");
                    done();
                });
            });
        });
    });
    it('test multipart post file abort test', function (done) {
        this.timeout(5000 * 10);
        const leargeFile = appUtility.server.mapPath("/web/learge.txt");
        const readStream = fs.createReadStream(leargeFile);
        const req = getAgent()
            .post(`http://localhost:${appUtility.port}/abort-error`)
            .field('post-file', readStream);
        req.on("progress", (event) => {
            if (event.total) {
                if ((event.total - event.loaded) <= 1000) {
                    req.abort();
                    readStream.close();
                    done();
                }
            }
        });
        req.end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
        });
    });
    it('test malformed data', function (done) {
        this.timeout(5000 * 10);
        const leargeFile = appUtility.server.mapPath("/web/learge.txt");
        const readStream = fs.createReadStream(leargeFile);
        const req = getAgent()
            .post(`http://localhost:${appUtility.port}/upload-malformed-data`)
            .field('post-file', readStream);
        req.end((err, res) => {
            readStream.close();
            expect_1.default(err).toBeInstanceOf(Error);
            done();
        });
    });
});
describe("cwserver-gzip-response", () => {
    it('should be response type gzip', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/response`)
            .query({ task: "gzip", data: JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }) })
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            done();
        });
    });
});
describe("cwserver-mime-type", () => {
    it('served static file no cache', (done) => {
        const old = appUtility.server.config.liveStream;
        appUtility.server.config.liveStream = [];
        getAgent()
            .get(`http://localhost:${appUtility.port}/static-file/test.mp3`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("audio/mpeg");
            expect_1.default(res.header["content-length"]).toBeDefined();
            appUtility.server.config.liveStream = old;
            done();
        });
    });
    let eTag = "";
    let lastModified = "";
    it('should be mime type encoding gzip', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header.etag).toBeDefined();
            expect_1.default(res.header['last-modified']).toBeDefined();
            lastModified = res.header['last-modified'];
            eTag = res.header.etag;
            expect_1.default(res.header["content-type"]).toBe("image/png");
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            done();
        });
    });
    it('should be mime type if-none-match', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .set("if-none-match", eTag)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(304);
            expect_1.default(res.header["x-server-revalidate"]).toBe("true");
            done();
        });
    });
    it('should be mime type if-modified-since', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .set("if-modified-since", lastModified)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(304);
            expect_1.default(res.header["x-server-revalidate"]).toBe("true");
            done();
        });
    });
    it('should be mime type not found', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logos.png`)
            .set("if-modified-since", lastModified)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('unsupported mime type', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.zip`)
            .set("if-modified-since", lastModified)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('should be served from file (no server file cache)', (done) => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .end((err, res) => {
            appUtility.server.config.staticFile.fileCache = oldfileCache;
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header.etag).toBeDefined();
            expect_1.default(res.header['last-modified']).toBeDefined();
            lastModified = res.header['last-modified'];
            eTag = res.header.etag;
            expect_1.default(res.header["content-type"]).toBe("image/png");
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            done();
        });
    });
    it('should be gzip response & served from file (no server file cache)', (done) => {
        const oldValue = sow_util_1.Util.clone(appUtility.server.config.staticFile);
        appUtility.server.config.staticFile.fileCache = false;
        appUtility.server.config.staticFile.compression = true;
        const filePath = appUtility.server.mapPath("/test.pdf");
        expect_1.default(fs.existsSync(filePath)).toEqual(false);
        fs.writeFileSync(filePath, "<h1>Hello World</h1>");
        expect_1.default(fs.existsSync(filePath)).toEqual(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/test.pdf`)
            .end((err, res) => {
            sow_util_1.Util.extend(appUtility.server.config.staticFile, oldValue);
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/pdf");
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            done();
        });
    });
    it('should be mime type if-none-match (no server file cache)', (done) => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .set("if-none-match", eTag)
            .end((err, res) => {
            appUtility.server.config.staticFile.fileCache = oldfileCache;
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(304);
            expect_1.default(res.header["x-server-revalidate"]).toBe("true");
            done();
        });
    });
    it('should be favicon.ico 200', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/favicon.ico`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("image/x-icon");
            done();
        });
    });
});
describe("cwserver-virtual-dir", () => {
    it('check-virtual-dir-server-manage', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-virtual/socket-client.js`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/javascript");
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            done();
        });
    });
    it('check-virtual-dir-mimeType-404', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-virtual/socket-client.jsx`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('check-virtual-dir-handler', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/vtest/socket-client.js`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/javascript");
            expect_1.default(res.header["content-encoding"]).toBe("gzip");
            done();
        });
    });
});
describe("cwserver-socket-io-implementation", () => {
    it('get ws-server-event', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/ws-server-event`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body).toBeInstanceOf(Object);
            expect_1.default(res.body.server).toBeInstanceOf(Array);
            expect_1.default(res.body.server.indexOf("test-msg")).toBeGreaterThan(-1);
            done();
        });
    });
    it('should be send n receive data over socket-io', (done) => {
        const socket = io.connect(`http://localhost:${appUtility.port}`, {
            reconnection: true, transportOptions: {
                polling: {
                    extraHeaders: {
                        'Cookie': authCookies[0].substring(0, authCookies[0].indexOf(";"))
                    }
                }
            }
        });
        socket.on('connect', () => {
            socket.emit('test-msg', { name: 'rajibs', occupation: 'kutukutu' });
        });
        socket.on('on-test-msg', (data) => {
            socket.close();
            expect_1.default(data.name).toEqual('rajibs');
            done();
        });
    });
});
describe("cwserver-echo", () => {
    it('echo-server', (done) => {
        const reqMd5 = cwserver.Encryption.toMd5("Test");
        const hex = cwserver.Encryption.utf8ToHex(reqMd5);
        getAgent()
            .post(`http://localhost:${appUtility.port}/echo`)
            .send(JSON.stringify({ hex }))
            .set('Content-Type', 'application/json')
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("application/json");
            expect_1.default(res.body.hex).toBeDefined();
            expect_1.default(res.body.hex).toEqual(hex);
            const resMd5 = cwserver.Encryption.hexToUtf8(res.body.hex);
            expect_1.default(resMd5).toEqual(reqMd5);
            done();
        });
    });
});
describe("cwserver-web-stream", () => {
    it('should-be-get-stream-request', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/web-stream/test.mp3`)
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            expect_1.default(res.header["content-type"]).toBe("audio/mpeg");
            expect_1.default(res.header["content-length"]).toBeDefined();
            done();
        });
    });
    it('should-be-stream', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/web-stream/test.mp3`)
            .set("range", "bytes=0-")
            .end((err, res) => {
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(206); // Partial Content
            expect_1.default(res.header["content-type"]).toBe("audio/mpeg");
            expect_1.default(res.header["content-range"]).toBeDefined();
            done();
        });
    });
});
describe("cwserver-error", () => {
    it('should be throw server error', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/app-error/`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(500);
            done();
        });
    });
    it('should be throw controller error', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/controller-error`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(500);
            done();
        });
    });
    it('should be pass server error', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/pass-error`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(500);
            done();
        });
    });
});
describe("cwserver-controller-reset", () => {
    it('config.defaultDoc', (done) => {
        const defaultExt = appUtility.server.config.defaultExt;
        const defaultDoc = appUtility.server.config.defaultDoc;
        appUtility.server.config.defaultDoc = ["index.html", "default.html"];
        appUtility.server.config.defaultExt = "";
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
            appUtility.server.config.defaultExt = defaultExt;
            appUtility.server.config.defaultDoc = defaultDoc;
            expect_1.default(err).not.toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(200);
            done();
        });
    });
    it('should be route not found', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/app-errors`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('no controller found for put', (done) => {
        getAgent()
            .delete(`http://localhost:${appUtility.port}/app-errors`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('should-be-reset-controller', (done) => {
        expect_1.default(appUtility.controller.remove('/authenticate')).toEqual(true);
        expect_1.default(appUtility.controller.remove('/post')).toEqual(true);
        appUtility.controller.reset();
        done();
    });
    it('should-be-controller-error', (done) => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/response`)
            .query({ task: "gzip", data: JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }) })
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
    it('test-raw-error', (done) => {
        app.clearHandler();
        getAgent()
            .get(`http://localhost:${appUtility.port}/response`)
            .end((err, res) => {
            expect_1.default(err).toBeInstanceOf(Error);
            expect_1.default(res.status).toBe(404);
            done();
        });
    });
});
describe("cwserver-utility", () => {
    const getConfig = (() => {
        const configFile = path.resolve(`${appRoot}/${projectRoot}/config/app.config.json`);
        let config;
        return () => {
            if (config)
                return sow_util_1.Util.clone(config);
            const cjson = fsw.readJsonAsync(configFile);
            if (cjson) {
                config = cjson;
            }
            if (config)
                return sow_util_1.Util.clone(config);
            return {};
        };
    })();
    it("test-app-utility", function (done) {
        this.timeout(5000);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_util_1.assert(false, "test");
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_util_1.assert("", "string");
        })).toBeInstanceOf(Error);
        (() => {
            process.env.SCRIPT = "JS";
            expect_1.default(test_view_1.shouldBeError(() => {
                sow_server_1.readAppVersion();
            })).toBeInstanceOf(Error);
            process.env.SCRIPT = "TS";
            const parent = path.resolve(__dirname, '..');
            const absPath = path.resolve(`${parent}/package.json`);
            fs.renameSync(absPath, `${absPath}.bak`);
            fs.writeFileSync(absPath, "INVALID_JSON");
            expect_1.default(test_view_1.shouldBeError(() => {
                sow_server_1.readAppVersion();
            })).toBeInstanceOf(Error);
            fs.unlinkSync(absPath);
            fs.renameSync(`${absPath}.bak`, absPath);
        })();
        (() => {
            const old = appUtility.server.config.session.cookie;
            appUtility.server.config.session.cookie = "";
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.parseSession("");
            })).toBeInstanceOf(Error);
            appUtility.server.config.session.cookie = old;
            expect_1.default(appUtility.server.parseSession("").isAuthenticated).toBeFalsy();
            expect_1.default(appUtility.server.escape()).toBeDefined();
            expect_1.default(appUtility.server.pathToUrl(`/${projectRoot}/test.png`)).toBeDefined();
            expect_1.default(appUtility.server.pathToUrl(`${projectRoot}/test.png`)).toBeDefined();
            const oldPort = appUtility.server.config.hostInfo.port;
            appUtility.server.config.hostInfo.port = 0;
            const newConfig = appUtility.server.config;
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.implimentConfig(newConfig);
            })).toBeInstanceOf(Error);
            process.env.PORT = "8080";
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.implimentConfig(newConfig);
            })).toBeInstanceOf(Error);
            appUtility.server.config.hostInfo.port = oldPort;
        })();
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_http_status_1.HttpStatus.isErrorCode("adz");
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_http_status_1.HttpStatus.getDescription(45510);
        })).toBeInstanceOf(Error);
        expect_1.default(sow_http_status_1.HttpStatus.fromPath("result", 200)).toEqual(200);
        expect_1.default(sow_http_status_1.HttpStatus.fromPath("/result", 200)).toEqual(200);
        expect_1.default(sow_http_status_1.HttpStatus.getResInfo("/result", 0).isValid).toEqual(false);
        expect_1.default(sow_http_status_1.HttpStatus.isValidCode(45510)).toEqual(false);
        expect_1.default(sow_http_status_1.HttpStatus.statusCode).toBeInstanceOf(Object);
        expect_1.default(sow_static_1.ToNumber(null)).toEqual(0);
        expect_1.default(sow_static_1.ToResponseTime()).toBeDefined();
        expect_1.default(sow_static_1.ToResponseTime(new Date("2020-01-01").getTime())).toBeDefined();
        expect_1.default(sow_static_1.ToResponseTime(new Date("2020-01-05").getTime())).toBeDefined();
        expect_1.default(test_view_1.shouldBeError(() => {
            cwserver.Encryption.encrypt("nothing", {
                oldKey: "",
                key: void 0,
                iv: void 0
            });
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            cwserver.Encryption.decrypt("nothing", {
                oldKey: "",
                key: void 0,
                iv: void 0
            });
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            fsw.mkdirSync(logDir, "./");
        })).toBeInstanceOf(Error);
        expect_1.default(fsw.mkdirSync("")).toBeFalsy();
        expect_1.default(test_view_1.shouldBeError(() => {
            fsw.copyFileSync(`${logDir}/temp/`, "./");
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            fsw.copyFileSync(`${logDir}/temp/nofile.lg`, "./");
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            fsw.copyFileSync(`${logDir}/temp/nofile.lg`, `${logDir}/temp/nofile.lgx`);
        })).toBeInstanceOf(Error);
        expect_1.default(fsw.rmdirSync(`${logDir}/temp/`)).not.toBeInstanceOf(Error);
        expect_1.default(fsw.copySync(`${logDir}/temp/`, `${logDir}/tempx/`)).not.toBeInstanceOf(Error);
        expect_1.default(fsw.mkdirSync(logDir)).toEqual(true);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_util_1.Util.throwIfError(new Error("Error test..."));
        })).toBeInstanceOf(Error);
        expect_1.default(sow_util_1.Util.extend({}, sow_static_1.Session.prototype)).toBeInstanceOf(Object);
        expect_1.default(sow_util_1.Util.extend({}, () => {
            return new sow_static_1.Session();
        }, true)).toBeInstanceOf(Object);
        expect_1.default(sow_util_1.Util.extend({}, { "__proto__": "__no_proto__", "constructor"() { return {}; } })).toBeInstanceOf(Object);
        expect_1.default(sow_util_1.Util.extend({}, { "__proto__": "__no_proto__", "constructor"() { return {}; } }, true)).toBeInstanceOf(Object);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_util_1.Util.extend("", {});
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_util_1.Util.extend("", {}, true);
        })).toBeInstanceOf(Error);
        expect_1.default(cwserver.Encryption.decrypt("", appUtility.server.config.encryptionKey)).toEqual("");
        const str = "TEST";
        const hex = cwserver.Encryption.utf8ToHex(str);
        expect_1.default(cwserver.Encryption.hexToUtf8(hex)).toEqual(str);
        const plainText = "rajib";
        let enc = appUtility.server.encryption.encrypt(plainText);
        expect_1.default(plainText).toEqual(appUtility.server.encryption.decrypt(enc));
        enc = appUtility.server.encryption.encryptToHex(plainText);
        expect_1.default(plainText).toEqual(appUtility.server.encryption.decryptFromHex(enc));
        enc = appUtility.server.encryption.encryptUri(plainText);
        expect_1.default(plainText).toEqual(appUtility.server.encryption.decryptUri(enc));
        done();
    });
    describe('config', () => {
        let untouchedConfig = {};
        it('database', function (done) {
            this.timeout(5000);
            untouchedConfig = cwserver.Util.clone(appUtility.server.config);
            expect_1.default(test_view_1.shouldBeError(() => {
                try {
                    const newConfig = appUtility.server.config;
                    newConfig.database = {};
                    appUtility.server.initilize();
                }
                catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                            module: "", path: "", dbConn: {
                                database: "", password: ""
                            }
                        }];
                    appUtility.server.initilize();
                }
                catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                            module: "pgsql", path: "", dbConn: {
                                database: "", password: ""
                            }
                        }];
                    appUtility.server.initilize();
                }
                catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                            module: "pgsql", path: "$rotex/$public/lib/pgslq.js", dbConn: {
                                database: "", password: ""
                            }
                        }];
                    appUtility.server.initilize();
                }
                catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                            module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                                database: "sysdb", password: ""
                            }
                        }];
                    appUtility.server.initilize();
                }
                catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                            module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                                database: "sysdb", password: "xyz"
                            }
                        }];
                    appUtility.server.initilize();
                }
                catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            (() => {
                const parent = path.resolve(__dirname, '..');
                const absPath = path.resolve(`${parent}/dist/project_template/test/db-module.js`);
                appUtility.server.config.database = [{
                        module: "dbContext",
                        path: absPath,
                        dbConn: {
                            database: "sysdb", password: "xyz"
                        }
                    }, {
                        module: "dbContext",
                        path: absPath,
                        dbConn: {
                            database: "sysdb", password: "xyz"
                        }
                    }];
                expect_1.default(test_view_1.shouldBeError(() => {
                    appUtility.server.initilize();
                })).toBeInstanceOf(Error);
                sow_util_1.Util.extend(appUtility.server.config, untouchedConfig);
            })();
            done();
        });
        it('override', function (done) {
            this.timeout(5000);
            /* [Error Page] */
            expect_1.default(test_view_1.shouldBeError(() => {
                const newConfig = getConfig();
                newConfig.errorPage = {};
                appUtility.server.implimentConfig(newConfig);
                appUtility.server.initilize();
            }, true)).not.toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const newConfig = appUtility.server.config;
                newConfig.errorPage = void 0;
                appUtility.server.initilize();
            })).not.toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.config.errorPage = {
                    "404": appUtility.server.errorPage["404"]
                };
                appUtility.server.initilize();
            }, true)).not.toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const oldkey = appUtility.server.config.errorPage;
                try {
                    const newConfig = appUtility.server.config;
                    newConfig.errorPage = [];
                    appUtility.server.initilize();
                }
                catch (e) {
                    appUtility.server.config.errorPage = oldkey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const oldkey = appUtility.server.config.errorPage;
                try {
                    const newConfig = appUtility.server.config;
                    newConfig.errorPage = {
                        "405": "g/nopx/404.html"
                    };
                    appUtility.server.initilize();
                }
                catch (e) {
                    appUtility.server.config.errorPage = oldkey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            /* [/Error Page] */
            expect_1.default(test_view_1.shouldBeError(() => {
                const oldKey = appUtility.server.config.encryptionKey;
                try {
                    const newConfig = appUtility.server.config;
                    newConfig.encryptionKey = void 0;
                    appUtility.server.implimentConfig(newConfig);
                }
                catch (e) {
                    appUtility.server.config.encryptionKey = oldKey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const oldKey = appUtility.server.config.hiddenDirectory;
                try {
                    const newConfig = appUtility.server.config;
                    newConfig.hiddenDirectory = void 0;
                    newConfig.encryptionKey = "NEW_KEY";
                    appUtility.server.implimentConfig(newConfig);
                }
                catch (e) {
                    appUtility.server.config.hiddenDirectory = oldKey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const oldkey = appUtility.server.config.session;
                try {
                    const newConfig = appUtility.server.config;
                    newConfig.session = {};
                    appUtility.server.implimentConfig(newConfig);
                }
                catch (e) {
                    appUtility.server.config.session = oldkey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(appUtility.server.parseSession("test=1;no-parse")).toBeInstanceOf(sow_static_1.Session);
            cwserver.Util.extend(appUtility.server.config, untouchedConfig);
            expect_1.default(appUtility.server.parseSession("_session=error")).toBeInstanceOf(sow_static_1.Session);
            expect_1.default(test_view_1.shouldBeError(() => {
                const oldkey = appUtility.server.config.session;
                const enckey = appUtility.server.config.encryptionKey;
                try {
                    const newConfig = appUtility.server.config;
                    newConfig.encryptionKey = "NEW_KEY";
                    newConfig.session = {
                        key: "session",
                        maxAge: {}
                    };
                    appUtility.server.implimentConfig(newConfig);
                }
                catch (e) {
                    appUtility.server.config.session = oldkey;
                    appUtility.server.config.encryptionKey = enckey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const oldkey = appUtility.server.config.cacheHeader;
                const enckey = appUtility.server.config.encryptionKey;
                const oldSession = appUtility.server.config.session;
                try {
                    const newConfig = appUtility.server.config;
                    newConfig.encryptionKey = "NEW_KEY";
                    newConfig.cacheHeader = void 0;
                    newConfig.session = {
                        key: "session",
                        maxAge: void 0
                    };
                    appUtility.server.implimentConfig(newConfig);
                }
                catch (e) {
                    appUtility.server.config.session = oldSession;
                    appUtility.server.config.cacheHeader = oldkey;
                    appUtility.server.config.encryptionKey = enckey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            (() => {
                expect_1.default(test_view_1.shouldBeError(() => {
                    appUtility.server.getErrorPath(100);
                })).toBeInstanceOf(Error);
                const oldError = sow_util_1.Util.clone(appUtility.server.config.errorPage);
                appUtility.server.config.errorPage = {};
                expect_1.default(appUtility.server.getErrorPath(500)).toBeDefined();
                expect_1.default(test_view_1.shouldBeError(() => {
                    appUtility.server.getErrorPath(402);
                })).toBeInstanceOf(Error);
                sow_util_1.Util.extend(appUtility.server.config.errorPage, oldError);
            })();
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.parseMaxAge("10N");
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.parseMaxAge("AD");
            })).toBeInstanceOf(Error);
            expect_1.default(appUtility.server.parseMaxAge("1H")).not.toBeInstanceOf(Error);
            expect_1.default(appUtility.server.parseMaxAge("1M")).not.toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.parseMaxAge({});
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.formatPath("$root/$public/lib.js");
            })).toBeInstanceOf(Error);
            expect_1.default(appUtility.server.formatPath("root/public/lib.js")).not.toBeInstanceOf(Error);
            done();
        });
    });
    it('log', function (done) {
        this.timeout(5000);
        appUtility.server.log.log("log-test");
        appUtility.server.log.info("log-info-test");
        appUtility.server.log.dispose();
        let logger = new sow_logger_1.Logger();
        logger.log("log-test");
        logger.info("log-test");
        logger.success("log-test");
        logger.error("log-test");
        expect_1.default(test_view_1.shouldBeError(() => {
            logger.flush();
        })).toBeInstanceOf(Error);
        logger.reset();
        logger.dispose();
        logger.dispose();
        logger = new sow_logger_1.Logger(logDir, void 0, "+6", void 0, false);
        logger.write("test");
        logger.dispose();
        logger = new sow_logger_1.Logger(void 0, void 0, "+6", false);
        logger.write(cwserver.ConsoleColor.Cyan("User Interactive"));
        logger.dispose();
        appUtility.server.log.dispose();
        logger = new sow_logger_1.Logger(logDir, projectRoot, "+6", true, true, 100);
        expect_1.default(logger.flush()).toEqual(true);
        expect_1.default(logger.flush()).toEqual(false);
        logger.log({});
        logger.writeToStream("log-test");
        logger.writeToStream("log-test");
        logger.writeToStream("log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test");
        logger.writeToStream("log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test ");
        logger.writeToStream("log-test");
        logger.reset();
        logger.dispose();
        expect_1.default(sow_logger_1.LogTime.dfo(0)).toEqual("01");
        expect_1.default(sow_logger_1.LogTime.dfm(11)).toEqual("12");
        done();
    });
});
describe("cwserver-schema-validator", () => {
    it("validate-schema", function (done) {
        this.timeout(5000);
        expect_1.default(sow_schema_validator_1.fillUpType("array")).toBeInstanceOf(Array);
        expect_1.default(sow_schema_validator_1.fillUpType("number")).toEqual(0);
        expect_1.default(sow_schema_validator_1.fillUpType("boolean")).toBeFalsy();
        expect_1.default(sow_schema_validator_1.fillUpType("string")).toBeDefined();
        expect_1.default(sow_schema_validator_1.fillUpType("object")).toBeInstanceOf(Object);
        expect_1.default(sow_schema_validator_1.fillUpType()).toBeUndefined();
        (() => {
            const schemaProperties = {
                "session": {
                    "type": "array",
                    "minLength": 0,
                    "description": "Effect on server.setSession",
                    "additionalProperties": true,
                    "items": {
                        "type": "object",
                        "properties": {
                            "cookie": {
                                "type": "string",
                                "minLength": 1,
                                "description": "Session cookie name"
                            },
                            "maxAge": {
                                "type": "string",
                                "minLength": 2,
                                "description": "maxAge = m = Month | d = Day | h = Hour | m = Minute."
                            },
                            "key": {
                                "type": "string",
                                "minLength": 1,
                                "description": "This encryption key will be use session cookie encryption"
                            },
                            "isSecure": {
                                "type": "boolean",
                                "minLength": 1,
                                "description": "Session cookie send for secure connections"
                            }
                        }
                    },
                }
            };
            expect_1.default(sow_schema_validator_1.schemaValidate("root.session", schemaProperties, {
                "session": [{
                        "cookie": "_session",
                        "maxAge": "1d",
                        "key": "adfasf$aa",
                        "isSecure": false
                    }]
            }, true)).not.toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                sow_schema_validator_1.schemaValidate("root.session", schemaProperties, {
                    "session": [""]
                }, true);
            })).toBeInstanceOf(Error);
            sow_schema_validator_1.schemaValidate("root.nsession", schemaProperties, {
                "nsession": []
            }, true);
        })();
        const config = fsw.readJsonAsync(appUtility.server.mapPath("/config/app.config.json"));
        expect_1.default(config).toBeInstanceOf(Object);
        if (!config)
            throw new Error("unreachable...");
        const $schema = config.$schema;
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = void 0;
            sow_schema_validator_1.Schema.Validate(config);
        })).toBeInstanceOf(Error);
        config.$schema = $schema;
        expect_1.default((() => {
            config.$comment = "this config";
            sow_schema_validator_1.Schema.Validate(config);
        })()).not.toBeInstanceOf(Error);
        config.$schema = $schema;
        expect_1.default(test_view_1.shouldBeError(() => {
            const oldVal = config.staticFile;
            try {
                config.noCache = void 0;
                config.staticFile = void 0;
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.staticFile = oldVal;
                config.noCache = [];
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.template.cacheType = "MEMS";
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.template.cacheType = "MEM";
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.template.cache = "MEMS";
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.template.cache = false;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            const template = sow_util_1.Util.clone(config.template);
            try {
                delete config.template;
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.template = template;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            const template = sow_util_1.Util.clone(config.template);
            try {
                config.template.addvalue = "";
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.template = template;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            const template = sow_util_1.Util.clone(config.template);
            try {
                config.template = "";
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.template = template;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.liveStream = [1];
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.liveStream = [];
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.liveStream = {};
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.liveStream = [];
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.isDebug = {};
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.isDebug = false;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            const old = config.Author;
            try {
                config.Author = "ME";
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.Author = old;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            const old = config.defaultDoc;
            try {
                config.defaultDoc = [];
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.defaultDoc = old;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            const old = config.appName;
            try {
                config.appName = "";
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.appName = old;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            config.$schema = $schema;
            const old = config.template;
            try {
                config.template = void 0;
                sow_schema_validator_1.Schema.Validate(config);
            }
            catch (e) {
                config.template = old;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_schema_validator_1.Schema.Validate([]);
        })).toBeInstanceOf(Error);
        const parent = path.resolve(__dirname, '..');
        const absPath = path.resolve(`${parent}/schema.json`);
        expect_1.default(fs.existsSync(absPath)).toBe(true);
        const distPath = path.resolve(`${parent}/schemas.json`);
        fs.renameSync(absPath, distPath);
        process.env.SCRIPT = "TSX";
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_schema_validator_1.Schema.Validate(config);
        })).toBeInstanceOf(Error);
        process.env.SCRIPT = "TS";
        fs.writeFileSync(absPath, "{}");
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_schema_validator_1.Schema.Validate(config);
        })).toBeInstanceOf(Error);
        fs.writeFileSync(absPath, "INVALID_JSON");
        expect_1.default(test_view_1.shouldBeError(() => {
            sow_schema_validator_1.Schema.Validate(config);
        })).toBeInstanceOf(Error);
        fs.unlinkSync(absPath);
        fs.renameSync(distPath, absPath);
        done();
    });
});
describe("cwserver-fsw", () => {
    it("test-fsw", function (done) {
        this.timeout(5000);
        const root = path.resolve(`${appRoot}/ewww`);
        const filePath = path.resolve(root + "/config/app.config.json");
        fs.writeFile(filePath, JSON.stringify({ name: "Safe Online World Ltd." }), (err) => {
            sow_util_1.assert(err === null, "test-fsw->fs.writeFile");
            fsw.readJson(filePath, (jerr, json) => {
                sow_util_1.assert(jerr === null, "test-fsw->fsw.readJson");
                expect_1.default(json).toBeInstanceOf(Object);
                fs.writeFileSync(filePath, "INVALID_JSON");
                fsw.readJson(filePath, (jnerr, njson) => {
                    sow_util_1.assert(jnerr !== null, "test-fsw->fsw.readJson-jnerr");
                    expect_1.default(njson).toBeUndefined();
                    fsw.mkdir("", "", (derr) => {
                        expect_1.default(derr).toBeInstanceOf(Error);
                    }, handleError);
                    fsw.mkdir(root, ".", (derr) => {
                        expect_1.default(derr).toBeInstanceOf(Error);
                    }, handleError);
                    fsw.mkdir(filePath, "", (mderr) => {
                        expect_1.default(mderr).toBeInstanceOf(Error);
                        fsw.copyDir(path.join(root, "/noton/"), path.resolve(`${appRoot}/cwww`), (crderr) => {
                            expect_1.default(crderr).toBeInstanceOf(Error);
                        }, handleError);
                        fsw.copyDir(root, path.resolve(`${appRoot}/cwww`), (ncrderr) => {
                            expect_1.default(ncrderr).not.toBeInstanceOf(Error);
                            fsw.mkdir(root, "/my.json", (rderr) => {
                                expect_1.default(rderr).toBeInstanceOf(Error);
                                fsw.copyFile(filePath, root, (crderr) => {
                                    expect_1.default(crderr).toBeInstanceOf(Error);
                                });
                                fsw.copyFile(root, root, (dncrderr) => {
                                    expect_1.default(dncrderr).toBeInstanceOf(Error);
                                });
                                fsw.copyFile(`${filePath}.not`, filePath, (fcrderr) => {
                                    expect_1.default(fcrderr).toBeInstanceOf(Error);
                                    fsw.copyFile(filePath, `${filePath}.not`, (cfcrderr) => {
                                        expect_1.default(cfcrderr).not.toBeInstanceOf(Error);
                                        fsw.unlink(`${filePath}.not`, (uerr) => {
                                            expect_1.default(uerr).not.toBeInstanceOf(Error);
                                            fsw.rmdir(root, (rerr) => {
                                                expect_1.default(rerr).toBe(null);
                                                done();
                                            }, handleError);
                                        });
                                    });
                                });
                            }, handleError);
                        }, handleError);
                    }, handleError);
                }, handleError);
            }, handleError);
        });
    });
});
describe("finalization", () => {
    it("shutdown-application", (done) => {
        (() => __awaiter(void 0, void 0, void 0, function* () {
            yield app.shutdown();
            done();
        }))();
    });
});
//# sourceMappingURL=module.spec.js.map