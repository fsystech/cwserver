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
exports.createProjectTemplate = void 0;
// 3:15 PM 5/10/2020
// by rajib chy
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const logger_1 = require("./logger");
const app_util_1 = require("./app-util");
const fsw = __importStar(require("./fsw"));
function createProjectTemplate(settings) {
    const isTest = typeof (settings.isTest) === "boolean" && settings.isTest === true;
    if (isTest === false) {
        console.log(logger_1.ConsoleColor.FgGreen, `Please wait creating your project ${settings.projectRoot}`);
    }
    const templateRoot = _path.resolve(`${(0, app_util_1.getAppDir)()}/dist/project_template`);
    if (!_fs.existsSync(templateRoot))
        throw new Error(`Project template not found in ${templateRoot}\r\nPlease uninstall and install again 'cwserver'`);
    const appRoot = _path.resolve(settings.appRoot);
    if (!_fs.existsSync(appRoot)) {
        if (!isTest) {
            throw new Error(`App Root not found ${appRoot}\r\nprojectDef.projectRoot like as __dirname`);
        }
        fsw.mkdirSync(appRoot);
    }
    const projectRoot = _path.resolve(`${appRoot}/${settings.projectRoot}`);
    if (_fs.existsSync(projectRoot)) {
        if (settings.force !== true) {
            throw new Error(`Project Root already exists in ${projectRoot}\r\nPlease delete first ${settings.projectRoot}.`);
        }
        fsw.rmdirSync(projectRoot);
    }
    fsw.mkdirSync(appRoot, settings.projectRoot);
    fsw.copyDirSync(_path.resolve(`${templateRoot}/www`), projectRoot);
    const serverJs = _path.resolve(`${appRoot}/server.js`);
    if (!_fs.existsSync(serverJs)) {
        _fs.copyFileSync(_path.resolve(`${templateRoot}/server.js`), serverJs);
    }
    const webConfig = _path.resolve(`${appRoot}/web.config`);
    if (!_fs.existsSync(webConfig)) {
        _fs.copyFileSync(_path.resolve(`${templateRoot}/web.config`), webConfig);
    }
    if (isTest === false) {
        // Blank directory ignore both of npm and git
        // So, we've to check before complete project creation
        const temp = '/web/temp/cache/';
        if (!_fs.existsSync(_path.resolve(`${projectRoot}${temp}`))) {
            fsw.mkdirSync(projectRoot, temp);
            // Create blank directory in project_template/www/ for further use
            fsw.mkdirSync(_path.resolve(`${templateRoot}/www`), temp);
        }
        if (settings.allExample === true) {
            console.log(logger_1.ConsoleColor.FgYellow, `Add all example to your project root ${settings.projectRoot}`);
            fsw.mkdirSync(projectRoot, "/example/");
            console.log(logger_1.ConsoleColor.FgYellow, `Copying to ${settings.projectRoot}/example/`);
            fsw.copyDirSync(_path.resolve(`${templateRoot}/example/`), _path.resolve(`${projectRoot}/example/`));
            console.log(logger_1.ConsoleColor.FgYellow, `Copying to ${settings.projectRoot}/lib/`);
            fsw.copyDirSync(_path.resolve(`${templateRoot}/lib/`), _path.resolve(`${projectRoot}/lib/`));
        }
    }
    else {
        fsw.copyFileSync(_path.resolve(`${templateRoot}/test/app.config.json`), _path.resolve(`${projectRoot}/config/app.config.json`));
        fsw.copyFileSync(_path.resolve(`${templateRoot}/test/test.js`), _path.resolve(`${projectRoot}/lib/view/test.js`));
        fsw.copyFileSync(_path.resolve(`${templateRoot}/test/socket-client.js`), _path.resolve(`${projectRoot}/lib/socket-client.js`));
    }
    const configPath = _path.resolve(`${projectRoot}/config/app.config.json`);
    const config = fsw.readJsonSync(configPath);
    if (!config) {
        throw new Error(configPath);
    }
    if (config.hostInfo.root !== settings.projectRoot) {
        config.hostInfo.root = settings.projectRoot;
        _fs.writeFileSync(configPath, JSON.stringify(config).replace(/{/gi, "{\n").replace(/}/gi, "\n}").replace(/,/gi, ",\n"));
    }
    if (isTest)
        return;
    console.log(logger_1.ConsoleColor.FgGreen, `
Your project ${settings.projectRoot} created.
run your project by this command
node server ${settings.projectRoot}`);
    console.log(logger_1.ConsoleColor.Reset);
}
exports.createProjectTemplate = createProjectTemplate;
//# sourceMappingURL=project-template.js.map