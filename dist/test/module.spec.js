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
const expect_1 = __importDefault(require("expect"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const cwserver = __importStar(require("../index"));
const sow_util_1 = require("../lib/sow-util");
const request = __importStar(require("superagent"));
const io = __importStar(require("socket.io-client"));
const test_view_1 = require("./test-view");
require("mocha");
let appUtility = Object.create(null);
let app = Object.create(null);
const appRoot = process.env.SCRIPT === "TS" ? path.join(path.resolve(__dirname, '..'), "/dist/test/") : __dirname;
const projectRoot = 'cwserver.safeonline.world';
describe("cwserver-default-project-template", () => {
    it("create project template", (done) => {
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
describe("cwserver-core", () => {
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
    it("initilize server", (done) => {
        appUtility = cwserver.initilizeServer(appRoot, projectRoot);
        expect_1.default(appUtility.public).toEqual(projectRoot);
        done();
    });
    it("initilize application", (done) => {
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
            app.shutdown((err) => {
                done();
            });
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
            .post("/test-controller", invoke);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.get("/test-controller", invoke);
        })).toBeInstanceOf(Error);
        expect_1.default(test_view_1.shouldBeError(() => {
            appUtility.controller.post("/test-controller", invoke);
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
});
describe("cwserver-session", () => {
    const loginId = "rajib";
    const agent = request.agent();
    it('authenticate-request', (done) => {
        app.listen(appUtility.port, () => {
            agent
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
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should-be-user-authenticated', (done) => {
        app.listen(appUtility.port, () => {
            agent
                .get(`http://localhost:${appUtility.port}/is-authenticate`)
                .query({ loginId })
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("application/json");
                expect_1.default(res.body).toBeInstanceOf(Object);
                expect_1.default(res.body.loginId).toEqual(loginId);
                expect_1.default(res.body.userData).toBeDefined();
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('authenticated-user-should-be-redirect-to-home', (done) => {
        app.listen(appUtility.port, () => {
            agent
                .get(`http://localhost:${appUtility.port}/authenticate`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.redirects.length).toEqual(1); // should be redirect home page
                expect_1.default(res.redirects.indexOf(`http://localhost:${appUtility.port}/`)).toBeGreaterThan(-1);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-get", () => {
    it('send get request to application', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("text/html");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('get-raw-file', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/get-file`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('redirect request to controller', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/redirect`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.redirects.length).toEqual(1); // should be redirect home page
                expect_1.default(res.redirects.indexOf(`http://localhost:${appUtility.port}/`)).toBeGreaterThan(-1);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-template-engine", () => {
    it('send get request should be 404 response config.defaultExt = .html', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/index.html`)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(404);
                expect_1.default(res.header["content-type"]).toBe("text/html");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('send get request should be 200 response', (done) => {
        const defaultExt = appUtility.server.config.defaultExt;
        appUtility.server.config.defaultExt = "";
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/index.html`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("text/html");
                appUtility.server.config.defaultExt = defaultExt;
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    let templateConf;
    it('route `/` then should use config.defaultDoc and create template cache', (done) => {
        templateConf = appUtility.server.config.template;
        appUtility.server.config.template.cache = true;
        appUtility.server.config.template.cacheType = "FILE";
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("text/html");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be serve from template cache', (done) => {
        expect_1.default(sow_util_1.Util.isPlainObject(templateConf)).toBe(true);
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/`)
                .end((err, res) => {
                if (templateConf) {
                    appUtility.server.config.template = templateConf;
                }
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("text/html");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-bundler", () => {
    it('js file bundler with gizp response (server file cache)', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
                .query({
                g: appUtility.server.createBundle(`
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            })
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
                expect_1.default(res.header["content-encoding"]).toBe("gzip");
                expect_1.default(res.header.etag).not.toBeUndefined();
                expect_1.default(res.header["last-modified"]).not.toBeUndefined();
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('js file bundler with gizp response (no server cache)', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
                .query({
                g: appUtility.server.createBundle(`
                        $virtual_vtest/socket-client.js,
                        $root/$public/static/script/test-1.js,
                        $root/$public/static/script/test-2.js|__owner__`),
                ck: "bundle_test_js", ct: "text/javascript", rc: "Y"
            })
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("application/x-javascript; charset=utf-8");
                expect_1.default(res.header["content-encoding"]).toBe("gzip");
                expect_1.default(res.header["last-modified"]).not.toBeUndefined();
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('css file bundler with gizp response (server file cache)', (done) => {
        appUtility.server.config.bundler.fileCache = true;
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
                .query({
                g: appUtility.server.createBundle(`
                        $root/$public/static/css/test-1.css,
                        $root/$public/static/css/test-2.css|__owner__`),
                ck: "bundle_test_css", ct: "text/css", rc: "Y"
            })
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("text/css");
                expect_1.default(res.header["content-encoding"]).toBe("gzip");
                expect_1.default(res.header.etag).not.toBeUndefined();
                expect_1.default(res.header["last-modified"]).not.toBeUndefined();
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-bundler-error", () => {
    it('bundler should be virtual file error', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen(appUtility.port, () => {
            request
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
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('bundler should be virtual error', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen(appUtility.port, () => {
            request
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
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('bundler should be unsupported content type error', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen(appUtility.port, () => {
            request
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
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('bundler should be path parse error', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen(appUtility.port, () => {
            request
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
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('bundler should be encryption error', (done) => {
        appUtility.server.config.bundler.fileCache = false;
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/app/api/bundle/`)
                .query({
                g: `$virtual_vtest/socket-client.js`,
                ck: "bundle_test_jsx", ct: "text/plain", rc: "Y"
            })
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(404);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-post", () => {
    it('send post request to application', (done) => {
        app.listen(appUtility.port, () => {
            request
                .post(`http://localhost:${appUtility.port}/post`)
                .send(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
                .set('Content-Type', 'application/json')
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("application/json");
                expect_1.default(res.body.name).toBe('rajibs');
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should post request not found', (done) => {
        app.listen(appUtility.port, () => {
            request
                .post(`http://localhost:${appUtility.port}/post/invalid-route`)
                .send(JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }))
                .set('Content-Type', 'application/json')
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(404);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-gzip-response", () => {
    it('should be response type gzip', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/response`)
                .query({ task: "gzip", data: JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }) })
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-encoding"]).toBe("gzip");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-mime-type", () => {
    let eTag = "";
    let lastModified = "";
    it('should be mime type encoding gzip', (done) => {
        app.listen(appUtility.port, () => {
            request
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
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be mime type if-none-match', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/logo/logo.png`)
                .set("if-none-match", eTag)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(304);
                expect_1.default(res.header["x-server-revalidate"]).toBe("true");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be mime type if-modified-since', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/logo/logo.png`)
                .set("if-modified-since", lastModified)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(304);
                expect_1.default(res.header["x-server-revalidate"]).toBe("true");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be mime type not found', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/logo/logos.png`)
                .set("if-modified-since", lastModified)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(404);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('unsupported mime type', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/logo/logo.zip`)
                .set("if-modified-since", lastModified)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(404);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be served from file (no server file cache)', (done) => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        app.listen(appUtility.port, () => {
            request
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
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be mime type if-none-match (no server file cache)', (done) => {
        const oldfileCache = appUtility.server.config.staticFile.fileCache;
        appUtility.server.config.staticFile.fileCache = false;
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/logo/logo.png`)
                .set("if-none-match", eTag)
                .end((err, res) => {
                appUtility.server.config.staticFile.fileCache = oldfileCache;
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(304);
                expect_1.default(res.header["x-server-revalidate"]).toBe("true");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be favicon.ico 200', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/favicon.ico`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("image/x-icon");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-virtual-dir", () => {
    it('check-virtual-dir-handler', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/vtest/socket-client.js`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("application/javascript");
                expect_1.default(res.header["content-encoding"]).toBe("gzip");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-multipart-paylod-parser", () => {
    it('should post multipart post file', (done) => {
        app.listen(appUtility.port, () => {
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
            request
                .post(`http://localhost:${appUtility.port}/upload`)
                .field('post-file', readStream)
                .end((err, res) => {
                readStream.close();
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("application/json");
                expect_1.default(res.body).toBeInstanceOf(Object);
                expect_1.default(res.body.content_type).toBe(contentType);
                expect_1.default(res.body.file_name).toBe(fileName);
                expect_1.default(res.body.name).toBe("post-file");
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-socket-io-implementation", () => {
    it('get ws-server-event', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/ws-server-event`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("application/json");
                expect_1.default(res.body).toBeInstanceOf(Object);
                expect_1.default(res.body.server).toBeInstanceOf(Array);
                expect_1.default(res.body.server.indexOf("test-msg")).toBeGreaterThan(-1);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be send n receive data over socket-io', (done) => {
        app.listen(appUtility.port, () => {
            const socket = io.connect(`http://localhost:${appUtility.port}`, { reconnection: true });
            socket.on('connect', () => {
                socket.emit('test-msg', { name: 'rajibs', occupation: 'kutukutu' });
            });
            socket.on('on-test-msg', (data) => {
                socket.close();
                expect_1.default(data.name).toBe('rajibs');
                app.shutdown((err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-echo", () => {
    it('echo-server', (done) => {
        const reqMd5 = cwserver.md5("Test");
        const hex = cwserver.Encryption.utf8ToHex(reqMd5);
        app.listen(appUtility.port, () => {
            request
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
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-web-stream", () => {
    it('should-be-get-stream-request', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/web-stream/test.mp3`)
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                expect_1.default(res.header["content-type"]).toBe("audio/mpeg");
                expect_1.default(res.header["content-length"]).toBeDefined();
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should-be-stream', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/web-stream/test.mp3`)
                .set("range", "bytes=0-")
                .end((err, res) => {
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(206); // Partial Content
                expect_1.default(res.header["content-type"]).toBe("audio/mpeg");
                expect_1.default(res.header["content-range"]).toBeDefined();
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-error", () => {
    it('should be throw server error', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/app-error/`)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(500);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be pass server error', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/pass-error`)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(500);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-controller-reset", () => {
    it('config.defaultDoc', (done) => {
        const defaultExt = appUtility.server.config.defaultExt;
        const defaultDoc = appUtility.server.config.defaultDoc;
        appUtility.server.config.defaultDoc = ["index.html", "default.html"];
        appUtility.server.config.defaultExt = "";
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/`)
                .end((err, res) => {
                appUtility.server.config.defaultExt = defaultExt;
                appUtility.server.config.defaultDoc = defaultDoc;
                // console.log( err );
                expect_1.default(err).not.toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(200);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should be route not found', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/app-error`)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(404);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('no controller found for put', (done) => {
        app.listen(appUtility.port, () => {
            request
                .delete(`http://localhost:${appUtility.port}/app-error`)
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(404);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
    it('should-be-reset-controller', (done) => {
        appUtility.controller.reset();
        done();
    });
    it('should-be-controller-error', (done) => {
        app.listen(appUtility.port, () => {
            request
                .get(`http://localhost:${appUtility.port}/response`)
                .query({ task: "gzip", data: JSON.stringify({ name: 'rajibs', occupation: 'kutukutu' }) })
                .end((err, res) => {
                expect_1.default(err).toBeInstanceOf(Error);
                expect_1.default(res.status).toBe(404);
                app.shutdown((_err) => {
                    done();
                });
            });
        });
    });
});
describe("cwserver-utility", () => {
    it("Encryption", (done) => {
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
        it('database', (done) => {
            untouchedConfig = cwserver.Util.clone(appUtility.server.config);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.config.database = [{
                        module: "", path: "", dbConn: {
                            database: "", password: ""
                        }
                    }];
                appUtility.server.initilize();
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.config.database = [{
                        module: "pgsql", path: "", dbConn: {
                            database: "", password: ""
                        }
                    }];
                appUtility.server.initilize();
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.config.database = [{
                        module: "pgsql", path: "$rotex/$public/lib/pgslq.js", dbConn: {
                            database: "", password: ""
                        }
                    }];
                appUtility.server.initilize();
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.config.database = [{
                        module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                            database: "sysdb", password: ""
                        }
                    }];
                appUtility.server.initilize();
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                appUtility.server.config.database = [{
                        module: "pgsql", path: "$rote/$public/lib/pgslq.js", dbConn: {
                            database: "sysdb", password: "xyz"
                        }
                    }];
                appUtility.server.initilize();
            })).toBeInstanceOf(Error);
            done();
        });
        it('override', (done) => {
            expect_1.default(test_view_1.shouldBeError(() => {
                const newConfig = appUtility.server.config;
                newConfig.encryptionKey = void 0;
                appUtility.server.implimentConfig(newConfig);
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const newConfig = appUtility.server.config;
                newConfig.hiddenDirectory = void 0;
                appUtility.server.implimentConfig(newConfig);
                appUtility.server.initilize();
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const newConfig = appUtility.server.config;
                newConfig.session = {};
                appUtility.server.implimentConfig(newConfig);
            })).toBeInstanceOf(Error);
            expect_1.default(test_view_1.shouldBeError(() => {
                const newConfig = appUtility.server.config;
                newConfig.session = {
                    key: "session",
                    maxAge: "14DD"
                };
                appUtility.server.implimentConfig(newConfig);
            })).toBeInstanceOf(Error);
            cwserver.Util.extend(appUtility.server.config, untouchedConfig);
            done();
        });
    });
    it('log', (done) => {
        appUtility.server.log.log("log-test");
        appUtility.server.log.info("log-info-test");
        appUtility.server.log.dispose();
        done();
    });
});
//# sourceMappingURL=module.spec.js.map