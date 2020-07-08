/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:17 PM 5/5/2020
import { EventEmitter } from 'events';
import { deprecate } from 'util';
import * as _fs from 'fs';
import * as _path from 'path';
import Dicer from 'dicer';
import { pipeline } from 'stream';
import os from 'os';
import destroy = require( 'destroy' );
import { IRequest } from './sow-server-core';
import { ToNumber, toString, IDispose, IBufferArray, BufferArray, ErrorHandler } from './sow-static';
import { Util } from './sow-util';
import * as fsw from './sow-fsw';
export type UploadFileInfo = {
    contentType: string;
    name: string;
    fileName: string;
    contentDisposition: string;
    tempPath: string | undefined
};
export type FileInfo = {
    contentDisposition: string;
    name: string;
    fileName: string;
    contentType: string;
}
export interface IPostedFileInfo extends IDispose {
    getContentDisposition(): string;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    saveAsSync( absPath: string ): void;
    saveAs( absPath: string, next: ( err: Error | NodeJS.ErrnoException | null ) => void ): void;
    readSync(): Buffer;
    read( next: ( err: Error | NodeJS.ErrnoException | null, data: Buffer ) => void ): void;
    getTempPath(): string | undefined;
    /** @deprecated since v2.0.3 - use `dispose` instead. */
    clear(): void;
}
interface IMultipartDataReader extends IDispose {
    readonly forceExit: boolean;
    read( partStream: Dicer.PartStream, tempDir: string ): void;
    on( ev: "field", handler: ( buff: Buffer ) => void ): IMultipartDataReader;
    on( ev: "file", handler: ( file: IPostedFileInfo ) => void ): IMultipartDataReader;
    on( ev: "end", handler: ( err?: Error ) => void ): IMultipartDataReader;
}
export interface IBodyParser extends IDispose {
    isUrlEncoded(): boolean;
    isAppJson(): boolean;
    isMultipart(): boolean;
    isValidRequest(): boolean;
    saveAsSync( absPath: string ): void;
    /**
     * Default Urlencoded max length 20971520 (20mb)
     * You can override between this length
     */
    setMaxBuffLength( length: number ): IBodyParser;
    saveAs( outdir: string, next: ( err: Error | NodeJS.ErrnoException | null ) => void, errorHandler: ErrorHandler ): void;
    getUploadFileInfo(): UploadFileInfo[];
    getFilesSync( next: ( file: IPostedFileInfo ) => void ): void;
    getFiles( next: ( file?: IPostedFileInfo, done?: () => void ) => void ): void;
    getJson(): NodeJS.Dict<any>;
    getData(): string;
    parse( onReadEnd: ( err?: Error ) => void ): void;
    parseSync(): Promise<void>;
    /** @deprecated since v2.0.3 - use `parse` instead. */
    readData( onReadEnd: ( err?: Error ) => void ): void;
    /** @deprecated since v2.0.3 - use `parseSync` instead. */
    readDataAsync(): Promise<void>;
    /** @deprecated since v2.0.3 - use `dispose` instead. */
    clear(): void;
}
function dispose<T extends IDispose>( data: T[] ) {
    while ( true ) {
        const instance: T | undefined = data.shift();
        if ( !instance ) break;
        instance.dispose();
    }
}
const incomingContentType: {
    URL_ENCODE: string;
    APP_JSON: string;
    MULTIPART: string;
} = {
    URL_ENCODE: "application/x-www-form-urlencoded",
    APP_JSON: "application/json",
    MULTIPART: "multipart/form-data"
}
enum ContentType {
    URL_ENCODE = 1,
    APP_JSON = 2,
    MULTIPART = 3,
    UNKNOWN = -1
}
function extractBetween(
    data: string,
    separator1: string,
    separator2: string
): string {
    let result: string = "";
    let start: number = 0;
    let limit: number = 0;
    start = data.indexOf( separator1 );
    if ( start >= 0 ) {
        start += separator1.length;
        limit = data.indexOf( separator2, start );
        if ( limit > -1 )
            result = data.substring( start, limit );
    }
    return result;
}
class PostedFileInfo implements IPostedFileInfo {
    private _fileInfo: FileInfo;
    private _isMoved: boolean;
    private _tempFile?: string;
    private _isDisposed: boolean;
    constructor(
        disposition: string,
        fname: string,
        fileName: string,
        fcontentType: string,
        tempFile: string
    ) {
        this._fileInfo = {
            contentDisposition: disposition,
            name: fname,
            fileName,
            contentType: fcontentType
        };
        this._isMoved = false; this._isDisposed = false;
        this._tempFile = tempFile;
    }
    public getTempPath(): string | undefined {
        return this._tempFile;
    }
    public getContentDisposition(): string {
        return this._fileInfo.contentDisposition;
    }
    public getName(): string {
        return this._fileInfo.name;
    }
    public getFileName(): string {
        return this._fileInfo.fileName;
    }
    public getContentType(): string {
        return this._fileInfo.contentType;
    }
    private validate( arg: any ): arg is string {
        if ( !this._tempFile || this._isMoved )
            throw new Error( "This file already moved or not created yet." );
        return true;
    }
    public readSync(): Buffer {
        if ( !this._tempFile || this._isMoved )
            throw new Error( "This file already moved or not created yet." );
        return _fs.readFileSync( this._tempFile );
    }
    public read( next: ( err: Error | NodeJS.ErrnoException | null, data: Buffer ) => void ): void {
        if ( this.validate( this._tempFile ) )
            return _fs.readFile( this._tempFile, next );
    }
    public saveAsSync( absPath: string ): void {
        if ( this.validate( this._tempFile ) ) {
            _fs.copyFileSync( this._tempFile, absPath );
            _fs.unlinkSync( this._tempFile );
            delete this._tempFile;
            this._isMoved = true;
        }
    }
    public saveAs( absPath: string, next: ( err: Error | NodeJS.ErrnoException | null ) => void ): void {
        if ( this.validate( this._tempFile ) ) {
            fsw.moveFile( this._tempFile, absPath, ( err ) => {
                delete this._tempFile;
                this._isMoved = true;
                return next( err );
            } );
        }
    }
    public dispose(): void {
        if ( this._isDisposed ) return;
        this._isDisposed = true;
        if ( !this._isMoved && this._tempFile ) {
            if ( _fs.existsSync( this._tempFile ) )
                _fs.unlinkSync( this._tempFile );
        }
        delete this._fileInfo;
        delete this._tempFile;
    }
    public clear(): void {
        this.dispose();
    }
}
const RE_BOUNDARY: RegExp = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i;
class MultipartDataReader extends EventEmitter implements IMultipartDataReader {
    private _forceExit: boolean;
    private _writeStream?: _fs.WriteStream;
    private _isDisposed: boolean;
    public get forceExit() {
        return this._forceExit;
    }
    private destroy() {
        if ( this._writeStream && !this._writeStream.destroyed ) {
            destroy( this._writeStream );
        }
    }
    private exit( reason: string ): void {
        this._forceExit = true;
        this.emit( "end", new Error( reason ) );
    }
    constructor() {
        super();
        this._isDisposed = false;
        this._forceExit = false;
    }
    public read( partStream: Dicer.PartStream, tempDir: string ) {
        let
            fieldName: string = "", fileName: string = "",
            disposition: string = "", contentType: string = "",
            isFile: boolean = false;
        const body: IBufferArray = new BufferArray();
        partStream.on( "header", ( header: object ): void => {
            for ( const [key, value] of Object.entries( header ) ) {
                if ( Util.isArrayLike<string>( value ) ) {
                    const part: string | undefined = value[0];
                    if ( part ) {
                        if ( key === "content-disposition" ) {
                            if ( part.indexOf( "filename" ) > -1 ) {
                                fileName = extractBetween( part, "filename=\"", "\"" ).trim();
                                if ( fileName.length === 0 ) {
                                    return this.exit( `Unable to extract filename form given header: ${part}` );
                                }
                                fieldName = extractBetween( part, "name=\"", ";" );
                                isFile = true;
                                disposition = part;
                                continue;
                            }
                            fieldName = extractBetween( part, "name=\"", "\"" );
                            fieldName += "=";
                            body.push( fieldName );
                            continue;
                        }
                        if ( key === "content-type" ) {
                            contentType = part.trim();
                        }
                    }
                }
            }
            if ( !isFile ) {
                return partStream.on( "data", ( chunk: string | Buffer ): void => {
                    body.push( chunk );
                } ).on( "end", () => {
                    this.emit( "field", body.data );
                    body.dispose();
                    this.emit( "end" );
                } ), void 0;
            }
            // no more needed body
            body.dispose();
            if ( contentType.length > 0 ) {
                const tempFile: string = _path.resolve( `${tempDir}/${Util.guid()}.temp` );
                this._writeStream = pipeline( partStream, _fs.createWriteStream( tempFile, { 'flags': 'a' } ), ( err: NodeJS.ErrnoException | null ) => {
                    this.destroy();
                    this.emit( "end", err );
                } );
                this.emit( "file", new PostedFileInfo( disposition, fieldName.replace( /"/gi, "" ), fileName.replace( /"/gi, "" ), contentType.replace( /"/gi, "" ), tempFile ) );
            } else {
                return this.exit( "Content type not found in requested file...." );
            }
        } );
    }
    public dispose() {
        if ( this._isDisposed ) return;
        this._isDisposed = true;
        this.removeAllListeners();
        this.destroy();
        delete this._writeStream;
        delete this._forceExit;
    }
}
interface IDataParser extends IDispose {
    readonly files: IPostedFileInfo[];
    readonly body: Buffer;
    onRawData( buff: Buffer | string ): void;
    getRawData( encoding?: BufferEncoding ): string;
    onPart( partStream: Dicer.PartStream,
        next: ( forceExit: boolean ) => void
    ): void;
    getError(): string | void;
}
class DataParser implements IDataParser {
    private _files: IPostedFileInfo[];
    private _body: IBufferArray;
    private _errors: ( Error | NodeJS.ErrnoException )[];
    private _tempDir: string;
    private _readers: IMultipartDataReader[];
    private _buffNd: Buffer;
    public get files(): IPostedFileInfo[] {
        return this._files;
    }
    public get body(): Buffer {
        return this._body.data;
    }
    constructor(
        tempDir: string
    ) {
        this._errors = []; this._files = [];
        this._body = new BufferArray(); this._buffNd = Buffer.from( "&" );
        this._readers = []; this._tempDir = tempDir;
    }
    public onRawData( buff: Buffer | string ): void {
        this._body.push( buff );
    }
    public getRawData( encoding?: BufferEncoding): string {
        return this._body.toString( encoding );
    }
    public onPart( partStream: Dicer.PartStream,
        next: ( forceExit: boolean ) => void
    ): void {
        const reader: IMultipartDataReader = new MultipartDataReader();
        reader.on( "file", ( file: IPostedFileInfo ): void => {
            return this._files.push( file ), void 0;
        } );
        reader.on( "field", ( data: Buffer ): void => {
            if ( this._body.length > 0 ) {
                this.onRawData( this._buffNd );
            }
            return this.onRawData( data );
        } );
        reader.on( "end", ( err?: Error ): void => {
            if ( err ) {
                this._errors.push( err );
            }
            next( reader.forceExit );
            return reader.dispose();
        } );
        reader.read( partStream, this._tempDir );
        this._readers.push( reader );
        return void 0;
    }
    public getError(): string | void {
        if ( this._errors.length > 0 ) {
            let str: string = "";
            for ( const err of this._errors ) {
                str += err.message + "\n";
            }
            return str;
        }
    }
    public dispose(): void {
        dispose( this._readers );
        dispose( this._files );
        this._body.dispose();
        delete this._body;
        if ( this._errors )
            delete this._errors;
    }
}
function decode( str: string ): string {
    return decodeURIComponent( str.replace( /\+/g, ' ' ) );
}
export function decodeBodyBuffer( buff: Buffer, part: ( k: string, v: string ) => void ) {
    let p = 0; const len: number = buff.length;
    while ( p < len ) {
        let nd: number = 0, eq: number = 0;
        for ( let i = p; i < len; ++i ) {
            if ( buff[i] === 0x3D/*=*/ ) {
                if ( eq !== 0 ) {
                    throw new Error( "Malformed data..." );
                }
                eq = i;
            } else if ( buff[i] === 0x26/*&*/ ) {
                nd = i;
                break;
            }
        }
        if ( nd === 0 ) nd = len;
        if ( eq === 0 ) {
            throw new Error( "Malformed data" );
        }
        part( decode( buff.toString( 'binary', p, eq ) ), decode( buff.toString( 'binary', eq + 1, nd ) ) );
        p = nd + 1;
    }
}
const MaxBuffLength: number = 1024 * 1024 * 20; // (20mb)
class BodyParser implements IBodyParser {
    private _contentType: string;
    private _contentTypeEnum: ContentType;
    private _contentLength: number;
    private _parser: IDataParser;
    private _req: IRequest;
    private _isReadEnd: boolean;
    private _isDisposed: boolean;
    private _part: number[];
    private _multipartParser?: Dicer;
    private _maxBuffLength: number;
    constructor(
        req: IRequest,
        tempDir?: string
    ) {
        this._isDisposed = false; this._part = []; this._maxBuffLength = MaxBuffLength;
        this._contentType = toString( req.get( "content-type" ) );
        this._contentLength = ToNumber( req.get( "content-length" ) );
        if ( this._contentType.indexOf( incomingContentType.MULTIPART ) > -1 ) {
            this._contentTypeEnum = ContentType.MULTIPART;
        } else if ( this._contentType.indexOf( incomingContentType.URL_ENCODE ) > -1 && this._contentType === incomingContentType.URL_ENCODE ) {
            this._contentTypeEnum = ContentType.URL_ENCODE;
        } else if ( this._contentType.indexOf( incomingContentType.APP_JSON ) > -1 && this._contentType === incomingContentType.APP_JSON ) {
            this._contentTypeEnum = ContentType.APP_JSON;
        } else {
            this._contentTypeEnum = ContentType.UNKNOWN;
        }
        if ( this._contentTypeEnum !== ContentType.UNKNOWN ) {
            this._parser = new DataParser( tempDir || os.tmpdir() );
            this._req = req;
        } else {
            this._parser = Object.create( null );
            this._req = Object.create( null );
        }
        this._isReadEnd = false;
    }
    public setMaxBuffLength( length: number ): IBodyParser {
        if ( length > MaxBuffLength || length <= 0 )
            throw new Error( `Max buff length should be between ${MaxBuffLength} and non zero` );
        this._maxBuffLength = length;
        return this;
    }
    public isUrlEncoded(): boolean {
        return this._contentTypeEnum === ContentType.URL_ENCODE;
    }
    public isAppJson(): boolean {
        return this._contentTypeEnum === ContentType.APP_JSON;
    }
    public isMultipart(): boolean {
        return this._contentTypeEnum === ContentType.MULTIPART;
    }
    public isValidRequest(): boolean {
        return this._contentLength > 0 && this._contentTypeEnum !== ContentType.UNKNOWN;
    }
    private validate( isMultipart: boolean ): void {
        if ( !this.isValidRequest() )
            throw new Error( "Invalid request defiend...." );
        if ( !this._isReadEnd )
            throw new Error( "Data did not read finished yet..." );
        if ( isMultipart ) {
            if ( this._contentTypeEnum !== ContentType.MULTIPART )
                throw new Error( "Multipart form data required...." );
            return;
        }
    }
    public saveAsSync( outdir: string ): void {
        this.validate( true );
        if ( !fsw.mkdirSync( outdir ) )
            throw new Error( `Invalid outdir dir ${outdir}` );
        return this._parser.files.forEach( pf => {
            return pf.saveAsSync( _path.resolve( `${outdir}/${Util.guid()}_${pf.getFileName()}` ) );
        } );
    }
    public saveAs(
        outdir: string,
        next: ( err: Error | NodeJS.ErrnoException | null ) => void,
        errorHandler: ErrorHandler
    ): void {
        this.validate( true );
        return fsw.mkdir( outdir, "", ( err: NodeJS.ErrnoException | null ): void => {
            return errorHandler( err, () => {
                return this.getFiles( ( file?: IPostedFileInfo, done?: () => void ): void => {
                    if ( !file || !done ) return next( null );
                    return file.saveAs( _path.resolve( `${outdir}/${Util.guid()}_${file.getFileName()}` ), ( serr: Error | NodeJS.ErrnoException | null ): void => {
                        return errorHandler( serr, () => {
                            return done();
                        } );
                    } );
                } );
            } );
        }, errorHandler );
    }
    public getUploadFileInfo(): UploadFileInfo[] {
        this.validate( true );
        const data: UploadFileInfo[] = [];
        this._parser.files.forEach( ( file: IPostedFileInfo ): void => {
            data.push( {
                contentType: file.getContentType(),
                name: file.getName(),
                fileName: file.getFileName(),
                contentDisposition: file.getContentDisposition(),
                tempPath: file.getTempPath()
            } );
        } );
        return data;
    }
    public getFilesSync( next: ( file: IPostedFileInfo ) => void ): void {
        this.validate( true );
        return this._parser.files.forEach( pf => next( pf ) );
    }
    public getFiles( next: ( file?: IPostedFileInfo, done?: () => void ) => void ): void {
        this.validate( true );
        let index: number = -1;
        const forward = (): void => {
            index++;
            const pf: IPostedFileInfo | undefined = this._parser.files[index];
            if ( !pf ) return next();
            return next( pf, () => {
                return forward();
            } );
        };
        return forward();
    }
    public getJson(): NodeJS.Dict<any> {
        this.isValidRequest();
        if ( this._contentTypeEnum === ContentType.APP_JSON ) {
            return JSON.parse( this._parser.getRawData() );
        }
        const outObj: NodeJS.Dict<string> = {};
        decodeBodyBuffer( this._parser.body, ( k: string, v: string ): void => {
            outObj[k] = v;
        } );
        return outObj;
    }
    public getData(): string {
        this.validate( false );
        return this._parser.getRawData();
    }
    public readDataAsync(): Promise<void> {
        return this.parseSync();
    }
    public parseSync(): Promise<void> {
        return new Promise( ( resolve, reject ) => {
            this.parse( ( err?: Error ): void => {
                if ( err ) return reject( err );
                return resolve();
            } );
        } );
    }
    private tryFinish( onReadEnd: ( err?: Error ) => void ): void {
        if ( !this._isReadEnd || this._part.length > 0 ) return void 0;
        const error: string | void = this._parser.getError();
        if ( error ) return onReadEnd( new Error( error ) );
        return onReadEnd();
    }
    private skipPart( partStream: Dicer.PartStream ): void {
        partStream.resume();
    }
    private onPart( onReadEnd: ( err?: Error ) => void ): ( partStream: Dicer.PartStream )=>void {
        return ( partStream: Dicer.PartStream ): void => {
            this._part.push( 1 );
            this._parser.onPart( partStream, ( forceExit: boolean ): void => {
                if ( forceExit ) {
                    this._part.length = 0;
                    this.skipPart( partStream );
                    if ( this._multipartParser ) {
                        this._multipartParser.removeListener( 'part', this.onPart );
                        this._multipartParser.on( "part", this.skipPart )
                    }
                } else {
                    this._part.shift();
                }
                return this.tryFinish( onReadEnd );
            } );
        }
    }
    private finalEvent( ev: "close" | "error", onReadEnd: ( err?: Error ) => void ): ( err?: Error ) => void {
        return ( err?: Error ) => {
            if ( ev === "close" ) {
                if ( this._isReadEnd ) return;
                err = new Error( "CLIENET_DISCONNECTED" );
            }
            this._isReadEnd = true;
            this._part.length = 0;
            return onReadEnd( err );
        }
    }
    public parse( onReadEnd: ( err?: Error ) => void ): void {
        if ( !this.isValidRequest() )
            return onReadEnd( new Error( "Invalid request defiend...." ) );
        if ( this._contentTypeEnum === ContentType.APP_JSON || this._contentTypeEnum === ContentType.URL_ENCODE ) {
            if ( this._contentLength > this._maxBuffLength ) {
                return onReadEnd( new Error( `Max buff length max:${this._maxBuffLength} > req:${this._contentLength} exceed for contentent type ${this._contentType}` ) );
            }
        }
        if ( this._contentTypeEnum === ContentType.URL_ENCODE || this._contentTypeEnum === ContentType.APP_JSON ) {
            this._req.on( "data", ( chunk: any ): void => {
                this._parser.onRawData( chunk );
            } );
            this._req.on( "end", () => {
                this._isReadEnd = true;
                return onReadEnd();
            } );
            this._req.on( "close", this.finalEvent( "close", onReadEnd ) );
            return;
        }
        const match: RegExpExecArray | null = RE_BOUNDARY.exec( this._contentType );
        if ( match ) {
            this._multipartParser = new Dicer( { boundary: match[1] || match[2] } );
            this._multipartParser.on( "part", this.onPart( onReadEnd ) );
            this._multipartParser.on( "finish", (): void => {
                this._isReadEnd = true;
                return this.tryFinish( onReadEnd );
            } );
            this._multipartParser.on( "error", this.finalEvent( "error", onReadEnd ) );
            this._req.on( "close", this.finalEvent( "close", onReadEnd ) );
            this._req.pipe( this._multipartParser );
        }
    }
    public readData( onReadEnd: ( err?: Error ) => void ): void {
        return this.parse( onReadEnd );
    }
    public dispose(): void {
        if ( this._isDisposed ) return;
        this._isDisposed = true;
        if ( this._isReadEnd ) {
            this._parser.dispose();
            delete this._parser;
        }
        if ( this._multipartParser ) {
            this._req.unpipe( this._multipartParser );
            destroy( this._multipartParser );
            delete this._multipartParser;
        }
        delete this._req; delete this._part;
        delete this._contentType;
        delete this._contentLength;
    }
    public clear(): void {
        this.dispose();
    }
}
/** @deprecated since v2.0.3 - use `getBodyParser` instead. */
export const { PayloadParser } = ( () => {
    return { PayloadParser: deprecate( BodyParser, '`PayloadParser` is depreciated, please use `getBodyParser` instead.', 'v2.0.3:1' ) };
} )();
BodyParser.prototype.clear = deprecate( BodyParser.prototype.clear, '`BodyParser.clear` is depreciated, please use `BodyParser.dispose` instead.', 'v2.0.3:2' );
BodyParser.prototype.readData = deprecate( BodyParser.prototype.readData, '`BodyParser.readData` is depreciated, please use `BodyParser.parse` instead.', 'v2.0.3:3' );
BodyParser.prototype.readDataAsync = deprecate( BodyParser.prototype.readDataAsync, '`BodyParser.readDataAsync` is depreciated, please use `BodyParser.parseSync` instead.', 'v2.0.3:4' );
PostedFileInfo.prototype.clear = deprecate( PostedFileInfo.prototype.clear, '`PostedFileInfo.clear` is depreciated, please use `PostedFileInfo.dispose` instead.', 'v2.0.3:5' );
export function getBodyParser(
    req: IRequest,
    tempDir?: string
): IBodyParser {
    return new BodyParser( req, tempDir );
}
// 3:20 PM 5/6/2020