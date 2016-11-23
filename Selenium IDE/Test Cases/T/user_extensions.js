var gotoLabels= {};
var whileLabels = {};

// overload the original Selenium reset function
Selenium.prototype.reset = function() {
    // reset the labels
    this.initialiseLabels();
    // proceed with original reset code
    this.defaultTimeout = Selenium.DEFAULT_TIMEOUT;
    this.browserbot.selectWindow("null");
    this.browserbot.resetPopups();
}


/*
* --- Initialize Conditional Elements --- *
* Run through the script collecting line numbers of all conditional elements
* There are three results arrays: goto labels, while pairs and forEach pairs
*
*/
Selenium.prototype.initialiseLabels = function()
{
    gotoLabels = {};
    whileLabels = { ends: {}, whiles: {} };
    var command_rows = [];
    var numCommands = testCase.commands.length;
    for (var i = 0; i < numCommands; ++i) {
        var x = testCase.commands[i];
        command_rows.push(x);
    }
    var cycles = [];
    var forEachCmds = [];
    for( var i = 0; i < command_rows.length; i++ ) {
        if (command_rows[i].type == 'command')
        switch( command_rows[i].command.toLowerCase() ) {
            case "label":
                gotoLabels[ command_rows[i].target ] = i;
                break;
            case "while":
            case "endwhile":
                cycles.push( [command_rows[i].command.toLowerCase(), i] )
                break;
            case "foreach":
            case "endforeach":
                forEachCmds.push( [command_rows[i].command.toLowerCase(), i] )
                break;
        }
    }
    var i = 0;
    while( cycles.length ) {
        if( i >= cycles.length ) {
            throw new Error( "non-matching while/endWhile found" );
        }
        switch( cycles[i][0] ) {
            case "while":
                if( ( i+1 < cycles.length ) && ( "endwhile" == cycles[i+1][0] ) ) {
                    // pair found
                    whileLabels.ends[ cycles[i+1][1] ] = cycles[i][1];
                    whileLabels.whiles[ cycles[i][1] ] = cycles[i+1][1];
                    cycles.splice( i, 2 );
                    i = 0;
                } else ++i;
                break;
            case "endwhile":
                ++i;
                break;
        }
    }

}

Selenium.prototype.continueFromRow = function( row_num )
{
    if(row_num == undefined || row_num == null || row_num < 0) {
        throw new Error( "Invalid row_num specified." );
    }
    testCase.debugContext.debugIndex = row_num;
}

// do nothing. simple label
Selenium.prototype.doLabel = function(){};

Selenium.prototype.doGotoLabel = function( label )
{
    if( undefined == gotoLabels[label] ) {
        throw new Error( "Specified label '" + label + "' is not found." );
    }
    this.continueFromRow( gotoLabels[ label ] );
};

Selenium.prototype.doGoto = Selenium.prototype.doGotoLabel;

Selenium.prototype.doGotoIf = function( condition, label )
{
    if( eval(condition) ) this.doGotoLabel( label );
}

Selenium.prototype.doWhile = function( condition )
{
    if( !eval(condition) ) {
        var last_row = testCase.debugContext.debugIndex;
        var end_while_row = whileLabels.whiles[ last_row ];
        if( undefined == end_while_row ) throw new Error( "Corresponding 'endWhile' is not found." );
        this.continueFromRow( end_while_row );
    }
}

Selenium.prototype.doEndWhile = function()
{
    var last_row = testCase.debugContext.debugIndex;
    var while_row = whileLabels.ends[ last_row ] - 1;
    if( undefined == while_row ) throw new Error( "Corresponding 'While' is not found." );
    this.continueFromRow( while_row );
}

Selenium.prototype.doPush= function(value, varName)
{
    if(!storedVars[varName]) {
        storedVars[varName] = new Array();
    }
    if(typeof storedVars[varName] !== 'object') {
        throw new Error("Cannot push value onto non-array " + varName);
    } else {
        storedVars[varName].push(value);
    }
}

Selenium.prototype.doStringConvert= function(varName)
{
	var num = new String;
	num = varName;

	var nmb = new Number(num);
	nmb = varName;
}

Selenium.prototype.doRandomString= function(options, varName)
{
    var length = 8;
    var type = 'alphanumeric';
    var o = options.split(',');
    var i = 0;

    for(i=0;i<2;i++) {
        if (o[i] && o[i].match(/^\d+$/))
            length = o[i];
        if (o[i] && o[i].match(/^(?:alphalower)|(?:alphanumeric)|(?:timezone)|(?:status)|(?:alpha)|(?:numeric)$/))
            type = o[i];
    }

    switch(type) {
        case 'alpha' :storedVars[varName] = randomAlpha(length); break;
        case 'numeric' :storedVars[varName] = randomNumeric(length); break;
        case 'alphanumeric' :storedVars[varName] = randomAlphaNumeric(length); break;
        case 'alphalower' :storedVars[varName] = randomAlphaLower(length); break;
		case 'timezone' :storedVars[varName] = randomTZ(length); break;
		case 'status' :storedVars[varName] = randomStat(length); break;
        default :storedVars[varName] = randomAlphaNumeric(length);

    }
}

// Use as RandomString||8,alphanumeric||Variable_name

function randomNumeric(length) {
    var numeric = '0123456789'.split('');
    return generateRandomString(length, numeric);
}

function randomAlpha(length) {
    var alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return generateRandomString(length, alpha);
}

function randomAlphaNumeric(length) {
    var alphanumeric = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return generateRandomString(length,alphanumeric);
}

function generateRandomString(length,chars) {
    var string = '';
    for(i=0;i<length;i++)
        string += chars[Math.floor(Math.random()*chars.length)];
    return string;
}

function randomAlphaLower(length) {
    var alphalower = 'abcdefghijklmnopqrstuvwxyz'.split('');
    return generateRandomString(length, alphalower);
}

function randomTZ(length) {
	var tz = '12345'.split('');
	return generateRandomString(length, tz);
}

function randomStat(length) {
	var stat = 'ACTIVE|PENDING|FAILED|INACTIVE'.split('|');
	return generateRandomString(length, stat);
}

