console.elog = function ( e, wt ) {
    if ( e === void 0 )
        throw "No ERROR instance defined!!!";
    if ( Object.prototype.toString.call( e ) !== "[object Error]" )
        throw "Invalid Error Object defined!!!";
    if ( wt === true )
        this.log( "%c✘ Global Error: " + e.stack, "font-weight: bold; font-style:italic; color:#FF0000;" );
    else
        this.log( "%c✘ Error: " + e.stack, "font-weight: bold; font-style:italic; color:#ff0000ad;" );
};
function to_number( v ) {
    v = parseFloat( v );
    return isNaN( v ) ? 0 : v;
};