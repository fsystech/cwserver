/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 3:15 PM 5/10/2020
import _fs = require( 'fs' );
import _path = require( 'path' );
import { ConsoleColor } from './sow-logger';
import { Util } from './sow-util';
export function createProjectTemplate( settings: {
	appRoot: string;
	projectRoot: string;
	allExample?: boolean;
	force?: boolean;
	isTest?: boolean;
} ): boolean {
	console.log( ConsoleColor.FgGreen, `Please wait creating your project ${settings.projectRoot}` );
	const myRoot: string = _path.resolve( __dirname, '..' );
	const templateRoot: string = _path.resolve( `${myRoot}/project_template` );
	if ( !_fs.existsSync( templateRoot ) )
		throw new Error( `Project template not found in ${templateRoot}\r\nPlease uninstall and install again 'cwserver'` );
	const appRoot: string = _path.resolve( settings.appRoot );
	if ( !_fs.existsSync( appRoot ) )
		throw new Error( `App Root not found ${appRoot}\r\nprojectDef.projectRoot like as __dirname` );
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
		Util.mkdirSync( projectRoot, "/example/jsTemplate/" );
		console.log( ConsoleColor.FgYellow, `Copying to ${settings.projectRoot}/example/jsTemplate/` );
		Util.copySync( _path.resolve( `${templateRoot}/jsTemplate/` ), _path.resolve( `${projectRoot}/example/jsTemplate/` ) );
		console.log( ConsoleColor.FgYellow, `Copying to ${settings.projectRoot}/lib/` );
		Util.copySync( _path.resolve( `${templateRoot}/lib/` ), _path.resolve( `${projectRoot}/lib/` ) );
	}
	if ( settings.isTest === true ) {
		Util.copyFileSync( _path.resolve( `${templateRoot}/test/app.config.json` ), _path.resolve( `${projectRoot}/config/app.config.json` ) );
		Util.copyFileSync( _path.resolve( `${templateRoot}/test/test.js` ), _path.resolve( `${projectRoot}/lib/view/test.js` ) );
	}
	console.log( ConsoleColor.FgYellow, `Find hostInfo ==> root in app_config.json and set ${settings.projectRoot} in\r\n${projectRoot}\\config\\` );
	console.log( ConsoleColor.FgGreen, `
Your project ${settings.projectRoot} created.
run your project by this command
node server ${settings.projectRoot}` );
	console.log( ConsoleColor.Reset );
	return true;
}