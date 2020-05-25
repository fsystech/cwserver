/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 3:15 PM 5/10/2020
import * as _fs from 'fs';
import * as _path from 'path';
import { ConsoleColor } from './sow-logger';
import { Util } from './sow-util';
export function createProjectTemplate( settings: {
	appRoot: string;
	projectRoot: string;
	allExample?: boolean;
	force?: boolean;
	isTest?: boolean;
} ): void {
	const isTest: boolean = typeof ( settings.isTest ) === "boolean" && settings.isTest === true;
	if ( isTest === false ) {
		console.log( ConsoleColor.FgGreen, `Please wait creating your project ${settings.projectRoot}` );
	}
	const myRoot: string = _path.resolve( __dirname, '..' );
	let template = "/project_template";
	if ( process.env.TASK_TYPE === "TEST" && process.env.SCRIPT === "TS" && settings.isTest === true ) {
		template = "/dist" + template;
	}
	const templateRoot: string = _path.resolve( `${myRoot}${template}` );
	if ( !_fs.existsSync( templateRoot ) )
		throw new Error( `Project template not found in ${templateRoot}\r\nPlease uninstall and install again 'cwserver'` );
	const appRoot: string = _path.resolve( settings.appRoot );
	if ( !_fs.existsSync( appRoot ) ) {
		if ( !isTest ) {
			throw new Error( `App Root not found ${appRoot}\r\nprojectDef.projectRoot like as __dirname` );
		}
		Util.mkdirSync( appRoot );
	}
	const projectRoot: string = _path.resolve( `${appRoot}/${settings.projectRoot}` );
	if ( _fs.existsSync( projectRoot ) ) {
		if ( settings.force !== true ) {
			throw new Error( `Project Root already exists in ${projectRoot}\r\nPlease delete first ${settings.projectRoot}.` );
		}
		Util.rmdirSync( projectRoot );
	}
	Util.mkdirSync( appRoot, settings.projectRoot );
	Util.copySync( _path.resolve( `${templateRoot}/www` ), projectRoot );
	const serverJs: string = _path.resolve( `${appRoot}/server.js` );
	if ( !_fs.existsSync( serverJs ) ) {
		_fs.copyFileSync( _path.resolve( `${templateRoot}/server.js` ), serverJs );
	}
	const webConfig: string = _path.resolve( `${appRoot}/web.config` );
	if ( !_fs.existsSync( webConfig ) ) {
		_fs.copyFileSync( _path.resolve( `${templateRoot}/web.config` ), webConfig );
	}
	// Blank directory ignore both of npm and git
	// So, we've to check before complete project creation
	const temp = '/web/temp/cache/';
	if ( !_fs.existsSync( _path.resolve( `${projectRoot}${temp}` ) ) ) {
		Util.mkdirSync( projectRoot, temp );
		// Create blank directory in project_template/www/ for further use
		Util.mkdirSync( _path.resolve( `${templateRoot}/www` ), temp );
	}
	if ( settings.allExample === true ) {
		console.log( ConsoleColor.FgYellow, `Add all example to your project root ${settings.projectRoot}` );
		Util.mkdirSync( projectRoot, "/example/" );
		console.log( ConsoleColor.FgYellow, `Copying to ${settings.projectRoot}/example/` );
		Util.copySync( _path.resolve( `${templateRoot}/example/` ), _path.resolve( `${projectRoot}/example/` ) );
		console.log( ConsoleColor.FgYellow, `Copying to ${settings.projectRoot}/lib/` );
		Util.copySync( _path.resolve( `${templateRoot}/lib/` ), _path.resolve( `${projectRoot}/lib/` ) );
	}
	if ( isTest ) {
		Util.copyFileSync( _path.resolve( `${templateRoot}/test/app.config.json` ), _path.resolve( `${projectRoot}/config/app.config.json` ) );
		Util.copyFileSync( _path.resolve( `${templateRoot}/test/test.js` ), _path.resolve( `${projectRoot}/lib/view/test.js` ) );
		Util.copyFileSync( _path.resolve( `${templateRoot}/test/socket-client.js` ), _path.resolve( `${projectRoot}/lib/socket-client.js` ) );
	}
	const configPath = _path.resolve( `${projectRoot}/config/app.config.json` );
	const config: { [id: string]: any } | void = Util.readJsonAsync( configPath );
	if ( !config ) {
		throw new Error( configPath );
	}
	if ( config.hostInfo.root !== settings.projectRoot ) {
		config.hostInfo.root = settings.projectRoot;
		_fs.writeFileSync( configPath, JSON.stringify( config ).replace( /{/gi, "{\n" ).replace( /}/gi, "\n}" ).replace( /,/gi, ",\n" ) );
	}
	if ( isTest ) return;
	console.log( ConsoleColor.FgGreen, `
Your project ${settings.projectRoot} created.
run your project by this command
node server ${settings.projectRoot}` );
	console.log( ConsoleColor.Reset );
}