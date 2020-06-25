[![Cwserver Logo][cwserver-logo]][cwserver-url]

[![Linux Build][travis-image]][travis-url]
[![Windows Build][appveyor-image]][appveyor-url]
[![npm version][npm-version-image]][npm-version-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Language grade: JavaScript][language-garde-image]][language-garde-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Known Vulnerabilities][kvulnerabilities-image]][kvulnerabilities-url]
[![Dependency Status][david-dep-image]][david-dep-url]
[![devDependency Status][david-dev-image]][david-dev-url]

## cwserver ##
The aim of the project is to create an easy to use, lightweight, ```Complete Web Server Framework``` with default ```NodeJs HTTP Server```.
- The framework also provides default
  - ```Secure User Session```,
  - ```Cookie Parser```,
  - ```Flexible Router```,
  - ```Multiple Views```,
  - ```Virtual Directory```,
  - ```Hidden Directory```,
  - ```Template Engine```,
  - ```Nested Master Template Engine```,
  - ```Post Data Handler (with multipart form data and large file)```,
  - ```Mimetype Handler```,
  - ```WebStream Handler```,
  - ```JS/CSS Bundler```,
  - ```socket.io Interface```,
  - ```Easy way to bind with IIS/NGINX```

Install ```cwserver``` by this command ```npm i cwserver```<br/>
Create ```createProjectTemplate.js``` as following
```
const { createProjectTemplate } = require( 'cwserver' );
createProjectTemplate( {
    appRoot: __dirname,
    projectRoot: "www" /** Your project root folder name*/,
    allExample: false
} );
```
Then run this commmand ```node createProjectTemplate```<br/>
It will create default project template for ```cwserver``` in your application root.<br/>
Now your appRoot look like this
```
appRoot 
├─┬ wwww ( projectRoot )
│ └─┬ config
│   ├ lib
│   ├ template (this contains master template file)
│   ├ web (this contains temp and cache files)
│   └ index.html
├─ node_modules
├─ server.js
├─ package.json
└─ README.md
```
After, run this command ```node server www /**your project root*/```<br/>
### How to setup middleware ###
First process ```app.prerequisites``` every request and then run ```app.use```
```
global.sow.server.on( "register-view", ( app, controller, server ) => {
	app.prerequisites( ( req, res, next ): void => {
		res.setHeader( 'x-frame-options', 'sameorigin' );
		return next();
	} );
	app.use( ( req, res, next ): void => {
		res.setHeader( 'x-frame-options', 'sameorigin' );
		return next();
	} );
} );
```
### How to setup router ? ###
```
global.sow.server.on( "register-view", ( app, controller, server ) => {
    controller
        .any( '/test-any/*', ( ctx, match ) => {
            return ctx.res.json( { reqPath: ctx.path, servedFrom: "/test-any/*", q: match } );
        } )
        .get( '/task/:id/*', ( ctx, match ) => {
            return ctx.res.json( { reqPath: ctx.path, servedFrom: "/task/:id/*", q: match } );
        } )
        .get( '/dist/*', ( ctx, match ) => {
            return ctx.res.json( { reqPath: ctx.path, servedFrom: "/dist/*", q: match } );
        } )
        .get( '/user/:id/settings', ( ctx, match ) => {
            return ctx.res.json( { reqPath: ctx.path, servedFrom: "/user/:id/settings", q: match } );
        } );
} );
```
### How to add Virtual Directory ? ###
```
global.sow.server.on( "register-view", ( app, controller, server ) => {
    const vDir = path.join( path.resolve( server.getRoot(), '..' ), "/project_template/test/" );
    server.addVirtualDir( "/vtest", vDir, ( ctx ) => {
        return mimeHandler.render( ctx, vDir, true );
    } );
    server.addVirtualDir( "/test-virtual", vDir );
    server.addVirtualDir( "/vtest/virtual/", vDir );
} );
```
### Authetication
Session cookie name use from ```app.config.json => session.cookie```<br/>
and session encryption use ```app.config.json => session.key```
```
global.sow.server.on( "register-view", ( app, controller, server ) => {
    controller.get( '/authenticate/:loginId/:roleid', ( ctx, requestParam ) => {
        if ( ctx.req.session.isAuthenticated ) {
            ctx.res.status( 200 ).type( "html" ).send( `Hello ${ctx.req.session.loginId}` );
        } else {
            server.setSession( ctx, /*loginId*/requestParam.query.loginId,/*roleId*/requestParam.query.roleId, /*userData*/{ token: ctx.req.query.token } );
            ctx.res.status( 200 ).type( "html" ).send( `Authentication success ${ctx.req.query.loginId}` );
        }
        return ctx.next( 200 );
    } );
} );
```
### Handle post data ###
```
const { getBodyParser, fsw } = require( 'cwserver' );
global.sow.server.on( "register-view", ( app, controller, server ) => {
    const downloadDir = server.mapPath( "/upload/data/" );
    if ( !fs.existsSync( downloadDir ) ) {
        fsw.mkdirSync( server.mapPath( "/" ), "/upload/data/" );
    }
    const tempDir = server.mapPath( "/upload/temp/" );
    controller.post( '/post-async', async ( ctx ) => {
        const parser = getBodyParser( ctx.req, tempDir );
        await parser.readDataAsync();
        if ( parser.isUrlEncoded() || parser.isAppJson() ) {
            ctx.res.status( 200, { 'Content-Type': 'application/json' } );
            ctx.res.end( JSON.stringify( parser.getJson() ) );
            parser.dispose();
            return ctx.next( 200 );
        }
        parser.saveAsSync( downloadDir ); parser.dispose();
        return ctx.res.status( 200 ).send( "<h1>success</h1>" );
        // or
        // return ctx.res.asHTML( 200 ).end( "<h1>success</h1>" );
        // or
        /*const data = [];
        parser.getFilesSync( ( file ) => {
            data.push( {
                content_type: file.getContentType(),
                name: file.getName(),
                file_name: file.getFileName(),
                content_disposition: file.getContentDisposition(),
                temp_path: file.getTempPath()
            } );
            file.saveAsSync( `${downloadDir}/${Util.guid()}_${file.getFileName()}` );
        } );
        return ctx.res.status( 200 ).json( data );*/
    } )
} );
```
[See more test here](https://github.com/safeonlineworld/cwserver/blob/master/test/test-view.ts)<br/> 
### Template Engine ###
Template can run ```config.defaultExt``` file extension or ```ctx.res.render( ctx, to_file_path )``` <br/>
Example of server-side script in ```config.defaultExt``` or ```app.config.json => template.ext```<br/>
```
ctx.res.render( ctx, server.mapPath( `/index${server.config.defaultExt || ".html"}` ) );
```
Code block:
```
{%
    if( !ctx.session.isAuthenticated ){
       return ctx.next( 401, true );
    } else {
       ctx.write( JSON.stringify( ctx.session ) );
    }
%}
```
Response write: ```{= myVar =}``` or ```ctx.write(myVar)```<br/>
```
{%
    const result = await ctx.server.db.pgsql.executeIoAsync( "my_shcema.__get_dataset", JSON.stringify( {
        login_id: ctx.req.session.loginId
    } ), JSON.stringify( {
        trade_date: "2020-02-03"
    } ) );
%}
{% if ( result.ret_val < 0) { %}
    <span style="color:red">No Data Found...</span>
{% } else { %}
<table style="width:100%">
   <thead>
      <tr>
         <th>Firstname</th>
         <th>Lastname</th>
         <th>Age</th>
      </tr>
   </thead>
   <tbody>
   {% for( const row of result.ret_data_table ){ %}
        <tr>
            <td>{= row.first_name =}</td>
            <td>{= row.last_name =}</td>
            <td>{= row.age_name =}</td>
        </tr>
   {% } %}
   </tbody>
</table>
{% } %}
```
### Nested Master Template ###
```#extends``` keyword define my master template<br/>
You can add multiple file by ```#attach``` keyword
```
www
├─┬ template
│ └─┬ master.html 
│   ├ footer.html
│   ├ header.html
│   └ readme.html
├─ index.html

index.html  ==> #extends /template/readme.html
==> index.html impliment placeholder id of readme.html (parent master)
-------------------------------------------
#extends /template/readme.html
<impl-placeholder id="container">
    container here
</impl-placeholder>
-------------------------------------------
readme.html ==> #extends /template/master.html (parent master)
==> readme.html like as master template and its contains own placeholder and impliment placeholder id of master.html
-------------------------------------------
#extends /template/master.html
<impl-placeholder id="body">
    <!--Here create new placeholder-->
    <placeholder id="container">
    </placeholder>
</impl-placeholder>
<impl-placeholder id="header">
    #attach /template/header.html
</impl-placeholder>
-------------------------------------------
master.html ==> root master template
--------------------------------------------
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<placeholder id="header">
</placeholder>
<body>
    <placeholder id="body">
    </placeholder>
    #attach /template/footer.html
</body>
</html>
--------------------------------------------
```
see more about template /dist/project_template/www <br/><br/>
### server.js ###
You may create server.js file by you:
```
const { ConsoleColor, initilizeServer } = require( 'cwserver' );
let wwwName = void 0;
if ( process.argv.length > 2 ) {
    wwwName = process.argv[2];
} else {
    if ( process.env.APP_POOL_ID ) {
        wwwName = process.env[process.env.APP_POOL_ID];
    }
}
const server = initilizeServer( __dirname, wwwName );
const app = server.init();
process.on( 'exit', () => {
    console.log( "Exited..." );
} );
process.on( 'SIGINT', () => {
    server.log.error( "Caught interrupt signal" );
    server.log.error( "Application Exited..." );
    server.log.reset(); server.log.dispose();
    setTimeout( () => {
        process.exit( 0 );
    }, 200 );
} );
app.listen( server.port, () => server.log.write( `
    [+] Maintance      : https://www.safeonline.world
    [+] Server         : http://localhost:${server.port}
    [+] Socket         : ws://localhost:${server.port}${server.socketPath}
    [~] Running Server...
`, ConsoleColor.FgMagenta ) );
```
Read more about [app.config.json](https://github.com/safeonlineworld/cwserver/blob/master/schema.json)<br/> 
run ```node server your_app_dir_name``` or ```npm start your_app_dir_name```

[travis-image]: https://img.shields.io/travis/safeonlineworld/cwserver/master.svg?label=linux&v=3
[travis-url]: https://travis-ci.org/github/safeonlineworld/cwserver
[appveyor-image]: https://img.shields.io/appveyor/build/rktuxyn/cwserver/master.svg?label=windows&v=3
[appveyor-url]: https://ci.appveyor.com/project/rktuxyn/cwserver
[npm-version-url]: https://badge.fury.io/js/cwserver
[npm-version-image]: https://badge.fury.io/js/cwserver.svg
[downloads-image]: https://img.shields.io/npm/dt/cwserver.svg
[downloads-url]: https://npmcharts.com/compare/cwserver?minimal=true
[language-garde-image]: https://img.shields.io/lgtm/grade/javascript/g/safeonlineworld/cwserver.svg?logo=lgtm&logoWidth=18
[language-garde-url]: https://lgtm.com/projects/g/safeonlineworld/cwserver/context:javascript
[coveralls-image]: https://img.shields.io/coveralls/github/safeonlineworld/cwserver/master
[coveralls-url]: https://coveralls.io/github/safeonlineworld/cwserver?branch=master
[kvulnerabilities-image]: https://snyk.io/test/github/safeonlineworld/cwserver/badge.svg?targetFile=package.json
[kvulnerabilities-url]: https://snyk.io/test/github/safeonlineworld/cwserver?targetFile=package.json
[david-dev-image]: https://img.shields.io/david/dev/safeonlineworld/cwserver
[david-dev-url]: https://david-dm.org/safeonlineworld/cwserver?type=dev
[david-dep-image]: https://img.shields.io/david/safeonlineworld/cwserver
[david-dep-url]: https://david-dm.org/safeonlineworld/cwserver
[cwserver-logo]: https://i.imgur.com/ePQ32xo.png
[cwserver-url]: http://cwserver.safeonline.world/