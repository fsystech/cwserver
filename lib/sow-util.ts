/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
import { IContext } from './sow-server';
import * as _fs from 'fs';
import * as _path from 'path';
import { pipeline } from 'stream';
import destroy = require( 'destroy' );
const _isPlainObject = ( obj: any ): obj is { [x: string]: any; } => {
    if ( obj === null || obj === undefined ) return false;
    return typeof ( obj ) === 'object' && Object.prototype.toString.call( obj ) === "[object Object]";
}
const _extend = ( destination: any, source: any ): { [x: string]: any; } => {
    if ( !_isPlainObject( destination ) || !_isPlainObject( source ) )
        throw new TypeError( `Invalid arguments defined. Arguments should be Object instance. destination type ${typeof ( destination )} and source type ${typeof ( source )}` );
    for ( const property in source ) {
        if ( property === "__proto__" || property === "constructor" ) continue;
        if ( !destination.hasOwnProperty( property ) ) {
            destination[property] = source[property];
        } else {
            destination[property] = source[property];
        }
    }
    return destination;
}
const _deepExtend = ( destination: any, source: any ): { [x: string]: any; } => {
    if ( typeof ( source ) === "function" ) source = source();
    if ( !_isPlainObject( destination ) || !_isPlainObject( source ) )
        throw new TypeError( `Invalid arguments defined. Arguments should be Object instance. destination type ${typeof ( destination )} and source type ${typeof ( source )}` );
    for ( const property in source ) {
        if ( property === "__proto__" || property === "constructor" ) continue;
        if ( !destination.hasOwnProperty( property ) ) {
            destination[property] = void 0;
        }
        const s = source[property];
        const d = destination[property];
        if ( _isPlainObject( d ) && _isPlainObject( s ) ) {
            _deepExtend( d, s ); continue;
        }
        destination[property] = source[property];
    }
    return destination;
}
export function assert( condition: any, expr: string ) {
    const condType = typeof ( condition );
    if ( condType === "string" ) {
        if ( condition.length === 0 )
            condition = false;
    }
    if ( !condition )
        throw new Error( `Assertion failed: ${expr}` );
}
export function getLibRoot(): string {
    return _path.resolve( __dirname, process.env.SCRIPT === "TS" ? '..' : '../..' );
}
export class Util {
    public static guid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, ( c: string ) => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : ( r & 0x3 | 0x8 );
            return v.toString( 16 );
        } );
    }
    public static extend( destination: any, source: any, deep?: boolean ): { [x: string]: any; } {
        if ( deep === true )
            return _deepExtend( destination, source );
        return _extend( destination, source );
    }
    public static clone( source: { [x: string]: any; } ) {
        return _extend( {}, source );
    }
    /** Checks whether the specified value is an object. true if the value is an object; false otherwise. */
    public static isPlainObject( obj?: any ): obj is { [x: string]: any; } {
        return _isPlainObject( obj );
    }
    /** Checks whether the specified value is an array object. true if the value is an array object; false otherwise. */
    public static isArrayLike( obj?: any ): obj is [] {
        if ( obj === null || obj === undefined ) return false;
        const result = Object.prototype.toString.call( obj );
        return result === "[object NodeList]" || result === "[object Array]" ? true : false;
    }
    public static isError( obj: any ): obj is Error {
        return obj === null || !obj ? false : Object.prototype.toString.call( obj ) === "[object Error]";
    }
    public static throwIfError( obj: any ): void {
        if ( this.isError( obj ) ) throw obj;
    }
    public static pipeOutputStream( absPath: string, ctx: IContext ): void {
        const openenedFile: _fs.ReadStream = _fs.createReadStream( absPath );
        return pipeline( openenedFile, ctx.res, ( err: NodeJS.ErrnoException | null ) => {
            destroy( openenedFile );
            ctx.next( ctx.res.statusCode );
        } ), void 0;
    }
    public static isExists( path: string, next?: ( code?: number | undefined, transfer?: boolean ) => void ): string | boolean {
        const url = _path.resolve( path );
        if ( !_fs.existsSync( url ) ) {
            return next ? ( next( 404, true ), false ) : false;
        }
        return url;
    }
    public static sendResponse(
        ctx: IContext, reqPath: string, contentType?: string
    ): void {
        const url = this.isExists( reqPath, ctx.next );
        if ( !url ) return;
        ctx.res.status( 200, { 'Content-Type': contentType || 'text/html; charset=UTF-8' } );
        return this.pipeOutputStream( String( url ), ctx );
    }
    public static getExtension( reqPath: string ): string | void {
        const index = reqPath.lastIndexOf( "." );
        if ( index > 0 ) {
            return reqPath.substring( index + 1 ).toLowerCase();
        }
        return void 0;
    }
}