var wd = require('wd');
require('colors');
var _ = require("lodash");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
//var scrape = require("scrape.js");

chai.use(chaiAsPromised);
chai.should();
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

// checking sauce credential
if(!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY){
    console.warn(
        '\nPlease configure your sauce credential:\n\n' +
        'export SAUCE_USERNAME=<SAUCE_USERNAME>\n' +
        'export SAUCE_ACCESS_KEY=<SAUCE_ACCESS_KEY>\n\n'
    );
    throw new Error("Missing sauce credentials");
}

// http configuration, not needed for simple runs
wd.configureHttp({
    timeout: 60000,
    retryDelay: 15000,
    retries: 5
});

var buildid = process.env.BUILD_ID;
var buildnum = process.env.BUILD_NUMBER;
var comp = process.env.COMPONENT; 

//check for component
if(!comp) {
    console.warn(
        'No component specified'
    );
    throw new Error("No component specified for test");
}

var desired = JSON.parse(process.env.DESIRED || '{browserName: "chrome"}');
desired.name = 'TCOM-UI.' + comp + ' on ' + desired.browserName;
desired.tags = ['tcom-ui', 'jenkins', comp];
desired.customData = {
    'Build ID': buildid,
    'Build No': buildnum
};

describe('TCOM-UI.' + comp + ' on ' + desired.browserName, function() {
    var browser;
    var allPassed = true;
    var testenv;
    var testobj = 'molecules/carousel';

    //checking environment 
    if(!process.env.ENV) {
        var testenv = 'http://devcpd122.toyota.com/';
        console.warn(
            'No environment variable specified.\n' +
            'Environment set to Dev CPD 122.'
        );
    } else {
        var testenv = process.env.ENV;
};
    
    before(function(done) {
        
        var username = process.env.SAUCE_USERNAME;
        var accessKey = process.env.SAUCE_ACCESS_KEY;
        browser = wd.promiseChainRemote("ondemand.saucelabs.com", 80, username, accessKey);
        
        if(process.env.VERBOSE){
            // optional logging with SauceLabs    
            browser.on('status', function(info) {
                console.log(info.cyan);
            });
            browser.on('command', function(meth, path, data) {
                console.log(' > ' + meth.yellow, path.grey, data || '');
            });
        }
        browser
            .init(desired)
            .nodeify(done);
    });

    afterEach(function(done) {
        allPassed = allPassed && (this.currentTest.state === 'passed');
        done();
    });

    after(function(done) {
        browser
            .quit()
            .sauceJobStatus(allPassed)
            .nodeify(done);
    });

    it("Load and verify correct test page", function(done) {
        browser
            .get(testenv + '/tcom-ui/' + testobj)
            .title()
            .should.eventually.include('Carousel')
            .nodeify(done);
    });
});    