/*
* Copyright (c) 2018, SOW ( https://safeonline.world, https://www.facebook.com/safeonlineworld). (https://github.com/RKTUXYN) All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/
// 10:10 PM 5/17/2020
const cwserver = require( "./index" );
const request = require( "superagent" );
const expect = require( "expect.js" );
const fs = require( "fs" );
const path = require( "path" );
let server, app;
describe( "cwserver", function () {
    it( "create project template", function ( done ) {
        cwserver.createProjectTemplate( {
            appRoot: __dirname,
            projectRoot: "www",
            allExample: false,
            force: true, // Delete if projectRoot exists 
            isTest: true // add test view
        } );
        done();
    } );
    it( "initilize server", function ( done ) {
        server = cwserver.initilizeServer( __dirname, "www" );
        expect( server ).not.empty();
        done();
    } );
    it( "initilize application", function ( done ) {
        app = server.init();
        expect( app ).not.empty();
        done();
    } );
    it( "application listen", function ( done ) {
        app.listen( server.port, () => {
            server.log.write( `
    [+] Maintance      : https://www.safeonline.world
    [+] Server         : http://localhost:${server.port}
    [+] Socket         : ws://localhost:${server.port}${server.socketPath}
    [~] Running Server...
            `, cwserver.ConsoleColor.FgMagenta );
            app.getHttpServer().close();
            done();
        } );
    } );
    it( 'send get request to application', function ( done ) {
        app.listen( server.port, () => {
            request
                .get( `http://localhost:${server.port}/` )
                .end( function ( err, res ) {
                    app.getHttpServer().close();
                    expect( err ).not.an( Error );
                    expect( res.status ).to.be( 200 );
                    expect( res.header["content-type"] ).to.be( "text/html" );
                    done();
                } );
        } );
    } );
    it( 'send post request to application', function ( done ) {
        app.listen( server.port, () => {
            request
                .post( `http://localhost:${server.port}/post` )
                .send( JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) )
                .set( 'Content-Type', 'application/json' )
                .end( function ( err, res ) {
                    app.getHttpServer().close();
                    expect( err ).not.an( Error );
                    expect( res.status ).to.be( 200 );
                    expect( res.header["content-type"] ).to.be( "application/json" );
                    expect( res.body.name ).to.be( 'rajibs' );
                    done();
                } );
        } );
    } );
    it( 'should be response type gzip', function ( done ) {
        app.listen( server.port, () => {
            request
                .get( `http://localhost:${server.port}/response` )
                .query( { task: "gzip", data: JSON.stringify( { name: 'rajibs', occupation: 'kutukutu' } ) } )
                .end( function ( err, res ) {
                    app.getHttpServer().close();
                    expect( err ).not.an( Error );
                    expect( res.status ).to.be( 200 );
                    expect( res.header["content-encoding"] ).to.be( "gzip" );
                    done();
                } );
        } );
    } );
    it( 'should be mime type encoding gzip', function ( done ) {
        app.listen( server.port, () => {
            request
                .get( `http://localhost:${server.port}/logo/logo.png` )
                .end( function ( err, res ) {
                    app.getHttpServer().close();
                    expect( err ).not.an( Error );
                    expect( res.status ).to.be( 200 );
                    expect( res.header["content-type"] ).to.be( "image/png" );
                    expect( res.header["content-encoding"] ).to.be( "gzip" );
                    done();
                } );
        } );
    } );
    it( 'should post multipart post file', function ( done ) {
        app.listen( server.port, () => {
            const readStream = fs.createReadStream( path.resolve( "./dist/test.js" ) );
            request
                .post( `http://localhost:${server.port}/upload` )
                .field( 'post-file', readStream )
                .end( function ( err, res ) {
                    readStream.close();
                    app.getHttpServer().close();
                    expect( err ).not.an( Error );
                    expect( res.status ).to.be( 200 );
                    expect( res.header["content-type"] ).to.be( "application/json" );
                    expect( res.body["content_type"] ).to.be( "application/javascript" );
                    expect( res.body["file_name"] ).to.be( "test.js" );
                    expect( res.body["name"] ).to.be( "post-file" );
                    done();
                } );
        } );
    } );
    it( 'should be send n receive data over socket-io', function ( done ) {
        app.listen( server.port, () => {
            const socket = require( 'socket.io-client' ).connect( `http://localhost:${server.port}`, { 'reconnect': true } );
            socket.on( 'connect', ( ) => {
                socket.emit( 'test-msg', { name: 'rajibs', occupation: 'kutukutu' } );
            } );
            socket.on( 'on-test-msg', data => {
                socket.close();
                app.getHttpServer().close();
                expect( data.name ).to.be( 'rajibs' );
                done();
            } );
        } );
    } );
} );