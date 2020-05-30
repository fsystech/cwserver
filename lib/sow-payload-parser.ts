/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/safeonlineworld/cwserver) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 11:17 PM 5/5/2020
import { IncomingHttpHeaders } from 'http';
import { IRequest } from './sow-server-core';
import * as _fs from 'fs';
import * as _path from 'path';
import { ToNumber } from './sow-static';
import { Util } from './sow-util';
export interface IPostedFileInfo {
    getContentDisposition(): string;
    getFileSize(): number;
    getName(): string;
    getFileName(): string;
    getContentType(): string;
    saveAs( absPath: string ): void;
    read(): Buffer;
    getTempPath(): string | undefined;
    setInfo( tempFile?: string, fileSize?: number ): void;
    isEmptyHeader(): boolean;
    clear(): void;
}
export interface IPayloadParser {
    isUrlEncoded(): boolean;
    isAppJson(): boolean;
    isMultipart(): boolean;
    isValidRequest(): boolean;
    getFiles( next: ( file: IPostedFileInfo ) => void ): void;
    getData(): string;
    readData( onReadEnd: ( err?: Error | string ) => void ): void;
    readDataAsync(): Promise<void>;
}
const guid = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, ( c: string ) => {
        // tslint:disable-next-line: no-bitwise
        const r = Math.random() * 16 | 0;
        // tslint:disable-next-line: no-bitwise
        const v = c === 'x' ? r : ( r & 0x3 | 0x8 );
        return v.toString( 16 );
    } );
}
const getLine = ( req: IRequest, data: Buffer[] ): string => {
    let outstr = '';
    for ( ; ; ) {
        let c = req.read( 1 );
        if ( !c ) return outstr;
        const str = c.toString();
        switch ( str ) {
            case '\n':
                outstr += str;
                data.push( c );
                return outstr;
            case '\r':
                outstr += str; data.push( c );
                c = req.read( 1 );
                if ( !c ) return outstr;
                outstr += c.toString();// assume \n
                data.push( c );
                return outstr;
            default:
                outstr += str;
                data.push( c );
        }
    }
}
const getHeader = ( headers: IncomingHttpHeaders, key: string ): string => {
    const result = headers[key];
    return typeof ( result ) === "string" ? result.toString() : "";
}
const createDir = ( dir: string ): void => {
    if ( !_fs.existsSync( dir ) ) {
        Util.mkdirSync( dir );
    }
}
const incomingContentType: {
    [key: string]: any;
    URL_ENCODE: string;
    APP_JSON: string;
    MULTIPART: string;
} = {
    URL_ENCODE: "application/x-www-form-urlencoded",
    APP_JSON: "application/json",
    MULTIPART: "multipart/form-data"
}
export enum ContentType {
    URL_ENCODE = 1,
    APP_JSON = 2,
    MULTIPART = 3,
    UNKNOWN = -1
}
const extractBetween = (
    data: string,
    separator1: string,
    separator2: string
): string => {
    let result = "";
    let start = 0;
    let limit = 0;
    start = data.indexOf( separator1 );
    if ( start >= 0 ) {
        start += separator1.length;
        limit = data.indexOf( separator2, start );
        if ( limit > -1 )
            result = data.substring( start, limit );
    }
    return result;
}
const parseHeader = ( data: string ): IPostedFileInfo => {
    const end = "\r\n";
    let part = data.substring( 0, data.indexOf( end ) );
    const disposition = extractBetween( part, "Content-Disposition: ", ";" );
    const name = extractBetween( part, "name=\"", ";" );
    let filename = extractBetween( part, "filename=\"", "\"" );
    part = data.substring( part.length + end.length );
    const cType = extractBetween( part, "Content-Type: ", "\r\n\r\n" );
    // This is hairy: Netscape and IE don't encode the filenames
    // The RFC says they should be encoded, so I will assume they are.
    filename = decodeURIComponent( filename );
    return new PostedFileInfo( disposition, name ? name.replace( /"/gi, "" ) : name, filename, cType );
}
export class PostedFileInfo implements IPostedFileInfo {
    _fcontentDisposition: string;
    _fname: string;
    _fileName: string;
    _fcontentType: string;
    _fileSize: number;
    _isMoved: boolean;
    _tempFile?: string;
    _isDisposed: boolean;
    constructor(
        disposition: string,
        fname: string,
        fileName: string,
        fcontentType: string
    ) {
        this._fcontentDisposition = disposition;
        this._fname = fname; this._fileName = fileName;
        this._fcontentType = fcontentType;
        this._fileSize = 0; this._isMoved = false;
        this._isDisposed = false;
    }
    setInfo( tempFile?: string, fileSize?: number ): void {
        if ( tempFile ) this._tempFile = tempFile;
        if ( fileSize ) this._fileSize = fileSize;
    }
    isEmptyHeader(): boolean {
        return this._fcontentType.length === 0;
    }
    getTempPath(): string | undefined {
        return this._tempFile;
    }
    getContentDisposition(): string {
        return this._fcontentDisposition;
    }
    getFileSize(): number {
        return this._fileSize;
    }
    getName(): string {
        return this._fname;
    }
    getFileName(): string {
        return this._fileName;
    }
    getContentType(): string {
        return this._fcontentType;
    }
    read(): Buffer {
        if ( !this._tempFile || this._isMoved )
            throw new Error( "This file already moved or not created yet." );
        return _fs.readFileSync( this._tempFile );
    }
    saveAs( absPath: string ): void {
        if ( !this._tempFile || this._isMoved === true ) throw new Error( "Method not implemented." );
        _fs.renameSync( this._tempFile, absPath ); delete this._tempFile;
        this._isMoved = true;
    }
    clear(): void {
        if ( this._isDisposed ) return;
        this._isDisposed = true;
        if ( !this._isMoved && this._tempFile ) {
            _fs.unlinkSync( this._tempFile );
        }
        delete this._fcontentDisposition;
        delete this._fname;
        delete this._fileName;
        delete this._fcontentType;
        if ( this._tempFile ) delete this._tempFile;
    }
}
// tslint:disable-next-line: max-classes-per-file
class PayloadDataParser {
    public files: IPostedFileInfo[];
    public payloadStr: string;
    private _tempDir: string;
    private _separator: string;
    private _headerInfo: string;
    private _waitCount: number;
    private _sepLen: number;
    private _isStart: boolean;
    private _writeStream?: _fs.WriteStream;
    private _contentTypeEnum: ContentType;
    private _postedFile?: IPostedFileInfo;
    private _byteCount: number;
    private _errors: string;
    private _isDisposed: boolean;
    private _blockSize: number = 0;
    private _maxBlockSize: number = 10485760; /* (Max block size (1024*1024)*10) = 10 MB */
    constructor(
        tempDir: string, contentType: string, contentTypeEnum: ContentType
    ) {
        this._errors = "";
        this._contentTypeEnum = contentTypeEnum;
        this.files = []; this.payloadStr = "";
        this._tempDir = tempDir;
        if ( this._contentTypeEnum === ContentType.MULTIPART ) {
            // multipart/form-data; boundary=----WebKitFormBoundarymAgyXMoeG3VgeNeR
            const bType: string = "boundary=";
            this._separator = `--${contentType.substring( contentType.indexOf( bType ) + bType.length )}`.trim();
            this._sepLen = this._separator.length;
        } else {
            this._separator = ""; this._sepLen = 0;
        }
        this._isStart = false; this._byteCount = 0;
        this._waitCount = 0; this._headerInfo = "";
        this._isDisposed = false;
    }
    public onRawData( str: string ): void {
        this.payloadStr += str;
    }
    private drain( force: boolean ): void | Promise<void> {
        if ( force || ( this._blockSize > this._maxBlockSize ) ) {
            this._blockSize = 0;
            return new Promise( ( resolve, reject ) => {
                if ( this._writeStream ) {
                    this._writeStream.once( "drain", () => {
                        resolve();
                    } );
                } else {
                    reject( new Error( "stream not avilable...." ) );
                }
            } );
        }
    }
    public onData( line: string, buffer: Buffer ): void | Promise<void> {
        if ( this._waitCount === 0 && ( line.length < this._sepLen || line.indexOf( this._separator ) < 0 ) ) {
            if ( !this._isStart ) return;
            if ( this._writeStream ) {
                const readLen = buffer.byteLength;
                this._byteCount += readLen;
                this._blockSize += readLen;
                if ( this._writeStream.write( buffer ) ) return this.drain( false );
                return this.drain( true );
            }
            return;
        }
        if ( this._isStart && this._writeStream ) {
            this._writeStream.end(); this._isStart = false;
            delete this._writeStream;
            if ( this._postedFile ) {
                this._postedFile.setInfo( void 0, this._byteCount );
                this.files.push( this._postedFile );
                this._postedFile = void 0; this._byteCount = 0;
            }
        }
        if ( this._waitCount > 2 ) {
            this._waitCount = 0;
            this._headerInfo += line; // skip crlf
            this._postedFile = parseHeader( this._headerInfo );
            this._headerInfo = "";
            if ( this._postedFile.isEmptyHeader() ) {
                this._postedFile.clear();
                this._postedFile = void 0;
                return;
            }
            const tempFile = _path.resolve( `${this._tempDir}/${guid()}.temp` );
            this._writeStream = _fs.createWriteStream( tempFile );
            this._postedFile.setInfo( tempFile );
            this._isStart = true;
            return;
        }
        if ( this._waitCount === 0 ) {
            this._headerInfo = "";// assume boundary
            this._waitCount++;
            return;
        }
        if ( this._waitCount < 3 ) {
            this._headerInfo += line;
            this._waitCount++;
            return;
        }
    }
    public getError(): string | void {
        if ( this._errors.length > 0 ) {
            return this._errors;
        }
    }
    private endCurrentStream( exit: boolean ): void {
        if ( this._writeStream && this._isStart === true ) {
            this._writeStream.end();
            if ( this._postedFile ) {
                if ( exit === false ) {
                    this._postedFile.setInfo( void 0, this._byteCount );
                    this.files.push( this._postedFile );
                } else {
                    this._postedFile.clear();
                    this._postedFile = Object.create( null );
                }
                this._isStart = false; this._byteCount = 0;
                delete this._postedFile;
            }
            delete this._writeStream;
        }
    }
    public onEnd(): void {
        if ( this._contentTypeEnum === ContentType.MULTIPART ) {
            return this.endCurrentStream( false );
        }
    }
    public clear(): void {
        if ( this._isDisposed ) return;
        this._isDisposed = true;
        this.files.forEach( pf => pf.clear() );
        this.endCurrentStream( true );
        this.files.length = 0;
        if ( this._writeStream )
            delete this._writeStream;
        if ( this._postedFile )
            delete this._postedFile;
        if ( this._errors )
            delete this._errors;
    }
}
// tslint:disable-next-line: max-classes-per-file
export class PayloadParser implements IPayloadParser {
    private _contentType: string;
    private _contentTypeEnum: ContentType;
    private _contentLength: number;
    private _payloadDataParser: PayloadDataParser;
    private _req: IRequest;
    private _isReadEnd: boolean;
    private _isDisposed: boolean;
    private _clientConnected: boolean;
    constructor( req: IRequest, tempDir: string ) {
        this._isDisposed = false;
        createDir( tempDir );
        if ( !_fs.statSync( tempDir ).isDirectory() ) {
            throw new Error( `Invalid temp dir ${tempDir}` );
        }
        this._contentType = getHeader( req.headers, "content-type" );
        this._contentLength = ToNumber( getHeader( req.headers, "content-length" ) );
        if ( this._contentType.indexOf( incomingContentType.MULTIPART ) > -1 ) {
            this._contentTypeEnum = ContentType.MULTIPART;
        } else if ( this._contentType.indexOf( incomingContentType.URL_ENCODE ) > -1 ) {
            this._contentTypeEnum = ContentType.URL_ENCODE;
        } else if ( this._contentType.indexOf( incomingContentType.APP_JSON ) > -1 ) {
            this._contentTypeEnum = ContentType.APP_JSON;
        } else {
            this._contentTypeEnum = ContentType.UNKNOWN;
        }
        if ( this._contentTypeEnum !== ContentType.UNKNOWN ) {
            this._payloadDataParser = new PayloadDataParser( tempDir, this._contentType, this._contentTypeEnum );
            this._req = req;
        } else {
            this._payloadDataParser = Object.create( null );
            this._req = Object.create( null );
        }
        this._isReadEnd = false; this._clientConnected = true;
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
    public saveAs( outdir: string ): void {
        if ( !this.isValidRequest() )
            throw new Error( "Invalid request defiend...." );
        if ( !this._isReadEnd )
            throw new Error( "Data did not read finished yet..." );
        if ( this._contentTypeEnum !== ContentType.MULTIPART )
            throw new Error( "Multipart form data required...." );
        createDir( outdir );
        if ( !_fs.statSync( outdir ).isDirectory() ) {
            throw new Error( `Invalid outdir dir ${outdir}` );
        }
        this._payloadDataParser.files.forEach( pf => {
            pf.saveAs( _path.resolve( `${outdir}/${pf.getFileName()}` ) );
        } );
    }
    public getFiles( next: ( file: IPostedFileInfo ) => void ): void {
        if ( !this.isValidRequest() )
            throw new Error( "Invalid request defiend...." );
        if ( !this._isReadEnd )
            throw new Error( "Data did not read finished yet..." );
        if ( this._contentTypeEnum !== ContentType.MULTIPART )
            throw new Error( "Multipart form data required...." );
        this._payloadDataParser.files.forEach( ( pf ) => next( pf ) );
        return void 0;
    }
    public getJson(): { [key: string]: any; } {
        const payLoadStr = this.getData();
        if ( this._contentTypeEnum === ContentType.APP_JSON ) {
            return JSON.parse( payLoadStr );
        }
        const outObj: { [key: string]: any; } = {};
        payLoadStr.split( "&" ).forEach( part => {
            const kv = part.split( "=" );
            if ( kv.length === 0 ) return;
            const val = kv[1];
            outObj[decodeURIComponent( kv[0] )] = val ? decodeURIComponent( val ) : void 0;
        } );
        return outObj;
    }
    public getData(): string {
        if ( !this.isValidRequest() )
            throw new Error( "Invalid request defiend...." );
        if ( !this._isReadEnd )
            throw new Error( "Data did not read finished yet..." );
        if ( this._contentTypeEnum === ContentType.URL_ENCODE || this._contentTypeEnum === ContentType.APP_JSON )
            return this._payloadDataParser.payloadStr;
        throw new Error( "You can invoke this method only URL_ENCODE | APP_JSON content type..." );
    }
    public readDataAsync(): Promise<void> {
        return new Promise( ( resolve, reject ) => {
            this.readData( ( err?: Error | string ): void => {
                if ( err ) return reject( typeof ( err ) === "string" ? new Error( err ) : err );
                return resolve();
            } )
        } );
    }
    public readData( onReadEnd: ( err?: Error | string ) => void ): void {
        if ( !this.isValidRequest() )
            throw new Error( "Invalid request defiend...." );
        if ( this._contentTypeEnum === ContentType.URL_ENCODE || this._contentTypeEnum === ContentType.APP_JSON ) {
            this._req.on( "readable", ( ...args: any[] ): void => {
                while ( true ) {
                    if ( !this._clientConnected ) break;
                    const buffer: Buffer[] = [];
                    const data = getLine( this._req, buffer );
                    if ( data === '' ) { break; }
                    this._payloadDataParser.onRawData( data );
                    buffer.length = 0;
                }
            } );
        } else {
            this._req.on( "readable", async ( ...args: any[] ) => {
                while ( true ) {
                    if ( !this._clientConnected ) break;
                    const buffer: Buffer[] = [];
                    const data = getLine( this._req, buffer );
                    if ( data === '' ) { break; }
                    const promise = this._payloadDataParser.onData( data, Buffer.concat( buffer ) );
                    buffer.length = 0;
                    if ( promise ) {
                        await promise;
                    }
                }
            } );
        }
        this._req.on( "close", () => {
            this._clientConnected = false;
            if ( !this._isReadEnd ) {
                this._isReadEnd = true;
                this.clear();
                return onReadEnd( "CLIENET_DISCONNECTED" )
            }
        } );
        this._req.on( "end", () => {
            this._payloadDataParser.onEnd();
            this._isReadEnd = true;
            const error = this._payloadDataParser.getError();
            if ( error ) return onReadEnd( new Error( error ) );
            return onReadEnd();
        } );
    }
    clear(): void {
        if ( this._isDisposed ) return;
        this._isDisposed = true;
        if ( this._isReadEnd ) {
            this._payloadDataParser.clear();
            this._payloadDataParser = Object.create( null );
            this._req = Object.create( null );
        }
    }
}
// 3:20 PM 5/6/2020