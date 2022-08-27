"use strict";
// Copyright (c) 2022 Safe Online World Ltd.
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = exports.appVersion = exports.readAppVersion = exports.parseCookie = exports.App = exports.SessionSecurity = exports.createProjectTemplate = exports.wsClient = exports.socketInitilizer = exports.Streamer = exports.fsw = exports.Util = exports.PayloadParser = exports.getBodyParser = exports.LogTime = exports.ShadowLogger = exports.Logger = exports.ConsoleColor = exports.HttpCache = exports.HttpMimeHandler = exports.Encryption = exports.initilizeServer = void 0;
// 3:56 PM 5/9/2020
// by rajib chy
var server_1 = require("./lib/server");
Object.defineProperty(exports, "initilizeServer", { enumerable: true, get: function () { return server_1.initilizeServer; } });
var encryption_1 = require("./lib/encryption");
Object.defineProperty(exports, "Encryption", { enumerable: true, get: function () { return encryption_1.Encryption; } });
var http_mime_1 = require("./lib/http-mime");
Object.defineProperty(exports, "HttpMimeHandler", { enumerable: true, get: function () { return http_mime_1.HttpMimeHandler; } });
var http_cache_1 = require("./lib/http-cache");
Object.defineProperty(exports, "HttpCache", { enumerable: true, get: function () { return http_cache_1.HttpCache; } });
var logger_1 = require("./lib/logger");
Object.defineProperty(exports, "ConsoleColor", { enumerable: true, get: function () { return logger_1.ConsoleColor; } });
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_1.Logger; } });
Object.defineProperty(exports, "ShadowLogger", { enumerable: true, get: function () { return logger_1.ShadowLogger; } });
Object.defineProperty(exports, "LogTime", { enumerable: true, get: function () { return logger_1.LogTime; } });
var body_parser_1 = require("./lib/body-parser");
Object.defineProperty(exports, "getBodyParser", { enumerable: true, get: function () { return body_parser_1.getBodyParser; } });
Object.defineProperty(exports, "PayloadParser", { enumerable: true, get: function () { return body_parser_1.PayloadParser; } });
var app_util_1 = require("./lib/app-util");
Object.defineProperty(exports, "Util", { enumerable: true, get: function () { return app_util_1.Util; } });
exports.fsw = __importStar(require("./lib/fsw"));
var web_streamer_1 = require("./lib/web-streamer");
Object.defineProperty(exports, "Streamer", { enumerable: true, get: function () { return web_streamer_1.Streamer; } });
var ws_1 = require("./lib/ws");
Object.defineProperty(exports, "socketInitilizer", { enumerable: true, get: function () { return ws_1.socketInitilizer; } });
Object.defineProperty(exports, "wsClient", { enumerable: true, get: function () { return ws_1.wsClient; } });
var project_template_1 = require("./lib/project-template");
Object.defineProperty(exports, "createProjectTemplate", { enumerable: true, get: function () { return project_template_1.createProjectTemplate; } });
var server_2 = require("./lib/server");
Object.defineProperty(exports, "SessionSecurity", { enumerable: true, get: function () { return server_2.SessionSecurity; } });
var server_core_1 = require("./lib/server-core");
Object.defineProperty(exports, "App", { enumerable: true, get: function () { return server_core_1.App; } });
Object.defineProperty(exports, "parseCookie", { enumerable: true, get: function () { return server_core_1.parseCookie; } });
Object.defineProperty(exports, "readAppVersion", { enumerable: true, get: function () { return server_core_1.readAppVersion; } });
Object.defineProperty(exports, "appVersion", { enumerable: true, get: function () { return server_core_1.appVersion; } });
var app_static_1 = require("./lib/app-static");
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return app_static_1.Session; } });
//# sourceMappingURL=index.js.map