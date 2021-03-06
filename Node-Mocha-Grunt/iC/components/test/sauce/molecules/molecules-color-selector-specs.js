var wd = require('wd');
require('colors');
var _ = require("lodash");
var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");

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
var comp = process.env.COMPONENT; // Component passed as 'molecules-color-selector'.
var job = process.env.JOB_NAME; // Jenkins build name
var svnrev = process.env.SVN_REVISION; //SVN revision number checked out for build.

//check for component type
if(!comp) {
    console.warn(
        'No component specified'
    );
    throw new Error("No component specified for test");
}

//parse component type into separate elements
var bio = comp.split('-');
var testdir = bio[0];

//should return the name of the component, such as 'color-selector'.
if (bio.length > "2") {
    var element = bio[bio.length - 2] + "-" + bio[bio.length - 1];
} else {
    var element = bio[bio.length - 1]
};

var testobj = testdir + "/" + element;
var desired = JSON.parse(process.env.DESIRED || '{browserName: "chrome"}');
desired.name = 'TCOM-UI.' + comp + ' on ' + desired.browserName;
desired.tags = ['tcom-ui', 'jenkins', element, testdir];
desired.build = buildid;
desired.customData = {
    'build No': buildnum,
    'Task': job,
    'SVN Rev': svnrev
};

describe('TCOM-UI.' + comp + ' on ' + desired.browserName, function() {
    var browser;
    var allPassed = true;
    var testenv;

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

    // test location construct
    if(testdir='apps') {
        var location = testenv + "tcom-" + testobj;
    } else {
        var location = testenv + "tcom-ui/" + testobj;
    };
    
    // test cases config starts here
    before(function(done) {
        
        var username = process.env.SAUCE_USERNAME;
        var accessKey = process.env.SAUCE_ACCESS_KEY;
        browser = wd.promiseChainRemote("ondemand.saucelabs.com", 80, username, accessKey);
        
        //optional logging with SauceLabs
        if(process.env.VERBOSE){   
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

    //---Test Cases Start Here---

    it("Load color-selector molecule site", function(done) {
        console.log("testurl",location);

        browser
            .get(location)
            .title()
            .should.eventually.include('Color Selector')
            .nodeify(done);
    });

    it("should include disclaimer text at bottom", function(done) {
        browser
            .elementByClassName('tcom-color-selector-disclaimer')
            .text()
            .should.eventually.include('Prices and colors')
            .nodeify(done);
    });

    it("should display the color name", function(done) {
        browser
            .elementByClassName('tcom-color-selector-name')
            .text()
            .should.eventually.include('METALLIC')
            .nodeify(done);

    });

    it("should display the selector colors area", function(done) {
        browser
            .elementByClassName('tcom-color-selector-colors')
            .nodeify(done);
    });

    it("should be able to click on the color swatches", function() {
        for (var i = 1; i < 6; i++) {
        //console.log('button id',i);
        browser
            .elementByXPath('.//div[2]/button[' + i +']')
            .click()
            .elementByClassName('tcom-color-swatch').getAttribute('class')
            .should.eventually.include('is-on');
        };
        
    });

    it("clicking on any other swatch should update color name", function(done) {
        browser
            .elementByXPath('.//div[2]/button[1]')
            .text()
            .should.not.eventually.include('NAUTICAL')
            .nodeify(done);

    });

    it("clicking on a swatch should indicate swatch selected", function(done) {
        browser
            .elementByXPath('.//div[2]/button[4]')
            .click()
            .elementByXPath('.//div[2]/button[4]').getAttribute('class')
            .should.eventually.include('is-on')
            .nodeify(done);
    });

});