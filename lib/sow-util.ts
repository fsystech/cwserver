/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { IRequest, IResponse } from './sow-server-core';
import _fs = require( 'fs' );
import _path = require( 'path' );
const _isPlainObject = ( obj: any ): obj is { [x: string]: any; } => {
    /// <summary>Tests whether a value is an object.</summary>
    /// <param name="value">Value to test.</param>
    /// <returns type="Boolean">True is the value is an object; false otherwise.</returns>
    // return typeof value === "object";
    if ( obj === null || obj === undefined ) return false;
    return typeof ( obj ) === 'object';
}
const _extend = ( destination: any, source: any ): { [x: string]: any; } => {
    if ( !_isPlainObject( destination ) || !_isPlainObject( source ) )
        throw new TypeError( `Invalid arguments defined. Arguments should be Object instance. destination type ${typeof ( destination )} and source type ${typeof ( source )}` );
    for ( const property in source )
        destination[property] = source[property];
    return destination;
}
const _deepExtend = ( destination: any, source: any ): { [x: string]: any; } => {
    if ( typeof ( source ) === "function" ) source = source();
    if ( !_isPlainObject( destination ) || !_isPlainObject( source ) )
        throw new TypeError( `Invalid arguments defined. Arguments should be Object instance. destination type ${typeof ( destination )} and source type ${typeof ( source )}` );
    // tslint:disable-next-line: forin
    for ( const property in source ) {
        const s = source[property];
        const d = destination[property];
        if ( _isPlainObject( d ) && _isPlainObject( s ) ) {
            _deepExtend( d, s ); continue;
        }
        destination[property] = source[property];
    }
    return destination;
}
// tslint:disable-next-line: no-namespace
export namespace Util {
    export function guid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, ( c: string ) => {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : ( r & 0x3 | 0x8 );
            return v.toString( 16 );
        } );
    }
    export function extend( destination: any, source: any, deep?: boolean ): { [x: string]: any; } {
        if ( deep === true )
            return _deepExtend( destination, source );
        return _extend( destination, source );
    }
    export function clone( source: { [x: string]: any; } ) {
        return _extend( {}, source );
    }
    export function isPlainObject( obj?: any ): obj is { [x: string]: any; } {
        return _isPlainObject( obj );
    }
    export function isArrayLike( obj?: any ): obj is [] {
        /// <summary>Checks whether the specified value is an array object.</summary>
        /// <param name="value">Value to check.</param>
        /// <returns type="Boolean">true if the value is an array object; false otherwise.</returns>
        if ( obj === null || obj === undefined ) return false;
        const result = Object.prototype.toString.call( obj );
        return result === "[object NodeList]" || result === "[object Array]" ? true : false;
    }
    export function isFileModified( a: string, b: string ): boolean {
        // tslint:disable-next-line: one-variable-per-declaration
        const astat = _fs.statSync( a ), bstat = _fs.statSync( b );
        if ( astat.mtime.getTime() > bstat.mtime.getTime() ) return true;
        return false;
    }
    export function isExists( path: string, next?: ( code: number | undefined, transfer?: boolean ) => void ): string | boolean {
        const url = _path.resolve( path );
        if ( !_fs.existsSync( url ) ) {
            // tslint:disable-next-line: no-unused-expression
            return ( next ? next( 404, true ) : undefined ), false;
        }
        return url;
    }
    export function sendResponse( req: IRequest, res: IResponse, next: ( code: number | undefined, transfer?: boolean ) => void, reqPath: string ): void {
        const url = isExists( reqPath, next );
        if ( !url ) return;
        res.writeHead( 200, { 'Content-Type': 'text/html' } );
        return res.end( _fs.readFileSync( String( url ) ) );
    }
    export function getExtension( reqPath: string ): string | void {
        const index = reqPath.lastIndexOf( "." );
        if ( index > 0 ) {
            return reqPath.substring( index + 1 ).toLowerCase();
        }
        return void 0;
    }
}