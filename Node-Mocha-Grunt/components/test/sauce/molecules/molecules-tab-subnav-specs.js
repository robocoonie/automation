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

var desired = JSON.parse(process.env.DESIRED || '{browserName: "chrome"}');
desired.name = 'TCOM-UI.molecule.tabsubnav' + ' on ' + desired.browserName;
desired.tags = ['tcom-ui', 'tabsubnav', 'devixd', 'molecule'];
desired.customData = {
    "component": "tabsubnav",
    "object": "molecule"
};

describe('Molecule Tab Sub Nav (' + desired.browserName + ')', function() {
    var browser;
    var allPassed = true;
    var testenv = 'http://devcpd122.toyota.com/tcom-ui/';
    var testobj = 'molecules/tab-subnav';
    
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

    it("Load Tab Sub Nav", function(done) {
        console.log(testenv + testobj);
        browser
            //.get('http://devixd.toyota.com/tcom-ui/molecules/tab-subnav/')
            .get(testenv + testobj)
            .title()
            .should.eventually.include('Subnav')
            .nodeify(done);
    });

    it("static nav should be present", function(done) {
        browser
            .elementByClassName('tcom-tab-subnav-scrollable')
            .nodeify(done);
    });

    it("nav arrows should not be visible", function(done) {
        browser
            .elementByClassName('tcom-tab-subnav-nav').getAttribute('class')
            .should.eventually.include('tcom-tab-subnav-fadeout-left-off')
            .elementByClassName('tcom-tab-subnav-nav').getAttribute('class')
            .should.eventually.include('tcom-tab-subnav-fadeout-right-off')
            .nodeify(done);
    });

    it("first section title present", function(done) {
        browser
            .elementByCss('div.tab-subnav-section.tcom-section-j')
            .text()
            .should.eventually.include('tcom-section-j')
            .nodeify(done);
    });

    it("clicking on first nav element should highlight it", function(done) {
        browser
            .elementByXPath('.//nav/div/a[1]')
            .click()
            .elementByXPath('.//nav/div/a[1]').getAttribute('class')
            .should.eventually.include('is-on')
            .nodeify(done);
    });

    it("should be able to click on a different nav element", function(done) {
        browser
            .elementByXPath('.//nav/div/a[3]')
            .click()
            .elementByXPath('.//nav/div/a[3]').getAttribute('class')
            .should.eventually.include('is-on')
            .nodeify(done);
    });

    it("clicking on further nav element should change nav background", function(done) {
        browser
            .elementByClassName('fixedsticky').getAttribute('class')
            .should.eventually.include('fixedsticky-on')
            .nodeify(done);
    });

    it("if more elements than can be seen, scrollable nav right active", function(done) {
        browser
            .elementByClassName('tcom-tab-subnav-next').getAttribute('class')
            .should.eventually.include('is-on')
            .nodeify(done);
    });

    it("if scrolled to the right, left nav should be active", function(done) {
        browser
            .elementByXPath('.//nav/div/a[7]')
            .click()
            .elementByClassName('tcom-tab-subnav-prev').getAttribute('class')
            .should.eventually.include('is-on')
            .nodeify(done);
    });
});