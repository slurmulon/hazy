var hazy = require('../src/hazy')

exports.lang = function(test) {
    test.expect(1);
    test.ok(true, "this assertion should pass");
    test.done();

    // expressions

    // |
    // :
    // ~
    // @
    // *

    // process
}

exports.fixture = function(test) {
    test.expect(1);
    test.ok(true, "this assertion should pass");
    test.done();

    // get
    // all
    // register
    // process
    // query
    // load
}

exports.matcher = function(test) {
    test.expect(1);
    test.ok(true, "this assertion should pass");
    test.done();

    // config
    // matches
    // hasMatch
    // search
    // process
    // processDeep
}