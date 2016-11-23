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
wd.configureHttp( {
    timeout: 60000,
    retryDelay: 15000,
    retries: 5
});

var desired = JSON.parse(process.env.DESIRED || '{browserName: "chrome"}');
desired.name = 'TCOM-UI.molecule.detailviewefc' + ' on ' + desired.browserName;
desired.tags = ['tcom-ui','detail-view', 'efc', 'devixd', 'molecule'];
desired.customData = {
    "server": "devixd.toyota.com",
    "component": "detail-view-efc",
    "object": "molecule"
};

describe('Molecule Detail View EFC DEVIXD (' + desired.browserName + ')', function() {
    var browser;
    var allPassed = true;
    var testenv = 'http://devcpd122.toyota.com/tcom-ui/';
    var testobj = 'molecules/detail-view';
    
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

    it("Load Detail View EFC Component page", function(done) {
        browser
            //.get('http://devixd.toyota.com/tcom-ui/molecules/detail-view')
            .get(testenv + testobj)
            .title()
            .should.eventually.include('Detail View')
            .nodeify(done);
    });

    xit("Verify nav bar present", function(done) {
        browser
            .elementByClassName('content')
            .nodeify(done);
    });

    xit("Verify at least one button present", function(done) {
        browser
            //.waitForElementByClassName('content')
            .elementByCss('a.tcom-btn.tcom-btn-one')
            .should.eventually.exist
            .nodeify(done);
    });

    it("Click on first button and verify modal present", function(done) {
        browser
            .elementByXPath('.//div/a[1]')
            .click()
            .elementByClassName('tcom-modal-wrapper')
            .should.eventually.include('is-on')
            .nodeify(done);
    });

    xit("Modal should have a close button. Click should close.", function(done) {
        browser
            .waitForElementByClassName('tcom-modal-close-wrapper')
            .elementByClassName('tcom-modal-close-wrapper')
            .click()
            .nodeify(done);

    });

    xit("Modal should contain a title that (non-conditionally) matches link button.", function(done) {
        browser
            //.elementByXPath('.//div/a[1]')
            .elementByClassName('tcom-detail-view-title')
            .text()
            .should.become('All-Weather Floor Mats')
            .nodeify(done);
    });

    it("Add button clicked should function", function(done) {
        browser
            .elementByCss('button.tcom-btn.tcom-btn-two.add-button')
            .click()
            .alertText()
            .should.eventually.include('Add button was clicked')
            .dismissAlert()
            .nodeify(done);
    });
});