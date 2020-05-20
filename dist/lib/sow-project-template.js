"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 3:15 PM 5/10/2020
const _fs = __importStar(require("fs"));
const _path = __importStar(require("path"));
const sow_logger_1 = require("./sow-logger");
const sow_util_1 = require("./sow-util");
const formatPath = (path) => {
    if (process.platform === "win32")
        return path.replace(/\//gi, "\\");
    return path.replace(/\\/gi, "/");
};
function createProjectTemplate(settings) {
    if (settings.isTest === false) {
        console.log(sow_logger_1.ConsoleColor.FgGreen, `Please wait creating your project ${settings.projectRoot}`);
    }
    const myRoot = _path.resolve(__dirname, '..');
    const templateRoot = _path.resolve(`${myRoot}/project_template`);
    if (!_fs.existsSync(templateRoot))
        throw new Error(`Project template not found in ${templateRoot}\r\nPlease uninstall and install again 'cwserver'`);
    const appRoot = _path.resolve(settings.appRoot);
    if (!_fs.existsSync(appRoot))
        throw new Error(`App Root not found ${appRoot}\r\nprojectDef.projectRoot like as __dirname`);
    const projectRoot = _path.resolve(`${appRoot}/${settings.projectRoot}`);
    if (_fs.existsSync(projectRoot)) {
        if (settings.force !== true) {
            throw new Error(`Project Root already exists in ${projectRoot}\r\nPlease delete first ${settings.projectRoot}.`);
        }
        sow_util_1.Util.rmdirSync(projectRoot);
    }
    sow_util_1.Util.mkdirSync(appRoot, settings.projectRoot);
    sow_util_1.Util.copySync(_path.resolve(`${templateRoot}/www`), projectRoot);
    const serverJs = _path.resolve(`${appRoot}/server.js`);
    if (!_fs.existsSync(serverJs)) {
        _fs.copyFileSync(_path.resolve(`${templateRoot}/server.js`), serverJs);
    }
    const webConfig = _path.resolve(`${appRoot}/web.config`);
    if (!_fs.existsSync(webConfig)) {
        _fs.copyFileSync(_path.resolve(`${templateRoot}/web.config`), webConfig);
    }
    // Blank directory ignore both of npm and git
    // So, we've to check before complete project creation
    const temp = '/web/temp/cache/';
    if (!_fs.existsSync(_path.resolve(`${projectRoot}${temp}`))) {
        sow_util_1.Util.mkdirSync(projectRoot, temp);
        // Create blank directory in project_template/www/ for further use
        sow_util_1.Util.mkdirSync(_path.resolve(`${templateRoot}/www`), temp);
    }
    if (settings.allExample === true) {
        console.log(sow_logger_1.ConsoleColor.FgYellow, `Add all example to your project root ${settings.projectRoot}`);
        sow_util_1.Util.mkdirSync(projectRoot, "/example/jsTemplate/");
        console.log(sow_logger_1.ConsoleColor.FgYellow, `Copying to ${settings.projectRoot}/example/jsTemplate/`);
        sow_util_1.Util.copySync(_path.resolve(`${templateRoot}/jsTemplate/`), _path.resolve(`${projectRoot}/example/jsTemplate/`));
        console.log(sow_logger_1.ConsoleColor.FgYellow, `Copying to ${settings.projectRoot}/lib/`);
        sow_util_1.Util.copySync(_path.resolve(`${templateRoot}/lib/`), _path.resolve(`${projectRoot}/lib/`));
    }
    if (settings.isTest === true) {
        sow_util_1.Util.copyFileSync(_path.resolve(`${templateRoot}/test/app.config.json`), _path.resolve(`${projectRoot}/config/app.config.json`));
        sow_util_1.Util.copyFileSync(_path.resolve(`${templateRoot}/test/test.js`), _path.resolve(`${projectRoot}/lib/view/test.js`));
        sow_util_1.Util.copyFileSync(_path.resolve(`${templateRoot}/test/socket-client.js`), _path.resolve(`${projectRoot}/lib/socket-client.js`));
    }
    if (settings.isTest === false) {
        console.log(sow_logger_1.ConsoleColor.FgYellow, `Find hostInfo ==> root in app_config.json and set ${settings.projectRoot} in\r\n${formatPath(projectRoot + '/config/')}`);
        console.log(sow_logger_1.ConsoleColor.FgGreen, `
Your project ${settings.projectRoot} created.
run your project by this command
node server ${settings.projectRoot}`);
        console.log(sow_logger_1.ConsoleColor.Reset);
    }
    return true;
}
exports.createProjectTemplate = createProjectTemplate;
