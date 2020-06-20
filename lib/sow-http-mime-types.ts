/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 12:04 AM 6/19/2020
import * as _fs from 'fs';
import * as _path from 'path';
import { assert, getLibRoot } from './sow-util';
export function loadMimeType(): { [id: string]: string } {
    const libRoot: string = getLibRoot();
    const absPath: string = _path.resolve( `${libRoot}/mime-types.json` );
    assert( _fs.existsSync( absPath ), `No mime-type found in ${libRoot}\nPlease re-install cwserver` );
    const data: string = _fs.readFileSync( absPath, "utf-8" );
    return JSON.parse( data );
}
export function getMimeType( extension: string ): string {
    extension = extension.replace( /^.*[\.\/\\]/gi, '' ).toLowerCase();
    const mimeType: string | undefined = global.sow.HttpMimeType[extension];
    if ( !mimeType )
        throw new Error( `Unsupported extension =>${extension}` );
    return mimeType;
}
export function isValidExtension( extension: string ): boolean {
    return global.sow.HttpMimeType[extension] ? true : false;
}