// 3:15 PM 5/10/2020
import _fs = require( 'fs' );
import _path = require( 'path' );
import { ConsoleColor } from './sow-logger';
import { Util } from './sow-util';
export function createProjectTemplate( projectDef: {
	appRoot: string;
	projectRoot: string;
} ): boolean {
	console.log( ConsoleColor.FgGreen, `Please wait creating your project ${projectDef.projectRoot}` );
	const myRoot: string = _path.resolve( __dirname, '..' );
	const templateRoot: string = _path.resolve( `${myRoot}/project_template` );
	if ( !_fs.existsSync( templateRoot ) )
		throw new Error( `Project template not found in ${templateRoot}\r\nPlease uninstall and install again 'cwserver'` );
	const appRoot: string = _path.resolve( projectDef.appRoot );
	if ( !_fs.existsSync( appRoot ) )
		throw new Error( `App Root not found ${appRoot}\r\nprojectDef.projectRoot like as __dirname` );
	const projectRoot: string = _path.resolve( `${appRoot}/${projectDef.projectRoot}` );
	if ( _fs.existsSync( projectRoot ) )
		throw new Error( `Project Root already exists in ${projectRoot}\r\nPlease delete first ${projectDef.projectRoot}.` );
	Util.mkdirSync( appRoot, projectDef.projectRoot );
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
	if ( !_fs.existsSync( _path.resolve( `${projectRoot}${temp}`) ) ) {
		Util.mkdirSync( projectRoot, temp );
		// Create blank directory in project_template/www/ for further use
		Util.mkdirSync( _path.resolve( `${templateRoot}/www` ), temp );
	}
	console.log( ConsoleColor.FgYellow, `Find hostInfo ==> root in app_config.json and set ${projectDef.projectRoot} in\r\n${projectRoot}\\config\\` );
	console.log( ConsoleColor.FgGreen, `
Your project ${projectDef.projectRoot} created.
run your project by this command
node server ${projectDef.projectRoot}` );
	console.log( ConsoleColor.Reset );
	return true;
}