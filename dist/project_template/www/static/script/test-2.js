/**[String.prototype.in]*/
( typeof ( String.prototype.in ) === "function" ? undefined : ( String.prototype.in = function () {
    if ( ( arguments[0] instanceof [].constructor ) )
        return arguments[0].indexOf( this.toString() ) < 0 ? false : true;
    return Array.prototype.slice.call( arguments, 0 ).indexOf( this.toString() ) < 0 ? false : true;
} ) );
/**[/String.prototype.in]*/
/**[String.prototype.toInLine]*/
( typeof ( String.prototype.toInLine ) === "function" ? undefined : ( String.prototype.toInLine = function () {
    let val = this.toString();
    if ( typeof ( val ) !== "string" ) throw new Exception( "Invalid string defined!!!" );
    return !val ? val : val.replace( /\n/gi, "" ).replace( /\\t/gi, " " ).replace( /\s+/gi, " " ).trim();
} ) );
/**[/String.prototype.toInLine]*/