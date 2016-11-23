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
var comp = process.env.COMPONENT; // Component passed as 'molecules-color-selector'.

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
desired.tags = ['tcom-ui', 'jenkins', comp, testdir];
desired.build = buildid;
desired.customData = {
    'build No': buildnum
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

    var location = testenv + "tcom-ui/" + testobj;
    
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

    it("Load carousel molecule", function(done) {
        console.log(location);
        browser
            .get(location)
            .title()
            .should.eventually.include('Carousel')
            .nodeify(done);
    });

    it("waiting for all elements to load", function(done) {
        browser
            .waitForElementsByClassName('slick-active')
            .nodeify(done);
    });

    it("should load the first image on default", function(done) {
        browser
            .elementByClassName('slick-active').getAttribute('aria-hidden')
            .should.eventually.include('false')
            .elementByClassName('slick-active').getAttribute('data-slick-index')
            .should.eventually.include('0')
            .nodeify(done);
    });

    it("should contain next arrow", function(done) {
        browser
            .elementByClassName('slick-next').getAttribute('aria-label')
            .should.eventually.include('next')
            .nodeify(done);
    });

    it("should contain previous arrow", function(done){
        browser
            .elementByClassName('slick-prev').getAttribute('aria-label')
            .should.eventually.include('previous')
            .nodeify(done);
    });

    it("should contain navigational dots below gallery", function(done) {
        browser
            .elementByCss('ul.slick-dots li.slick-active').getAttribute('aria-hidden')
            .should.eventually.include('false')
            .nodeify(done);
    });

    it("should allow for user to advance gallery", function(done) {
        browser
            .elementByClassName('slick-next')
            .click()
            .elementByCss('div.slick-slide.slick-active').getAttribute('aria-hidden')
            .should.eventually.include('false')
            .elementByCss('div.slick-slide.slick-active').getAttribute('data-slick-index')
            .should.eventually.include('1')
            .nodeify(done);
    });
  

    it("should allow for user to return to previous slide", function(done) {
        browser
            .elementByClassName('slick-prev')
            .click()
            .elementByCss('div.slick-slide.slick-active').getAttribute('aria-hidden')
            .should.become('false')
            .elementByCss('div.slick-slide.slick-active').getAttribute('data-slick-index')
            .should.eventually.include('0')
            .nodeify(done);
    });

    it("should allow for user to go to previous slide", function(done) {
        browser
            .elementByClassName('slick-prev')
            .click()
            .elementByCss('div.slick-slide.slick-active').getAttribute('aria-hidden')
            .should.become('false')
            .elementByCss('div.slick-slide.slick-active').getAttribute('data-slick-index')
            .should.eventually.include('4')
            .nodeify(done);
    });

    it("should be able to advance through all slides", function() {
        for (var i = 0; i < 5; i++) {
            
            browser
                .elementByClassName('slick-next')
                .click()
                .elementByCss('div.slick-slide.slick-active').getAttribute('aria-hidden')
                .should.become('false')
                .elementByCss('div.slick-slide.slick-active').getAttribute('data-slick-index')
                .should.eventually.include(i)
        };
    });

    it("should be able to advance backward through all slides", function() {
        for (var i = 4; i > 0; i--) {
            
            browser
                .elementByClassName('slick-prev')
                .click()
                .elementByCss('div.slick-slide.slick-active').getAttribute('aria-hidden')
                .should.become('false')
                .elementByCss('div.slick-slide.slick-active').getAttribute('data-slick-index')
                .should.eventually.include(i)
        };
    });
});    