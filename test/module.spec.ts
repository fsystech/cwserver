/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 4:38 AM 5/22/2020
import 'mocha';
import * as crypto from 'crypto';
import expect from 'expect';
import * as fs from 'fs';
import * as path from 'path';
import * as request from 'superagent';
import * as io from 'socket.io-client';
import * as fsw from '../lib/sow-fsw';
import { HttpStatus } from "../lib/sow-http-status";
import * as cwserver from '../index';
import { Session, ToNumber, ToResponseTime, IBufferArray, BufferArray } from '../lib/sow-static';
import {
    IAppUtility, IContext
} from '../lib/sow-server';
import {
    IRequestParam, getRouteInfo, ILayerInfo, getRouteMatcher, pathToArray
} from '../lib/sow-router';
import { IApplication, readAppVersion, App, IRequest, IResponse, NextFunction } from '../lib/sow-server-core';
import { assert, Util } from '../lib/sow-util';
import { Schema, fillUpType, schemaValidate, IProperties } from '../lib/sow-schema-validator';
import { TemplateCore, templateNext, CompilerResult } from '../lib/sow-template';
import { shouldBeError } from "./test-view";
import { Logger, LogTime, ShadowLogger } from '../lib/sow-logger';
import { promisify } from 'util';
const sleep = promisify(setTimeout);
let app: IApplication;
const appRoot = process.env.SCRIPT === "TS" ? path.join(path.resolve(__dirname, '..'), "/dist/test/") : __dirname;
const projectRoot = 'test_web';
const logDir = path.resolve('./log/');
let authCookies: string = "";
type Agent = request.SuperAgentStatic & request.Request;
const agent: Agent = request.agent();
let appIsLestening: boolean = false;
let appUtility: IAppUtility;
const createRequest = (method: string, url: string, ensure?: string): request.SuperAgentRequest => {
    expect(appIsLestening).toEqual(true);
    const client: request.SuperAgentRequest = method === "GET" ? agent.get(url) : agent.post(url);
    if (!ensure) return client;
    const key: string = ensure;
    const end = client.end.bind(client);
    client.end = function (callback?: (err: any, res: request.Response) => void) {
        expect(this.get(key).length).toBeGreaterThan(0);
        end(callback);
    };
    return client;
};
const getAgent = (): Agent => {
    expect(appIsLestening).toEqual(true);
    return agent;
};
const shutdownApp = (done?: Mocha.Done): void => {
    try {
        app.shutdown((err?: Error): void => {
            if (!done) return;
            return done();
        });
    } catch (e) {
        if (!done) return;
        return done(e);
    }
};
describe("cwserver-default-project-template", () => {
    it("create project template", function (done: Mocha.Done): void {
        this.timeout(5000);
        cwserver.createProjectTemplate({
            appRoot,
            projectRoot,
            allExample: false,
            force: true, // Delete if projectRoot exists
            isTest: true // add test view
        });
        done();
    });
});
function handleError(
    err: NodeJS.ErrnoException | Error | null | undefined,
    next: () => void
): void {
    // console.log(err);
    // Util.throwIfError(err);
    return next();
}
function toBeApplicationJson(val?: string): void {
    if (!val) throw new Error("content-type required application/json. Found empty.");
    expect(val.indexOf("application/json")).toBeGreaterThanOrEqual(0);
}
function toBeApplicationJavaScript(val?: string): void {
    if (!val) throw new Error("content-type required application/javascript. Found empty.");
    expect(val.indexOf("application/javascript")).toBeGreaterThanOrEqual(0);
}
function toBeTextHtml(val?: string): void {
    if (!val) throw new Error("content-type required text/html. Found empty.");
    expect(val.indexOf("text/html")).toBeGreaterThanOrEqual(0);
}
describe("cwserver-core", () => {
    it("initilize server throw error (mismatch between given appRoot and config.hostInfo.root)", (done: Mocha.Done): void => {
        const root: string = path.resolve(`${appRoot}/ewww`); // path.resolve( appRoot, "/ewww" );
        fsw.mkdir(appRoot, "/ewww/config", (err: NodeJS.ErrnoException | null): void => {
            expect(err).not.toBeInstanceOf(Error);
            expect(fs.existsSync(root)).toEqual(true);
            const filePath: string = path.resolve(root + "/config/app.config.json");
            const fromFile: string = path.resolve(`${appRoot}/${projectRoot}/config/app.config.json`);
            expect(fs.existsSync(fromFile)).toEqual(true);
            fs.copyFileSync(fromFile, filePath);
            expect(shouldBeError(() => {
                cwserver.initilizeServer(appRoot, `ewww`);
            })).toBeInstanceOf(Error);
            done();
        }, handleError);
    });
    it("initilize server throw error (invalid app.config.json)", function (done: Mocha.Done): void {
        this.timeout(5000);
        const capp = cwserver.App();
        expect(capp).toBeDefined();
        expect(capp.version).toBeDefined();
        expect(new cwserver.Session()).toBeInstanceOf(cwserver.Session);
        expect(cwserver.parseCookie("cook=125;")).toBeDefined();
        const root: string = path.resolve(`${appRoot}/ewww`);
        const filePath: string = path.resolve(root + "/config/app.config.json");
        fs.writeFile(filePath, "INVALID_FILE", (err: NodeJS.ErrnoException | null) => {
            const orginalCfg: string = path.resolve(`${appRoot}/${projectRoot}/config/app.config.json`);
            fsw.compairFileSync(filePath, orginalCfg);
            setTimeout(() => {
                fsw.compairFileSync(filePath, filePath);
                expect(shouldBeError(() => {
                    cwserver.initilizeServer(appRoot, `ewww`);
                })).toBeInstanceOf(Error);
                fsw.rmdir(path.join(root, "nobody"), (nerr: NodeJS.ErrnoException | null) => {
                    expect(nerr).toBeDefined();
                    done();
                }, handleError);
            }, 300);
        });
    });
    it("initilize server throw error (projectRoot not provided)", (done: Mocha.Done): void => {
        expect(shouldBeError(() => {
            cwserver.initilizeServer(appRoot);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server throw error (projectRoot not provided)", (done: Mocha.Done): void => {
        expect(shouldBeError(() => {
            cwserver.initilizeServer(appRoot);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server throw error (projectRoot not provided while you using IISNODE)", (done: Mocha.Done): void => {
        process.env.IISNODE_VERSION = "iisnode";
        expect(shouldBeError(() => {
            cwserver.initilizeServer(appRoot);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server throw error (projectRoot not found)", (done: Mocha.Done): void => {
        expect(shouldBeError(() => {
            cwserver.initilizeServer(appRoot, `${projectRoot}_not_found`);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server throw error (app.config.json not found)", (done: Mocha.Done): void => {
        expect(shouldBeError(() => {
            cwserver.initilizeServer(appRoot, `/`);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize server", (done: Mocha.Done): void => {
        if (fs.existsSync(logDir)) {
            fsw.rmdirSync(logDir);
        }
        appUtility = cwserver.initilizeServer(appRoot, projectRoot);
        expect(appUtility.public).toEqual(projectRoot);
        console.log(`\t\t\tcwserver ${appUtility.server.version}`);
        done();
    });
    it("initilize server throw error (Server instance can initilize 1 time)", (done: Mocha.Done): void => {
        expect(shouldBeError(() => {
            cwserver.initilizeServer(appRoot, projectRoot);
        })).toBeInstanceOf(Error);
        done();
    });
    it("initilize application", function (done: Mocha.Done): void {
        this.timeout(5000);
        app = appUtility.init();
        done();
    });
    it("application listen", (done: Mocha.Done): void => {
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
    it("throw application already shutdown", (done: Mocha.Done): void => {
        app.shutdown((err) => {
            expect(err).toBeInstanceOf(Error);
            done();
        });
    });
    it('cwserver handle app root error', function (done) {
        this.timeout(5000);
        const xapp: IApplication = App();
        xapp.use("/throw-error", (req: IRequest, res: IResponse) => {
            throw new Error("No way...");
        }).prerequisites((req: IRequest, res: IResponse, next: NextFunction) => {
            throw new Error("prerequisites No way...");
        }).on("error", async (req: IRequest, res: IResponse, err: any) => {
            if (res.isAlive) {
                res.status(200).type("text").send((err instanceof Error) ? err.message : `Error occured ${err}`);
            }
            await xapp.shutdown();
            console.log("Error handle done...");
            expect(err).toBeInstanceOf(Error);
            console.log(err.message);
            done();
        }).listen(8088, () => {
            agent.get(`http://localhost:8088/throw-error`)
                .end((err, res) => {
                    console.log("No way");
                });
        });
    });
    it("throw application already listen", (done: Mocha.Done): void => {
        app.listen(appUtility.port, () => {
            expect(shouldBeError(() => {
                app.listen(appUtility.port);
            })).toBeInstanceOf(Error);
            // await app.shutdown();
            appIsLestening = true;
            done();
        });
    });
});
describe("cwserver-router", () => {
    it("router validation", (done: Mocha.Done): void => {
        expect(shouldBeError(() => {
            getRouteMatcher("/nobody/");
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            getRouteMatcher("/*/nobody/*");
        })).toBeInstanceOf(Error);
        expect(getRouteMatcher("/nobody/*").replace("/nobody/*")).toBeDefined();
        expect(shouldBeError(() => {
            getRouteMatcher("/nobody/*/:id");
        })).toBeInstanceOf(Error);
        const router: ILayerInfo<string>[] = [];
        expect(getRouteInfo("", router, "ANY")).toBeUndefined();
        router.push({
            method: "GET",
            handler: "",
            route: "/test/*",
            pathArray: "/test/*".split("/"),
            routeMatcher: getRouteMatcher("/test/*")
        });
        expect(getRouteInfo("", router, "ANY")).toBeUndefined();
        router.push({
            method: "GET",
            handler: "",
            route: "/vertual/*",
            pathArray: [],
            routeMatcher: void 0
        });
        expect(getRouteInfo("/vertual/test/body", router, "GET")).toBeUndefined();
        router.length = 0;
        router.push({
            method: "GET",
            handler: "",
            route: "/test/:id/zoo/ticket/*",
            pathArray: "/test/:id/zoo/ticket/*".split("/"),
            routeMatcher: getRouteMatcher("/test/:id/zoo/ticket/*")
        });
        expect(getRouteInfo("/test/1/zoo/ticket/nothing/todo", router, "GET")).toBeDefined();
        expect(pathToArray("/vertual/test/body", [])).not.toBeInstanceOf(Error);
        expect(pathToArray("dfa/", [])).not.toBeInstanceOf(Error);
        done();
    });
    it('test route target /task/:id/*', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/task/1/test_request/next`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body).toBeInstanceOf(Object);
                expect(res.body.servedFrom).toEqual('/task/:id/*');
                expect(res.body.q.query).toBeInstanceOf(Object);
                expect(res.body.q.query.id).toEqual("1");
                expect(res.body.q.match).toBeInstanceOf(Array);
                expect(res.body.q.match.indexOf("test_request")).toBeGreaterThan(-1);
                done();
            });
    });
    it('test route target /dist/*', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/dist/`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body).toBeInstanceOf(Object);
                expect(res.body.servedFrom).toEqual('/dist/*');
                done();
            });
    });
    it('test route target /user/:id/settings', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/user/10/settings/100`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('should be 404 route target /test-c/:id', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-c/10/df/a`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('should be 404 target route /test-c/:id not match', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-c/`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('target route /*', (done: Mocha.Done): void => {
        const route: string = "/*";
        appUtility.controller.any(route, (ctx: IContext, routeParam?: IRequestParam) => {
            return ctx.res.json({ reqPath: ctx.path, servedFrom: "/*", q: routeParam });
        });
        appUtility.controller.sort();
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-c/zxy`)
            .end((err, res) => {
                expect(appUtility.controller.remove(route)).toEqual(true);
                expect(appUtility.controller.remove("/_NOP_/")).toEqual(false);
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.body.servedFrom).toEqual('/*');
                done();
            });
    });
    it('test route target /test-any/*', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-any/param/go`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body).toBeInstanceOf(Object);
                expect(res.body.servedFrom).toEqual('/test-any/*');
                expect(res.body.q.query).toBeInstanceOf(Object);
                expect(res.body.q.match).toBeInstanceOf(Array);
                expect(res.body.q.match.indexOf("param")).toBeGreaterThan(-1);
                done();
            });
    });
    it("test head", (done: Mocha.Done): void => {
        getAgent()
            .head(`http://localhost:${appUtility.port}/test-head`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                done();
            });
    });
    it('pass `x-requested-with:XMLHttpRequest`', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/post`)
            .query(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
            .set('x-requested-with', 'XMLHttpRequest')
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
});
describe("cwserver-view", () => {
    it('register view', (done: Mocha.Done): void => {
        const invoke = (ctx: IContext) => {
            ctx.res.writeHead(200, {
                "Content-Type": "text/plain"
            });
            ctx.res.end("Hello test-controller");
            return ctx.next(200);
        };
        appUtility.controller.get("/test-controller", invoke)
            .post("/test-controller", invoke)
            .any("/any-controller", invoke);
        expect(shouldBeError(() => {
            appUtility.controller.get("/test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            appUtility.controller.post("/test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            appUtility.controller.post("/any-controller", invoke);
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            appUtility.controller.any("/test-controller", invoke);
        })).toBeInstanceOf(Error);
        appUtility.controller.get("/get-test-controller", invoke)
            .post("/post-test-controller", invoke);
        expect(shouldBeError(() => {
            appUtility.controller.get("/get-test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            appUtility.controller.post("/post-test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            appUtility.controller.any("/get-test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            appUtility.controller.any("/post-test-controller", invoke);
        })).toBeInstanceOf(Error);
        appUtility.controller.any("/any-test-controller", invoke);
        expect(shouldBeError(() => {
            appUtility.controller.any("/any-test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            appUtility.controller.get("/any-test-controller", invoke);
        })).toBeInstanceOf(Error);
        done();
    });
    it('should throw error (After initilize view, you should not register new veiw)', (done: Mocha.Done): void => {
        expect(shouldBeError(() => {
            // tslint:disable-next-line: no-empty
            global.sow.server.on("register-view", (_app, controller, server) => { });
        })).toBeInstanceOf(Error);
        done();
    });
});
describe("cwserver-session", () => {
    const loginId = "rajib";
    it('authenticate-request', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/authenticate`)
            .query({ loginId })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.header["set-cookie"]).toBeDefined();
                expect(res.body).toBeInstanceOf(Object);
                expect(res.body.userInfo).toBeInstanceOf(Object);
                expect(res.body.userInfo.loginId).toEqual(loginId);
                expect(res.body.hash).toEqual(cwserver.Encryption.toMd5(loginId));
                authCookies = res.header["set-cookie"];
                expect(authCookies).toBeInstanceOf(Array);
                done();
            });
    });
    it('should-be-user-authenticated', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/is-authenticate`)
            .query({ loginId })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body).toBeInstanceOf(Object);
                expect(res.body.loginId).toEqual(loginId);
                expect(res.body.userData).toBeDefined();
                done();
            });
    });
    it('authenticated-user-should-be-redirect-to-home', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/authenticate`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.redirects.length).toEqual(1); // should be redirect home page
                expect(res.redirects.indexOf(`http://localhost:${appUtility.port}/`)).toBeGreaterThan(-1);
                done();
            });
    });
});
describe("cwserver-get", () => {
    it('send get request to application', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeTextHtml(res.header["content-type"]);
                done();
            });
    });
    it('test applicaton cookie', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/cookie`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                const cook: string[] = res.get("Set-Cookie");
                expect(cook.length).toBeGreaterThan(3);
                done();
            });
    });
    it('try to access config.hiddenDirectory', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/lib/`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('try to access $root', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/$root/`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('get-raw-file', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/get-file`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                done();
            });
    });
    it('redirect request to controller', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/redirect`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.redirects.length).toEqual(1); // should be redirect home page
                expect(res.redirects.indexOf(`http://localhost:${appUtility.port}/`)).toBeGreaterThan(-1);
                done();
            });
    });
    it('test context', function (done: Mocha.Done): void {
        this.timeout(5000);
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-context`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body).toBeInstanceOf(Object);
                expect(res.body.done).toBeTruthy();
                process.env.TASK_TYPE = 'TEST';
                done();
            });
    });
});
describe("cwserver-template-engine", () => {
    it('should served from server mem cache', (done: Mocha.Done): void => {
        const old = Util.clone(appUtility.server.config.template);
        appUtility.server.config.template.cacheType = "MEM";
        appUtility.server.config.template.cache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
                Util.extend(appUtility.server.config.template, old);
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeTextHtml(res.header["content-type"]);
                done();
            });
    });
    it('should served from server non-template and no cache', (done: Mocha.Done): void => {
        const old = Util.clone(appUtility.server.config.template);
        appUtility.server.config.template.cacheType = "MEM";
        appUtility.server.config.template.cache = false;
        const filePath: string = appUtility.server.mapPath("/no_template.html");
        expect(fs.existsSync(filePath)).toEqual(false);
        fs.writeFileSync(filePath, "<h1>Hello World</h1>");
        expect(fs.existsSync(filePath)).toEqual(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/no_template`)
            .end((err, res) => {
                Util.extend(appUtility.server.config.template, old);
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("text/html; charset=UTF-8");
                done();
            });
    });
    it('should throw template runtime error', (done: Mocha.Done): void => {
        const filePath: string = appUtility.server.mapPath("/test.html");
        expect(fs.existsSync(filePath)).toEqual(false);
        fs.writeFileSync(filePath, "{% ctx.server.transferRequest(); %}");
        expect(fs.existsSync(filePath)).toEqual(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/test`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                toBeTextHtml(res.header["content-type"]);
                fs.unlinkSync(filePath);
                done();
            });
    });
    it('should template response as gzip', (done: Mocha.Done): void => {
        const filePath: string = appUtility.server.mapPath("/test.html");
        expect(fs.existsSync(filePath)).toEqual(false);
        fs.writeFileSync(filePath, "{% isCompressed = true; %}\r\nHello world...");
        expect(fs.existsSync(filePath)).toEqual(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/test`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeTextHtml(res.header["content-type"]);
                expect(res.header["content-encoding"]).toBe("gzip");
                fs.unlinkSync(filePath);
                done();
            });
    });
    it('send get request should be 404 response config.defaultExt = .html', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/index.html`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                toBeTextHtml(res.header["content-type"]);
                done();
            });
    });
    it('send get request should be 404 response', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/ksdafsfasbd`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                toBeTextHtml(res.header["content-type"]);
                done();
            });
    });
    it('send get request should be 200 response', (done: Mocha.Done): void => {
        const defaultExt = appUtility.server.config.defaultExt;
        appUtility.server.config.defaultExt = "";
        getAgent()
            .get(`http://localhost:${appUtility.port}/index.html`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeTextHtml(res.header["content-type"]);
                appUtility.server.config.defaultExt = defaultExt;
                done();
            });
    });
    let templateConf: { [x: string]: any; } | void;
    it('route `/` then should use config.defaultDoc and create template cache', (done: Mocha.Done): void => {
        templateConf = Util.clone(appUtility.server.config.template);
        appUtility.server.config.template.cache = true;
        appUtility.server.config.template.cacheType = "FILE";
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeTextHtml(res.header["content-type"]);
                done();
            });
    });
    it('should be served from template cache', (done: Mocha.Done): void => {
        expect(Util.isPlainObject(templateConf)).toBe(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
                if (templateConf) {
                    Util.extend(appUtility.server.config.template, templateConf);
                }
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeTextHtml(res.header["content-type"]);
                done();
            });
    });
    it('should be template engine define file has been change', function (done: Mocha.Done): void {
        this.timeout(5000);
        appUtility.server.config.template.cache = true;
        appUtility.server.config.template.cacheType = "FILE";
        const indexPath: string = appUtility.server.mapPath("/index.html");
        return fs.readFile(indexPath, "utf8", (rerr: NodeJS.ErrnoException | null, data: string): void => {
            setTimeout(() => {
                return fs.writeFile(indexPath, `\r\n${data}\r\n`, (werr: NodeJS.ErrnoException | null) => {
                    getAgent()
                        .get(`http://localhost:${appUtility.port}/`)
                        .end((err, res) => {
                            expect(err).not.toBeInstanceOf(Error);
                            expect(res.status).toBe(200);
                            toBeTextHtml(res.header["content-type"]);
                            done();
                        });
                });
            }, 200);
        });
    });
    it('test template utility', function (done: Mocha.Done): void {
        this.timeout(5000);
        expect(TemplateCore.isScriptTemplate("")).toBe(false);
        expect(shouldBeError(() => {
            templateNext(Object.create(null), Object.create(null));
        })).toBeInstanceOf(Error);
        TemplateCore.compile(void 0, (params: CompilerResult): void => {
            expect(params.err).toBeInstanceOf(Error);
        });
        const filePath: string = path.resolve(`${appRoot}/${projectRoot}/template/invalid.html`);
        const tasks: (() => void)[] = [];
        const forward = (): void => {
            const nextFunc: (() => void) | undefined = tasks.shift();
            if (!nextFunc) {
                if (fs.existsSync(filePath))
                    fs.unlinkSync(filePath);
                return done();
            }
            return nextFunc();
        };
        const ctx: IContext = appUtility.server.createContext(Object.create({ id: Util.guid(), path: "/myfle.html" }), Object.create(null), (err?: any): void => {
            expect(err).not.toBeInstanceOf(Error);
        });
        ctx.handleError = (err: NodeJS.ErrnoException | Error | null | undefined, next: () => void): void => {
            if (Util.isError(err)) {
                return forward();
            }
            return next();
        }
        ctx.transferError = (err: NodeJS.ErrnoException | Error): void => {
            return forward();
        }
        const spublic: string = appUtility.server.getPublic();
        tasks.push(() => {
            TemplateCore.run(ctx, spublic, `#extends /template/readme.htmls\r\n<impl-placeholder id>\r\nNO\r\n\n</impl-placeholder>`, (params: CompilerResult): void => {
                return forward();
            });
        });
        tasks.push(() => {
            TemplateCore.run(ctx, spublic, `#attach /template/readme.html\r\n#attach /template/readme.html\n`, (params: CompilerResult): void => {
                expect(params.str).toBeDefined();
                return forward();
            });
        });
        tasks.push(() => {
            TemplateCore.run(ctx, spublic, `#attach invalid_attach`, (params: CompilerResult): void => {
                expect(params.str).toBeDefined();
                return forward();
            });
        });
        tasks.push(() => {
            TemplateCore.run(ctx, spublic, `#extends \r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params: CompilerResult) => {
                return forward();
            });
        });
        tasks.push(() => {
            TemplateCore.run(ctx, spublic, `#attach /template/readme.htmls \r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params: CompilerResult) => {
                return forward();
            });
        });
        tasks.push(() => {
            fs.writeFileSync(filePath, "INVALID_FILE");
            TemplateCore.run(ctx, spublic, `#extends /template/invalid.html\r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params: CompilerResult) => {
                return forward();
            });
        });
        tasks.push(() => {
            fs.writeFileSync(filePath, "<placeholder id><placeholder/>");
            TemplateCore.run(ctx, spublic, `#extends /template/invalid.html\r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params: CompilerResult) => {
                return forward();
            });
        });
        tasks.push(() => {
            fs.writeFileSync(filePath, '<placeholder id=""><placeholder/>');
            TemplateCore.run(ctx, spublic, `#extends /template/invalid.html\r\n<impl-placeholder id>\r\nNO\r\n</impl-placeholder>`, (params: CompilerResult) => {
                return forward();
            });
        });
        tasks.push(() => {
            TemplateCore.run(ctx, spublic, `/*{%*/var xy = 0;/*%}*/\n/*{%*/\nvar xy = 0;\n/*%}*/\n   <!--{%-->var xy = 0;<!--%}-->\n<!--{%-->\nvar xy = 0;\n<!--%}-->`, (params: CompilerResult) => {
                return forward();
            });
        });
        tasks.push(() => {
            fs.writeFileSync(filePath, '<placeholder id="test">\r\n</placeholder><script runat="template-engine">\r\nvar xy = 0;\r\n</script>{% ERROR %} {= NOPX =}\r\n\r\n\r\n');
            TemplateCore.run(ctx, spublic, `#extends /template/invalid.html\r\n<impl-placeholder id="test">\r\nNO\r\n</impl-placeholder>`, (params: CompilerResult) => {
                return forward();
            });
        });
        return forward();
    });
});
describe("cwserver-bundler", () => {
    let eTag: string = "";
    let lastModified: string = "";
    it('js file bundler with gizp response (server file cache)', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                    $virtual_vtest/socket-client.js,
                    static/script/test-1.js,
                    static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
                expect(res.header["content-encoding"]).toBe("gzip");
                expect(res.header.etag).not.toBeUndefined();
                expect(res.header["last-modified"]).toBeDefined();
                lastModified = res.header['last-modified'];
                eTag = res.header.etag;
                done();
            });
    });
    it('bundler should compair if-modified-since header and send 304 (server file cache)', (() => {
        const sendReq = (done: Mocha.Done, tryCount: number): void => {
            if (tryCount > 0) {
                console.log(`Try Count: ${tryCount} and if-modified-since: ${lastModified}`);
            }
            createRequest("GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-modified-since")
                .set("if-modified-since", lastModified)
                .query({
                    g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                    ),
                    ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
                })
                .end((err, res) => {
                    if (!Util.isError(err) && tryCount === 0) {
                        return setTimeout(() => {
                            tryCount++;
                            return sendReq(done, tryCount);
                        }, 300), void 0;
                    }
                    expect(err).toBeInstanceOf(Error);
                    expect(res.status).toBe(304);
                    expect(res.header["x-server-revalidate"]).toBe("true");
                    return done();
                });
        };
        return (done: Mocha.Done): void => {
            expect(lastModified.length).toBeGreaterThan(0);
            return sendReq(done, 0);
        };
    })());
    it('bundler should compair if-none-match and send 304 (server file cache)', (() => {
        const sendReq = (done: Mocha.Done, tryCount: number): void => {
            if (tryCount > 0) {
                console.log(`Try Count: ${tryCount} and if-none-match: ${eTag}`);
            }
            createRequest("GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-none-match")
                .set("if-none-match", eTag)
                .query({
                    g: appUtility.server.createBundle(`
					    $virtual_vtest/socket-client.js,
					    static/script/test-1.js,
					    static/script/test-2.js|__owner__`
                    ),
                    ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
                })
                .end((err, res) => {
                    if (!Util.isError(err) && tryCount === 0) {
                        return setTimeout(() => {
                            tryCount++;
                            return sendReq(done, tryCount);
                        }, 300), void 0;
                    }
                    expect(err).toBeInstanceOf(Error);
                    expect(res.status).toBe(304);
                    expect(res.header["x-server-revalidate"]).toBe("true");
                    return done();
                });
        };
        return (done: Mocha.Done): void => {
            expect(eTag.length).toBeGreaterThan(0);
            return sendReq(done, 0);
        };
    })());
    it('js file bundler with gizp response (no server cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = false;
        appUtility.server.config.bundler.compress = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                    $virtual_vtest/socket-client.js,
                    static/script/test-1.js,
                    static/script/test-2.js|__owner__`
                ),
                ck: "bundle_no_cache_js", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toEqual(200);
                expect(res.header["content-type"]).toEqual("application/x-javascript; charset=utf-8");
                expect(res.header["content-encoding"]).toEqual("gzip");
                expect(res.header["last-modified"]).toBeDefined();
                lastModified = res.header['last-modified'];
                done();
            });
    });
    (() => {
        const sendReq = (done: Mocha.Done, tryCount: number): void => {
            if (tryCount > 0) {
                console.log(`Try Count: ${tryCount} and if-modified-since: ${lastModified}`);
            }
            createRequest("GET", `http://localhost:${appUtility.port}/app/api/bundle/`, "if-modified-since")
                .set("if-modified-since", lastModified)
                .query({
                    g: appUtility.server.createBundle(`
						$virtual_vtest/socket-client.js,
						static/script/test-1.js,
						static/script/test-2.js|__owner__`
                    ),
                    ck: "bundle_no_cache_js", ct: "text/javascript", rc: "Y"
                })
                .end((err, res) => {
                    if (!Util.isError(err) && tryCount === 0) {
                        return setTimeout(() => {
                            tryCount++;
                            return sendReq(done, tryCount);
                        }, 300), void 0;
                    }
                    try {
                        expect(err).toBeInstanceOf(Error);
                    } catch (e) {
                        console.log(e);
                        console.log(err);
                        console.log(typeof (err));
                        throw e;
                    }
                    expect(res.status).toEqual(304);
                    expect(res.header["x-server-revalidate"]).toEqual("true");
                    return done();
                });
        };
        it("bundler should compair if-modified-since header and send 304 (no server cache)", function (done: Mocha.Done): void {
            this.timeout(5000);
            expect(lastModified.length).toBeGreaterThan(0);
            appUtility.server.config.bundler.fileCache = false;
            appUtility.server.config.bundler.compress = true;
            setTimeout(() => {
                sendReq(done, 0);
            }, 300);
            return void 0;
        });
    })();
    it('js file bundler not gizp response (no server cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.compress = false;
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
                expect(res.header["content-encoding"]).toBeUndefined();
                done();
            });
    });
    it('css file bundler with gizp response (server file cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = true;
        appUtility.server.config.bundler.compress = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                       static/css/test-1.css,
                       static/css/test-2.css|__owner__`
                ),
                ck: "bundle_test_css", ct: "text/css", rc: "Y"
            })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("text/css");
                expect(res.header["content-encoding"]).toBe("gzip");
                expect(res.header.etag).not.toBeUndefined();
                expect(res.header["last-modified"]).not.toBeUndefined();
                done();
            });
    });
    it('css file bundler test gzip (server file cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = true;
        appUtility.server.config.bundler.compress = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                       static/css/test-1.css,
                       static/css/test-2.css|__owner__`
                ),
                ck: "bundle_test_css", ct: "text/css", rc: "Y"
            })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("text/css");
                expect(res.header["content-encoding"]).toBe("gzip");
                expect(res.header.etag).not.toBeUndefined();
                expect(res.header["last-modified"]).not.toBeUndefined();
                done();
            });
    });
    it('js file bundler not gizp response (server cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.compress = false;
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                    $virtual_vtest/socket-client.js,
                    static/script/test-1.js`
                ),
                ck: "bundle_no_zip", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
                expect(res.header["content-encoding"]).toBeUndefined();
                done();
            });
    });
});
describe("cwserver-bundler-error", () => {
    it('bundler should be virtual file error (server cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                    $virtual_vtest/xsocket-client.js,
                    $root/$public/static/script/test-1.js,
                    $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                done();
            });
    });
    it('bundler should be virtual error', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                        $virtual_xvtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                done();
            });
    });
    it('bundler should be unsupported content type error  (server cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = true;
        appUtility.server.config.bundler.enable = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/plain", rc: "Y"
            })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('bundler should be unsupported content type error  (no server cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/plain", rc: "Y"
            })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('bundler should be path parse error', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        $rootx/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                done();
            });
    });
    it('bundler should be encryption error', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: `$virtual_vtest/socket-client.js`,
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('bundler should be error (no param (no cache))', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('bundler should be error (no param (server cache))', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('bundler should be encryption error (server cache)', (done: Mocha.Done): void => {
        appUtility.server.config.bundler.fileCache = true;
        getAgent()
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .query({
                g: `$virtual_vtest/socket-client.js`,
                ck: "bundle_test_jsx", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('bundler should be skip invalid if-modified-since header and send 200', (done: Mocha.Done): void => {
        request
            .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
            .set("if-modified-since", `AAAZZZ`)
            .query({
                g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        static/script/test-1.js,
                        static/script/test-2.js|__owner__`
                ),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
                done();
            });
    });
});
describe("cwserver-post", () => {
    it('send post request content type application/json', (done: Mocha.Done): void => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post`)
            .send(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
            .set('Content-Type', 'application/json')
            .set('User-Agent', "Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.68 Mobile Safari/537.36 Edg/84.0.522.28")
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body.name).toBe('rajibs');
                done();
            });
    });
    it('send post request unknown content type application/jsons', (done: Mocha.Done): void => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post?task=ERROR`)
            .set('User-Agent', "Mozilla/5.0 (iPad; CPU OS 11_0 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/11.0 Mobile/15A5341f Safari/604.1 Edg/84.0.4147.68")
            .send(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
            .set('Content-Type', 'application/jsons')
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body.error).toBe(true);
                done();
            });
    });
    it('send post request content exceed max length', function (done: Mocha.Done): void {
        this.timeout(5000);
        const largeBuff: Buffer = crypto.randomBytes(1024 * 5);
        getAgent()
            .post(`http://localhost:${appUtility.port}/post-data`)
            .type('form')
            .send({
                name: 'rajibs',
                occupation: 'kutukutu',
                large: largeBuff.toString('hex')
            })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                done();
            });
    });
    it('send post request content type urlencoded', function (done: Mocha.Done): void {
        this.timeout(10000);
        getAgent()
            .post(`http://localhost:${appUtility.port}/post-test-data`)
            .type('form')
            .send({
                name: 'rajibs',
                occupation: 'kutukutu',
                data: "Hello world Not Working".repeat(10)
            })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                // expect( res.body.name ).toBe( 'rajibs' );
                done();
            });
    });
    it('send post request to async handler', (done: Mocha.Done): void => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post-async/10`)
            .type('form')
            .send({ name: 'rajibs', occupation: 'kutukutu', kv: '' })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeTextHtml(res.header["content-type"]);
                done();
            });
    });
    it('should post request not found', (done: Mocha.Done): void => {
        getAgent()
            .post(`http://localhost:${appUtility.port}/post/invalid-route`)
            .send(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
            .set('Content-Type', 'application/json')
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
});
describe("cwserver-multipart-body-parser", () => {
    it('multipart-file-skip-test', function (done: Mocha.Done) {
        this.timeout(5000);
        const req: request.SuperAgentRequest = getAgent()
            .post(`http://localhost:${appUtility.port}/upload-skip`);
        const readStream1 = fs.createReadStream(path.resolve(`./schema.json`));
        const readStream2 = fs.createReadStream(path.resolve(`./index.ts`));
        req.field('post-file', readStream1)
            .field('post-file_2', readStream2);
        req.end((err, res) => {
            readStream1.close(); readStream2.close();
            expect(err).not.toBeInstanceOf(Error);
            expect(res.status).toBe(200);
            toBeApplicationJson(res.header["content-type"]);
            done();
        });
    });
    const processReq = (done: Mocha.Done, saveto?: string, reqPath?: string): void => {
        let fileName = "";
        let filePath = "";
        let contentType = "";
        if (process.env.SCRIPT === "TS") {
            fileName = "schema.json";
            contentType = "application/json";
            filePath = path.resolve(`./${fileName}`);
        } else {
            fileName = "module.spec.js";
            contentType = "application/javascript";
            filePath = path.resolve(`./dist/test/${fileName}`);
        }
        const readStream = fs.createReadStream(filePath);
        const req: request.SuperAgentRequest = getAgent()
            .post(`http://localhost:${appUtility.port}${reqPath || "/upload"}`)
            .field("name", contentType)
            .field("cname", contentType)
            .query({ saveto });
        if (!reqPath) {
            req.field('post-file', readStream)
                .field('post-file_2', readStream)
                .field('post-file_3', readStream);
        } else {
            req.field('post-file', readStream);
        }
        req.end((err, res) => {
            readStream.close();
            expect(err).not.toBeInstanceOf(Error);
            expect(res.status).toBe(200);
            toBeApplicationJson(res.header["content-type"]);
            expect(res.body).toBeInstanceOf(Object);
            expect(res.body.contentType).toBe(contentType);
            expect(res.body.fileName).toBe(fileName);
            expect(String(res.body.name).indexOf("post-file")).toBeGreaterThan(-1);
            done();
        });
    }
    it('should post multipart post file', (done: Mocha.Done): void => {
        processReq(done);
    });
    it('should post multipart post file and save as bulk', (done: Mocha.Done): void => {
        processReq(done, "true");
    });
    it('test multipart post file and clear', (done: Mocha.Done): void => {
        processReq(done, "C");
    });
    it('test multipart post file process non-bolock', (done: Mocha.Done): void => {
        processReq(done, undefined, "/upload-non-bolock");
    });
    it('invalid multipart posted file', function (done: Mocha.Done): void {
        this.timeout(5000 * 10);
        const tempz: string = appUtility.server.mapPath(`/web/${Math.floor((0x999 + Math.random()) * 0x10000000)}.tempz`);
        fs.writeFile(tempz, Buffer.from("This is normal line\n".repeat(5)), (err: NodeJS.ErrnoException | null): void => {
            setTimeout(() => {
                const readStream = fs.createReadStream(tempz);
                const req: request.SuperAgentRequest = getAgent()
                    .post(`http://localhost:${appUtility.port}/upload-invalid-file`)
                    .attach('post-file', readStream, {
                        contentType: " ",
                        filename: "temp"
                    });
                req.end((rerr, res) => {
                    readStream.close();
                    expect(rerr).toBeInstanceOf(Error);
                    done();
                });
            }, 100);
        });
    });
    it('invalid multipart posted file name', function (done: Mocha.Done): void {
        this.timeout(5000 * 10);
        const tempz: string = appUtility.server.mapPath(`/web/${Math.floor((0x999 + Math.random()) * 0x10000000)}.tempz`);
        fs.writeFile(tempz, Buffer.from("This is normal line\n".repeat(5)), (err: NodeJS.ErrnoException | null): void => {
            setTimeout(() => {
                const readStream = fs.createReadStream(tempz);
                const req: request.SuperAgentRequest = getAgent()
                    .post(`http://localhost:${appUtility.port}/upload-invalid-file`)
                    .attach('post-file', readStream, {
                        filename: " "
                    });
                req.end((rerr, res) => {
                    readStream.close();
                    expect(rerr).toBeInstanceOf(Error);
                    done();
                });
            }, 100);
        });
    });
    it('test multipart post file', function (done: Mocha.Done): void {
        this.timeout(5000 * 10);
        const leargeFile: string = appUtility.server.mapPath("/web/learge.txt");
        const writer: fs.WriteStream = fs.createWriteStream(leargeFile);
        writer.on("open", (fd) => {
            let size: number = 0;
            const buff: Buffer = Buffer.from("This is normal line\n".repeat(5));
            function write(wdone: () => void) {
                function swrite() {
                    while (true) {
                        size += buff.byteLength;
                        const ok: boolean = writer.write(buff);
                        //console.log(`Buff->${size}`);
                        if (size >= (16400 + 200)) {
                            writer.end('Goodbye\n');
                            return wdone();
                        }
                        if (!ok) {
                            writer.once("drain", swrite);
                            break;
                        }
                    }
                }
                return swrite();
            }
            writer.on("close", () => {
                console.log("writer.on->close..fire..done");
                setTimeout(() => {
                    const readStream = fs.createReadStream(leargeFile);
                    getAgent()
                        .post(`http://localhost:${appUtility.port}/upload-test`)
                        .field('post-file', readStream)
                        .end((err, res) => {
                            readStream.close();
                            if (err) {
                                console.log(err);
                            }
                            expect(err).not.toBeInstanceOf(Error);
                            expect(res.status).toBe(200);
                            toBeApplicationJson(res.header["content-type"]);
                            expect(res.body).toBeInstanceOf(Object);
                            expect(res.body.name).toBe("post-file");
                            done();
                        });
                }, 100);
            });
            write(() => { console.log("write..done"); });
        });
    });
    it('test multipart post file abort test', function (done: Mocha.Done): void {
        this.timeout(5000 * 10);
        const leargeFile: string = appUtility.server.mapPath("/web/large.bin");
        let size: number = 0;
        const writer: fs.WriteStream = fs.createWriteStream(leargeFile);
        function write(toSize: number, wdone: () => void) {
            function swrite() {
                while (true) {
                    const buff: Buffer = crypto.randomBytes(1024 * 1024);
                    size += buff.byteLength;
                    const ok: boolean = writer.write(buff);
                    if (size >= toSize) {
                        writer.end();
                        return wdone();
                    }
                    if (!ok) {
                        writer.once("drain", swrite);
                        break;
                    }
                }
            }
            return swrite();
        }
        let isAbort: boolean = false;
        write(5 * 1024 * 1024, () => {
            const readStream = fs.createReadStream(leargeFile);
            const req: request.SuperAgentRequest = getAgent()
                .post(`http://localhost:${appUtility.port}/abort-error`)
                .field('post-file', readStream)
                ;
            req.on("progress", (event) => {
                if (isAbort) return;
                if (event.total) {
                    if (event.loaded >= (event.total / 3)) {
                        isAbort = true;
                        setTimeout(() => {
                            readStream.close();
                            req.abort();
                            done();
                        }, 0);
                    }
                }
            });
            req.end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
            });
        });
    });
});
describe("cwserver-gzip-response", () => {
    it('should be response type gzip', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/response`)
            .query({ task: "gzip", data: JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }) })
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-encoding"]).toBe("gzip");
                done();
            });
    });
    it('response should be pass error', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-response-error`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                done();
            });
    });
});
describe("cwserver-mime-type", () => {
    it('served static file no cache', (done: Mocha.Done): void => {
        const old = appUtility.server.config.liveStream;
        appUtility.server.config.liveStream = [];
        getAgent()
            .get(`http://localhost:${appUtility.port}/static-file/test.mp3`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("audio/mpeg");
                expect(res.header["content-length"]).toBeDefined();
                appUtility.server.config.liveStream = old;
                done();
            });
    });
    let eTag: string = "";
    let lastModified: string = "";
    it('should be mime type encoding gzip', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header.etag).toBeDefined();
                expect(res.header['last-modified']).toBeDefined();
                lastModified = res.header['last-modified'];
                eTag = res.header.etag;
                expect(res.header["content-type"]).toBe("image/png");
                expect(res.header["content-encoding"]).toBe("gzip");
                done();
            });
    });
    it('should be mime type if-none-match', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .set("if-none-match", eTag)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(304);
                expect(res.header["x-server-revalidate"]).toBe("true");
                done();
            });
    });
    it('should be mime type if-modified-since', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .set("if-modified-since", lastModified)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(304);
                expect(res.header["x-server-revalidate"]).toBe("true");
                done();
            });
    });
    it('should be mime type not found', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logos.png`)
            .set("if-modified-since", lastModified)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('unsupported mime type', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.zip`)
            .set("if-modified-since", lastModified)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('should be served from file (no server file cache)', (done: Mocha.Done): void => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .end((err, res) => {
                appUtility.server.config.staticFile.fileCache = oldfileCache;
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header.etag).toBeDefined();
                expect(res.header['last-modified']).toBeDefined();
                lastModified = res.header['last-modified'];
                eTag = res.header.etag;
                expect(res.header["content-type"]).toBe("image/png");
                expect(res.header["content-encoding"]).toBe("gzip");
                done();
            });
    });
    it('should be gzip response & served from file (no server file cache)', (done: Mocha.Done): void => {
        const oldValue = Util.clone(appUtility.server.config.staticFile);
        appUtility.server.config.staticFile.fileCache = false;
        appUtility.server.config.staticFile.compression = true;
        const filePath: string = appUtility.server.mapPath("/test.pdf");
        expect(fs.existsSync(filePath)).toEqual(false);
        fs.writeFileSync(filePath, "<h1>Hello World</h1>");
        expect(fs.existsSync(filePath)).toEqual(true);
        getAgent()
            .get(`http://localhost:${appUtility.port}/test.pdf`)
            .end((err, res) => {
                Util.extend(appUtility.server.config.staticFile, oldValue);
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("application/pdf");
                expect(res.header["content-encoding"]).toBe("gzip");
                done();
            });
    });
    it('should be mime type if-none-match (no server file cache)', (done: Mocha.Done): void => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        getAgent()
            .get(`http://localhost:${appUtility.port}/logo/logo.png`)
            .set("if-none-match", eTag)
            .end((err, res) => {
                appUtility.server.config.staticFile.fileCache = oldfileCache;
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(304);
                expect(res.header["x-server-revalidate"]).toBe("true");
                done();
            });
    });
    it('should be favicon.ico 200', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/favicon.ico`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("image/x-icon");
                done();
            });
    });
});
describe("cwserver-virtual-dir", () => {
    it('check-virtual-dir-server-manage', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-virtual/socket-client.js`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJavaScript(res.header["content-type"]);
                expect(res.header["content-encoding"]).toBe("gzip");
                done();
            });
    });
    it('check-virtual-dir-mimeType-404', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/test-virtual/socket-client.jsx`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('check-virtual-dir-handler', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/vtest/socket-client.js`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJavaScript(res.header["content-type"]);
                expect(res.header["content-encoding"]).toBe("gzip");
                done();
            });
    });
});
describe("cwserver-socket-io-implementation", () => {
    it('get ws-server-event', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/ws-server-event`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body).toBeInstanceOf(Object);
                expect(res.body.server).toBeInstanceOf(Array);
                expect(res.body.server.indexOf("test-msg")).toBeGreaterThan(-1);
                done();
            });
    });
    it('should be send n receive data over socket-io', (done: Mocha.Done): void => {
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
        socket.on('on-test-msg', (data: { name: any; }) => {
            socket.close();
            expect(data.name).toEqual('rajibs');
            done();
        });
    });
});
describe("cwserver-echo", () => {
    it('echo-server', (done: Mocha.Done): void => {
        const reqMd5 = cwserver.Encryption.toMd5("Test");
        const hex = cwserver.Encryption.utf8ToHex(reqMd5);
        getAgent()
            .post(`http://localhost:${appUtility.port}/echo`)
            .send(JSON.stringify({ hex }))
            .set('Content-Type', 'application/json')
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                toBeApplicationJson(res.header["content-type"]);
                expect(res.body.hex).toBeDefined();
                expect(res.body.hex).toEqual(hex);
                const resMd5 = cwserver.Encryption.hexToUtf8(res.body.hex);
                expect(resMd5).toEqual(reqMd5);
                done();
            });
    });
});
describe("cwserver-web-stream", () => {
    it('should-be-get-stream-request', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/web-stream/test.mp3`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.header["content-type"]).toBe("audio/mpeg");
                expect(res.header["content-length"]).toBeDefined();
                done();
            });
    });
    it('should-be-stream', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/web-stream/test.mp3`)
            .set("range", "bytes=0-")
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(206);// Partial Content
                expect(res.header["content-type"]).toBe("audio/mpeg");
                expect(res.header["content-range"]).toBeDefined();
                done();
            });
    });
});
describe("cwserver-error", () => {
    it('should be throw server error', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/app-error/`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                done();
            });
    });
    it('should be throw controller error', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/controller-error`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                done();
            });
    });
    it('should be pass server error', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/pass-error`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                done();
            });
    });
    it('try direct access error page with error code', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/404`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('app.use pass error to next', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/app-pass-error-to-next`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(500);
                done();
            });
    });
});
describe("cwserver-controller-reset", () => {
    it('signout request: connection should be redirect to home', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/signout`)
            .end((err, res) => {
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                expect(res.redirects.length).toEqual(1); // should be redirect home page
                expect(res.redirects.indexOf(`http://localhost:${appUtility.port}/`)).toBeGreaterThan(-1);
                done();
            });
    });
    it('config.defaultDoc', (done: Mocha.Done): void => {
        const defaultExt = appUtility.server.config.defaultExt;
        const defaultDoc = appUtility.server.config.defaultDoc;
        appUtility.server.config.defaultDoc = ["index.html", "default.html"];
        appUtility.server.config.defaultExt = "";
        getAgent()
            .get(`http://localhost:${appUtility.port}/`)
            .end((err, res) => {
                appUtility.server.config.defaultExt = defaultExt;
                appUtility.server.config.defaultDoc = defaultDoc;
                expect(err).not.toBeInstanceOf(Error);
                expect(res.status).toBe(200);
                done();
            });
    });
    it('should be route not found', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/app-errors`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('no controller found for put', (done: Mocha.Done): void => {
        getAgent()
            .delete(`http://localhost:${appUtility.port}/app-errors`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('should-be-reset-controller', (done: Mocha.Done): void => {
        expect(appUtility.controller.remove('/authenticate')).toEqual(true);
        expect(appUtility.controller.remove('/post')).toEqual(true);
        appUtility.controller.reset();
        done();
    });
    it('should-be-controller-error', (done: Mocha.Done): void => {
        getAgent()
            .get(`http://localhost:${appUtility.port}/response`)
            .query({ task: "gzip", data: JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }) })
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
    it('test-raw-error', (done: Mocha.Done): void => {
        app.clearHandler();
        getAgent()
            .get(`http://localhost:${appUtility.port}/response`)
            .end((err, res) => {
                expect(err).toBeInstanceOf(Error);
                expect(res.status).toBe(404);
                done();
            });
    });
});
describe("cwserver-utility", () => {
    const getConfig = (() => {
        const configFile: string = path.resolve(`${appRoot}/${projectRoot}/config/app.config.json`);
        let config: { [x: string]: any; } | void;
        return (): { [x: string]: any; } => {
            if (config) return Util.clone(config);
            const cjson = fsw.readJsonSync(configFile);
            if (cjson) {
                config = cjson;
            }
            if (config) return Util.clone(config);
            return {};
        }
    })();
    it("test-app-utility", function (done: Mocha.Done) {
        const slogger = new ShadowLogger();
        slogger.newLine()
        slogger.reset().writeToStream("");
        slogger.writeBuffer("Buffer Test...");
        slogger.flush();
        expect(Util.JSON.stringify("{}")).toBeDefined();
        expect(Util.JSON.parse({})).toBeDefined();
        expect(Util.JSON.parse('{INVALID_JSON}')).toBeUndefined();
        expect(shouldBeError(() => {
            appUtility.server.addMimeType("text", "text/plain");
        })).toBeInstanceOf(Error);
        expect(appUtility.server.addMimeType("tmpl", "text/plain")).not.toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            assert(false, "test");
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            assert("", "string");
        })).toBeInstanceOf(Error);
        (() => {
            process.env.SCRIPT = "JS";
            expect(shouldBeError(() => {
                readAppVersion();
            })).toBeInstanceOf(Error);
            process.env.SCRIPT = "TS";
            const parent = path.resolve(__dirname, '..');
            const absPath = path.resolve(`${parent}/package.json`);
            fs.renameSync(absPath, `${absPath}.bak`);
            fs.writeFileSync(absPath, "INVALID_JSON");
            expect(shouldBeError(() => {
                readAppVersion();
            })).toBeInstanceOf(Error);
            fs.unlinkSync(absPath);
            fs.renameSync(`${absPath}.bak`, absPath);
        })();
        (() => {
            const old = appUtility.server.config.session.cookie;
            appUtility.server.config.session.cookie = "";
            expect(shouldBeError(() => {
                appUtility.server.parseSession("");
            })).toBeInstanceOf(Error);
            appUtility.server.config.session.cookie = old;
            expect(appUtility.server.parseSession("").isAuthenticated).toBeFalsy();
            expect(appUtility.server.escape()).toBeDefined();
            expect(appUtility.server.pathToUrl(`/${projectRoot}/test.png`)).toBeDefined();
            expect(appUtility.server.pathToUrl(`${projectRoot}/test.png`)).toBeDefined();
            const oldPort: string | number = appUtility.server.config.hostInfo.port;
            appUtility.server.config.hostInfo.port = 0;
            const newConfig: { [x: string]: any; } = appUtility.server.config;
            expect(shouldBeError(() => {
                appUtility.server.implimentConfig(newConfig);
            })).toBeInstanceOf(Error);
            process.env.PORT = "8080";
            expect(shouldBeError(() => {
                appUtility.server.implimentConfig(newConfig);
            })).toBeInstanceOf(Error);
            appUtility.server.config.hostInfo.port = oldPort;
            appUtility.server.config.isDebug = false;
            appUtility.server.createLogger();
            appUtility.server.config.isDebug = true;
            delete process.env.IISNODE_VERSION;
            appUtility.server.createLogger();
            delete process.env.PORT;
            appUtility.server.createLogger();
        })();
        expect(shouldBeError(() => {
            HttpStatus.isErrorCode("adz");
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            HttpStatus.getDescription(45510);
        })).toBeInstanceOf(Error);
        expect(HttpStatus.fromPath("result", 200)).toEqual(200);
        expect(HttpStatus.fromPath("/result", 200)).toEqual(200);
        expect(HttpStatus.getResInfo("/result", 0).isValid).toEqual(false);
        expect(HttpStatus.isErrorFileName("404")).toBeTruthy();
        expect(HttpStatus.isErrorFileName("404_test")).toBeFalsy();
        expect(HttpStatus.isErrorFileName("201")).toBeFalsy();
        expect(HttpStatus.isErrorFileName("9077")).toBeFalsy();
        expect(HttpStatus.isValidCode(45510)).toEqual(false);
        expect(HttpStatus.statusCode).toBeInstanceOf(Object);
        expect(ToNumber(null)).toEqual(0);
        expect(ToResponseTime()).toBeDefined();
        expect(ToResponseTime(new Date("2020-01-01").getTime())).toBeDefined();
        expect(ToResponseTime(new Date("2020-01-05").getTime())).toBeDefined();
        expect(shouldBeError(() => {
            cwserver.Encryption.encrypt("nothing", {
                oldKey: "",
                key: void 0,
                iv: void 0
            });
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            cwserver.Encryption.decrypt("nothing", {
                oldKey: "",
                key: void 0,
                iv: void 0
            });
        })).toBeInstanceOf(Error);
        // fsw.compairFileSync("", "");
        expect(shouldBeError(() => {
            fsw.mkdirSync(logDir, "./");
        })).toBeInstanceOf(Error);
        expect(fsw.mkdirSync("")).toBeFalsy();
        expect(shouldBeError(() => {
            fsw.copyFileSync(`${logDir}/temp/`, "./");
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            fsw.copyFileSync(`${logDir}/temp/nofile.lg`, "./");
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            fsw.copyFileSync(`${logDir}/temp/nofile.lg`, `${logDir}/temp/nofile.lgx`);
        })).toBeInstanceOf(Error);
        expect(fsw.rmdirSync(`${logDir}/temp/`)).not.toBeInstanceOf(Error);
        expect(fsw.copyDirSync(`${logDir}/temp/`, `${logDir}/tempx/`)).not.toBeInstanceOf(Error);
        expect(fsw.mkdirSync(logDir)).toEqual(true);
        expect(shouldBeError(() => {
            Util.throwIfError(new Error("Error test..."));
        })).toBeInstanceOf(Error);
        expect(Util.extend({}, Session.prototype)).toBeInstanceOf(Object);
        expect(Util.extend({}, () => {
            return new Session();
        }, true)).toBeInstanceOf(Object);
        expect(Util.extend({}, { "__proto__": "__no_proto__", "constructor"() { return {}; } })).toBeInstanceOf(Object);
        expect(Util.extend({}, { "__proto__": "__no_proto__", "constructor"() { return {}; } }, true)).toBeInstanceOf(Object);
        expect(shouldBeError(() => {
            Util.extend("", {});
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            Util.extend("", {}, true);
        })).toBeInstanceOf(Error);
        expect(cwserver.Encryption.decrypt("", appUtility.server.config.encryptionKey)).toEqual("");
        const str = "TEST";
        const hex = cwserver.Encryption.utf8ToHex(str);
        expect(cwserver.Encryption.hexToUtf8(hex)).toEqual(str);
        const plainText = "rajib";
        let enc: string = appUtility.server.encryption.encrypt(plainText);
        expect(plainText).toEqual(appUtility.server.encryption.decrypt(enc));
        enc = appUtility.server.encryption.encryptToHex(plainText);
        expect(plainText).toEqual(appUtility.server.encryption.decryptFromHex(enc));
        enc = appUtility.server.encryption.encryptUri(plainText);
        expect(plainText).toEqual(appUtility.server.encryption.decryptUri(enc));
        (() => {
            const buff: IBufferArray = new BufferArray();
            buff.push("Hello world");
            buff.push(Buffer.from("Hello world"));
            expect(buff.toString("utf-8")).toBeDefined();
            expect(buff.data).toBeInstanceOf(Buffer);
            expect(buff.length).toBeGreaterThan(0);
            buff.dispose();
            expect(shouldBeError(() => {
                console.log(buff.length);
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                buff.push("Should be error");
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                console.log(buff.toString());
            })).toBeInstanceOf(Error);
            buff.dispose();
        })();
        (() => {
            fsw.moveFile(`${logDir}/temp/nofile.lg`, "./", (err: NodeJS.ErrnoException | null) => {
                expect(err).toBeInstanceOf(Error);
                const leargeFile: string = appUtility.server.mapPath("/web/large.bin");
                fsw.moveFile(leargeFile, `${leargeFile}.not`, (errz: NodeJS.ErrnoException | null) => {
                    done();
                }, true);
            }, true);
        })();
    });
    describe('config', () => {
        let untouchedConfig: { [x: string]: any; } = {};
        it('database', function (done: Mocha.Done): void {
            this.timeout(5000);
            expect(appUtility.server.db.pg).toBeUndefined();
            untouchedConfig = cwserver.Util.clone(appUtility.server.config);
            expect(shouldBeError(() => {
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.database = {};
                    appUtility.server.initilize();
                } catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                        module: "", path: "", dbConn: {
                            database: "", password: ""
                        }
                    }];
                    appUtility.server.initilize();
                } catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                        module: "pgsql", path: "", dbConn: {
                            database: "", password: ""
                        }
                    }];
                    appUtility.server.initilize();
                } catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                        module: "pgsql", path: "$rotex/$public/lib/pgslq.js", dbConn: {
                            database: "", password: ""
                        }
                    }];
                    appUtility.server.initilize();
                } catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                        module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                            database: "sysdb", password: ""
                        }
                    }];
                    appUtility.server.initilize();
                } catch (e) {
                    appUtility.server.config.database = [];
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                try {
                    appUtility.server.config.database = [{
                        module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                            database: "sysdb", password: "xyz"
                        }
                    }];
                    appUtility.server.initilize();
                } catch (e) {
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
                expect(shouldBeError(() => {
                    appUtility.server.initilize();
                })).toBeInstanceOf(Error);
                Util.extend(appUtility.server.config, untouchedConfig);
            })();
            done();
        });
        it('override', function (done: Mocha.Done): void {
            this.timeout(5000);
            /* [Error Page] */
            expect(shouldBeError(() => {
                const newConfig: { [x: string]: any; } = getConfig();
                newConfig.errorPage = {};
                appUtility.server.implimentConfig(newConfig);
                appUtility.server.initilize();
            }, true)).not.toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                const newConfig: { [x: string]: any; } = appUtility.server.config;
                newConfig.errorPage = void 0;
                appUtility.server.initilize();
            })).not.toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                appUtility.server.config.errorPage = {
                    "404": appUtility.server.errorPage["404"]
                };
                appUtility.server.initilize();
            }, true)).not.toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                const oldkey = appUtility.server.config.errorPage;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.errorPage = [];
                    appUtility.server.initilize();
                } catch (e) {
                    appUtility.server.config.errorPage = oldkey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                const oldkey = appUtility.server.config.errorPage;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.errorPage = {
                        "405": "g/nopx/404.html"
                    };
                    appUtility.server.initilize();
                } catch (e) {
                    appUtility.server.config.errorPage = oldkey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            /* [/Error Page] */
            expect(shouldBeError(() => {
                const oldKey = appUtility.server.config.encryptionKey;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.encryptionKey = void 0;
                    appUtility.server.implimentConfig(newConfig);
                } catch (e) {
                    appUtility.server.config.encryptionKey = oldKey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                const oldKey = appUtility.server.config.hiddenDirectory;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.hiddenDirectory = void 0;
                    newConfig.encryptionKey = "NEW_KEY";
                    appUtility.server.implimentConfig(newConfig);
                } catch (e) {
                    appUtility.server.config.hiddenDirectory = oldKey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                const oldkey = appUtility.server.config.session;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.session = {};
                    appUtility.server.implimentConfig(newConfig);
                } catch (e) {
                    appUtility.server.config.session = oldkey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(appUtility.server.parseSession("test=1;no-parse")).toBeInstanceOf(Session);
            cwserver.Util.extend(appUtility.server.config, untouchedConfig);
            expect(appUtility.server.parseSession("_session=error")).toBeInstanceOf(Session);
            expect(shouldBeError(() => {
                const oldkey = appUtility.server.config.session;
                const enckey = appUtility.server.config.encryptionKey;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.encryptionKey = "NEW_KEY";
                    newConfig.session = {
                        key: "session",
                        maxAge: {}
                    };
                    appUtility.server.implimentConfig(newConfig);
                } catch (e) {
                    appUtility.server.config.session = oldkey;
                    appUtility.server.config.encryptionKey = enckey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                const oldkey = appUtility.server.config.cacheHeader;
                const enckey = appUtility.server.config.encryptionKey;
                const oldSession = appUtility.server.config.session;
                try {
                    const newConfig: { [x: string]: any; } = appUtility.server.config;
                    newConfig.encryptionKey = "NEW_KEY";
                    newConfig.cacheHeader = void 0;
                    newConfig.session = {
                        key: "session",
                        maxAge: void 0
                    };
                    newConfig.isDebug = false;
                    appUtility.server.implimentConfig(newConfig);
                } catch (e) {
                    appUtility.server.config.session = oldSession;
                    appUtility.server.config.cacheHeader = oldkey;
                    appUtility.server.config.encryptionKey = enckey;
                    throw e;
                }
            })).toBeInstanceOf(Error);
            (() => {
                expect(shouldBeError(() => {
                    appUtility.server.getErrorPath(100);
                })).toBeInstanceOf(Error);
                let oldError = Util.clone(appUtility.server.config.errorPage);
                appUtility.server.config.errorPage = {};
                expect(appUtility.server.getErrorPath(500)).toBeDefined();
                expect(shouldBeError(() => {
                    appUtility.server.getErrorPath(402);
                })).toBeInstanceOf(Error);
                Util.extend(appUtility.server.config.errorPage, oldError);
                expect(appUtility.server.getErrorPath(500, true)).toBeDefined();
                oldError = Util.clone(appUtility.server.errorPage);
                for (const prop in appUtility.server.errorPage) {
                    delete appUtility.server.errorPage[prop];
                }
                expect(appUtility.server.getErrorPath(500, true)).toBeUndefined();
                Util.extend(appUtility.server.errorPage, oldError);
            })();
            expect(shouldBeError(() => {
                appUtility.server.parseMaxAge("10N");
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                appUtility.server.parseMaxAge("AD");
            })).toBeInstanceOf(Error);
            expect(appUtility.server.parseMaxAge("1H")).not.toBeInstanceOf(Error);
            expect(appUtility.server.parseMaxAge("1M")).not.toBeInstanceOf(Error);
            expect(appUtility.server.parseMaxAge("1MM")).not.toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                appUtility.server.parseMaxAge("D1MM");
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                appUtility.server.parseMaxAge({});
            })).toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                appUtility.server.formatPath("$root/$public/lib.js");
            })).toBeInstanceOf(Error);
            expect(appUtility.server.formatPath("root/public/lib.js")).not.toBeInstanceOf(Error);
            done();
        });
    });
    it('log', function (done: Mocha.Done): void {
        this.timeout(5000);
        appUtility.server.log.log("log-test");
        appUtility.server.log.info("log-info-test");
        appUtility.server.log.dispose();
        let logger = new Logger();
        logger.log("log-test");
        logger.info("log-test");
        logger.success("log-test");
        logger.error("log-test");
        expect(shouldBeError(() => {
            logger.flush();
        })).toBeInstanceOf(Error);
        logger.reset();
        logger.dispose(); logger.dispose();
        logger = new Logger(logDir, void 0, "+6", void 0, false);
        logger.write("test\r\n ");
        logger.reset();
        logger.dispose();
        logger = new Logger(void 0, void 0, "+6", false);
        logger.write(cwserver.ConsoleColor.Cyan("User Interactive"));
        logger.dispose();
        appUtility.server.log.dispose();
        logger = new Logger(logDir, projectRoot, "+6", false, false, 100);
        logger.write("No way");
        expect(logger.flush()).toEqual(true);
        expect(logger.flush()).toEqual(false);
        logger.log({});
        logger.writeToStream("log-test");
        logger.writeToStream("log-test");
        logger.writeToStream("log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test");
        logger.writeToStream("log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test log-test ");
        logger.writeToStream("log-test");
        logger.reset();
        logger.dispose();
        expect(LogTime.dfo(0)).toEqual("01");
        expect(LogTime.dfm(11)).toEqual("12");
        expect(LogTime.dfm(8)).toEqual("09");
        logger = new Logger(path.resolve('./log/n-log/'), 'test-logger');
        logger.newLine(); logger.dispose();
        logger = new Logger(path.resolve('./log/n-log/'), 'test-logger', undefined, false, true);
        logger.info("Test-info").newLine();
        logger.success("Success message..");
        logger.error("Error message..");
        logger.log(Buffer.from("Test buffer..."));
        logger.writeBuffer("Buffer Test...");
        // logger = new Logger(path.resolve('./log/n-log/'), 'test-logger');
        logger.dispose();
        done();
    });
});
describe("cwserver-schema-validator", () => {
    it("validate-schema", function (done: Mocha.Done): void {
        this.timeout(5000);
        expect(fillUpType("array")).toBeInstanceOf(Array);
        expect(fillUpType("number")).toEqual(0);
        expect(fillUpType("boolean")).toBeFalsy();
        expect(fillUpType("string")).toBeDefined();
        expect(fillUpType("object")).toBeInstanceOf(Object);
        expect(fillUpType()).toBeUndefined();
        (() => {
            const schemaProperties: IProperties = {
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
                                "description": "maxAge = m = Month | d = Day | h = Hour."
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
            expect(schemaValidate("root.session", schemaProperties, {
                "session": [{
                    "cookie": "_session",
                    "maxAge": "1d",
                    "key": "adfasf$aa",
                    "isSecure": false
                }]
            }, true)).not.toBeInstanceOf(Error);
            expect(shouldBeError(() => {
                schemaValidate("root.session", schemaProperties, {
                    "session": [""]
                }, true);
            })).toBeInstanceOf(Error);
            schemaValidate("root.nsession", schemaProperties, {
                "nsession": []
            }, true);
        })();
        const config: NodeJS.Dict<any> | void = fsw.readJsonSync<any>(appUtility.server.mapPath("/config/app.config.json"));
        expect(config).toBeInstanceOf(Object);
        if (!config) throw new Error("unreachable...");
        const $schema = config.$schema;
        expect(shouldBeError(() => {
            config.$schema = void 0;
            Schema.Validate(config);
        })).toBeInstanceOf(Error);
        config.$schema = $schema;
        expect((() => {
            config.$comment = "this config";
            Schema.Validate(config);
        })()).not.toBeInstanceOf(Error);
        config.$schema = $schema;
        expect(shouldBeError(() => {
            const oldVal = config.staticFile;
            try {
                config.noCache = void 0;
                config.staticFile = void 0;
                Schema.Validate(config);
            } catch (e) {
                config.staticFile = oldVal;
                config.noCache = [];
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.template.cacheType = "MEMS";
                Schema.Validate(config);
            } catch (e) {
                config.template.cacheType = "MEM";
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.template.cache = "MEMS";
                Schema.Validate(config);
            } catch (e) {
                config.template.cache = false;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            const template = Util.clone(config.template);
            try {
                delete config.template;
                Schema.Validate(config);
            } catch (e) {
                config.template = template;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            const template = Util.clone(config.template);
            try {
                config.template.addvalue = "";
                Schema.Validate(config);
            } catch (e) {
                config.template = template;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            const template = Util.clone(config.template);
            try {
                config.template = "";
                Schema.Validate(config);
            } catch (e) {
                config.template = template;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.liveStream = [1];
                Schema.Validate(config);
            } catch (e) {
                config.liveStream = [];
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.liveStream = {};
                Schema.Validate(config);
            } catch (e) {
                config.liveStream = [];
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            try {
                config.isDebug = {};
                Schema.Validate(config);
            } catch (e) {
                config.isDebug = false;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            const old = config.Author;
            try {
                config.Author = "ME";
                Schema.Validate(config);
            } catch (e) {
                config.Author = old;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            const old = config.defaultDoc;
            try {
                config.defaultDoc = [];
                Schema.Validate(config);
            } catch (e) {
                config.defaultDoc = old;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            const old = config.appName;
            try {
                config.appName = "";
                Schema.Validate(config);
            } catch (e) {
                config.appName = old;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            config.$schema = $schema;
            const old = config.template;
            try {
                config.template = void 0;
                Schema.Validate(config);
            } catch (e) {
                config.template = old;
                throw e;
            }
        })).toBeInstanceOf(Error);
        expect(shouldBeError(() => {
            Schema.Validate([]);
        })).toBeInstanceOf(Error);
        const parent = path.resolve(__dirname, '..');
        const absPath = path.resolve(`${parent}/schema.json`);
        expect(fs.existsSync(absPath)).toBe(true);
        const distPath = path.resolve(`${parent}/schemas.json`);
        fs.renameSync(absPath, distPath);
        process.env.SCRIPT = "TSX";
        expect(shouldBeError(() => {
            Schema.Validate(config);
        })).toBeInstanceOf(Error);
        process.env.SCRIPT = "TS";
        fs.writeFileSync(absPath, "{}");
        expect(shouldBeError(() => {
            Schema.Validate(config);
        })).toBeInstanceOf(Error);
        fs.writeFileSync(absPath, "INVALID_JSON");
        expect(shouldBeError(() => {
            Schema.Validate(config);
        })).toBeInstanceOf(Error);
        fs.unlinkSync(absPath);
        fs.renameSync(distPath, absPath);
        done();
    });
});
describe("cwserver-fsw", () => {
    it("test-fsw", function (done: Mocha.Done): void {
        this.timeout(5000);
        const root: string = path.resolve(`${appRoot}/ewww`);
        const filePath: string = path.resolve(root + "/config/app.config.json");
        fs.writeFile(filePath, JSON.stringify({ name: "Safe Online World Ltd." }), (err: NodeJS.ErrnoException | null): void => {
            assert(err === null, "test-fsw->fs.writeFile");
            fsw.readJson(filePath, (jerr: NodeJS.ErrnoException | null, json: { [id: string]: any } | void) => {
                assert(jerr === null, "test-fsw->fsw.readJson");
                expect(json).toBeInstanceOf(Object);
                fs.writeFileSync(filePath, "INVALID_JSON");
                fsw.readJson(filePath, (jnerr: NodeJS.ErrnoException | null, njson: { [id: string]: any } | void) => {
                    assert(jnerr !== null, "test-fsw->fsw.readJson-jnerr");
                    expect(njson).toBeUndefined();
                    fsw.mkdir("", "", (derr: NodeJS.ErrnoException | null) => {
                        expect(derr).toBeInstanceOf(Error);
                    }, handleError);
                    fsw.mkdir(root, ".", (derr: NodeJS.ErrnoException | null) => {
                        expect(derr).toBeInstanceOf(Error);
                    }, handleError);
                    fsw.mkdir(filePath, "", (mderr: NodeJS.ErrnoException | null) => {
                        expect(mderr).toBeInstanceOf(Error);
                        fsw.copyDir(path.join(root, "/noton/"), path.resolve(`${appRoot}/cwww`), (crderr: NodeJS.ErrnoException | null) => {
                            expect(crderr).toBeInstanceOf(Error);
                        }, handleError);
                        fsw.copyDir(root, path.resolve(`${appRoot}/cwww`), (ncrderr: NodeJS.ErrnoException | null) => {
                            expect(ncrderr).not.toBeInstanceOf(Error);
                            fsw.mkdir(root, "/my.json", (rderr: NodeJS.ErrnoException | null) => {
                                expect(rderr).toBeInstanceOf(Error);
                                fsw.copyFile(filePath, root, (crderr: NodeJS.ErrnoException | null) => {
                                    expect(crderr).toBeInstanceOf(Error);
                                }, handleError);
                                fsw.copyFile(root, root, (dncrderr: NodeJS.ErrnoException | null) => {
                                    expect(dncrderr).toBeInstanceOf(Error);
                                }, handleError);
                                fsw.copyFile(`${filePath}.not`, filePath, (fcrderr: NodeJS.ErrnoException | null) => {
                                    expect(fcrderr).toBeInstanceOf(Error);
                                    fsw.copyFile(filePath, `${filePath}.not`, (cfcrderr: NodeJS.ErrnoException | null) => {
                                        expect(cfcrderr).not.toBeInstanceOf(Error);
                                        fsw.unlink(`${filePath}.not`, (uerr: NodeJS.ErrnoException | null) => {
                                            expect(uerr).not.toBeInstanceOf(Error);
                                            fsw.rmdir(root, (rerr: NodeJS.ErrnoException | null) => {
                                                expect(rerr).toBe(null);
                                                done();
                                            }, handleError);
                                        });
                                    }, handleError);
                                }, handleError);
                            }, handleError);
                        }, handleError);
                    }, handleError);
                }, handleError);
            }, handleError);
        });
    });
    it("test-fsw-async", function (done) {
        this.timeout(5000);
        async function task() {
            let unlinkFileName: string | undefined;
            for await (const p of await fsw.getFilesAsync(logDir)) {
                if (!p) continue;
                break;
            }
            for await (const p of await fsw.getFilesAsync(appUtility.server.mapPath("/web/"), true)) {
                if (!p) continue;
                if (unlinkFileName) continue;
                unlinkFileName = p;
            }
            expect(unlinkFileName).toBeDefined();
            try {
                await fsw.opendirAsync("/testpx/");
            } catch (ex) {
                expect(ex).toBeDefined();
            }
            try {
                await fsw.unlinkAsync("/testpx/");
            } catch (ex) {
                expect(ex).toBeDefined();
            }
            const tPath = path.resolve('./_test/');
            await fsw.mkdirAsync(handleError, tPath, "");
            if (unlinkFileName) {
                expect(await fsw.existsAsync(unlinkFileName)).toBeTruthy();
                try {
                    await fsw.existsAsync(`x/zz/`);
                } catch (ex) {
                    expect(ex).toBeDefined();
                }
                const testFileLog = path.resolve(`${tPath}/test_file.log`);
                try {
                    await sleep(100);
                    await fsw.moveFileAsync(unlinkFileName, testFileLog);
                    await sleep(100);
                    await fsw.moveFileAsync(testFileLog, unlinkFileName);
                    await fsw.moveFileAsync(testFileLog, unlinkFileName);
                } catch (ex) {
                    expect(ex).toBeDefined();
                }

                try {
                    await sleep(100);
                    await fsw.unlinkAsync(unlinkFileName);
                    await sleep(100);
                    await fsw.writeFileAsync(unlinkFileName, "TEST_PART");
                    await fsw.writeFileAsync(path.resolve(`${tPath}/test_file.log/web_file_no_file_test`), "TEST_PART");
                } catch (ex) {
                    expect(ex).toBeDefined();
                }

            }
            //appUtility.server.mapPath("/web/large.bin")
            done();
        }
        task();
    });
});
describe("finalization", () => {
    it("shutdown-application", function (done: Mocha.Done): void {
        this.timeout(5000);
        (async () => {
            await app.shutdown();
            done();
        })();
    });
    it("remove-garbage", function (done: Mocha.Done): void {
        this.timeout(5000);
        expect(fsw.mkdirSync(logDir, "/test")).not.toBeInstanceOf(Error);
        setTimeout(() => {
            if (fs.existsSync(logDir)) {
                fsw.rmdirSync(logDir);
            }
            fsw.rmdir(appRoot, () => {
                done();
            }, handleError);
        }, 1000);
    });
});