"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _fs = require("fs");
const _path = require("path");
const sow_logger_1 = require("./sow-logger");
const sow_util_1 = require("./sow-util");
function createProjectTemplate(projectDef) {
    console.log(sow_logger_1.ConsoleColor.FgGreen, `Please wait creating your project ${projectDef.projectRoot}`);
    const myRoot = _path.resolve(__dirname, '..');
    const templateRoot = _path.resolve(`${myRoot}/project_template`);
    if (!_fs.existsSync(templateRoot))
        throw new Error(`Project template not found in ${templateRoot}\r\nPlease uninstall and install again 'cwserver'`);
    const appRoot = _path.resolve(projectDef.appRoot);
    if (!_fs.existsSync(appRoot))
        throw new Error(`App Root not found ${appRoot}\r\nprojectDef.projectRoot like as __dirname`);
    const projectRoot = _path.resolve(`${appRoot}/${projectDef.projectRoot}`);
    if (_fs.existsSync(projectRoot))
        throw new Error(`Project Root already exists in ${projectRoot}\r\nPlease delete first ${projectDef.projectRoot}.`);
    sow_util_1.Util.mkdirSync(appRoot, projectDef.projectRoot);
    sow_util_1.Util.copySync(_path.resolve(`${templateRoot}/www`), projectRoot);
    const serverJs = _path.resolve(`${appRoot}/server.js`);
    if (!_fs.existsSync(serverJs)) {
        _fs.copyFileSync(_path.resolve(`${templateRoot}/server.js`), serverJs);
    }
    const webConfig = _path.resolve(`${appRoot}/web.config`);
    if (!_fs.existsSync(webConfig)) {
        _fs.copyFileSync(_path.resolve(`${templateRoot}/web.config`), webConfig);
    }
    const temp = '/web/temp/cache/';
    if (!_fs.existsSync(_path.resolve(`${projectRoot}${temp}`))) {
        sow_util_1.Util.mkdirSync(projectRoot, temp);
        sow_util_1.Util.mkdirSync(_path.resolve(`${templateRoot}/www`), temp);
    }
    console.log(sow_logger_1.ConsoleColor.FgYellow, `Find hostInfo ==> root in app_config.json and set ${projectDef.projectRoot} in\r\n${projectRoot}\\config\\`);
    console.log(sow_logger_1.ConsoleColor.FgGreen, `
Your project ${projectDef.projectRoot} created.
run your project by this command
node server ${projectDef.projectRoot}`);
    console.log(sow_logger_1.ConsoleColor.Reset);
    return true;
}
exports.createProjectTemplate = createProjectTemplate;
//# sourceMappingURL=sow-project-template.js.map