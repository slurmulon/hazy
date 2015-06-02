require('blanket')

var hazy   = require('../src/hazy'),
    should = require('should'),
    _      = require('lodash')

describe('lang', function() {
  var hazyStub

  beforeEach(function() {
    hazyStub = hazy.fork()
  })

  describe('expressions', function() {
    describe('all', function() {
      it('should match all expressions defined by two | (start/end) tokens and an operator in each case', function() {
        var testStr   = 'avoid |@capture1| avoid |@capture2|'
        var testMatch = testStr.match(hazy.lang.expression.all)

        '|@capture1|'.should.equal(testMatch[0])
        '|@capture2|'.should.equal(testMatch[1])
      })

      it('should avoid expressions without operators', function() {
        var testStr   = 'avoid |@capture| avoid |naughty|'
        var testMatch = testStr.match(hazy.lang.expression.all)

        '|@capture|'.should.equal(testMatch[0])
        testMatch.length.should.equal(1)
      })

      it('should avoid empty expressions', function() {
        var testStr   = 'naughty || naughty'
        var testMatch =  testStr.match(hazy.lang.expression.all) === null

        testMatch.should.be.true
      })
    })
  })

  describe('tokens', function() {
    describe('|', function() {
      it('should do nothing unless the next token is a |', function() {
        (function(){
          hazy.lang.tokens['|'](null, 'anything')
        }).should.not.throw();

        (function(){
         hazy.lang.tokens['|'](null, '|')
        }).should.throw();
      })
    })

    describe(':', function() {
      it('should access the "next" property of the "prev" match', function() {
        var testAccessor = hazy.lang.tokens[':']({test: 'works'}, 'test')

        testAccessor.should.equal('works')
      })

      it('should throw an exception if there is no "prev" match', function() {
        (function(){
         hazy.lang.tokens[':'](null, ':')
        }).should.throw()
      })
    })

    describe('~', function() {
      it('should categorically interface to ChanceJS', function() {
        _.forEach(hazy.meta.random.types, function(subTypes, type) {
          _.forEach(subTypes, function(subType) {
            var randExp = type + ':' + subType,
                randRes = hazy.lang.tokens['~'](null, randExp)

            randRes.should.not.be.undefined  
          })
        })
      })
    })

    describe('@', function() {
      it('should embed fixtures with a matching name', function() {
        var testChild  = {role: 'child'},
            testParent = {role: 'parent', child: '|@testChild|'}

        hazy.fixture.register('testChild', testChild)
        hazy.fixture.register('testParent', testParent)

        hazy.fixture.get('testParent').child.should.equal(testChild)
      })

      // FIXME - should probably make this replace value with 'undefined' instead of leaving an untouched token
      it('should ignore embed links with no matching names', function() {
        var testChild  = {role: 'child'},
            testParent = {role: 'parent', child: '|@missingChild|'}

        hazy.fixture.register('testChild', testChild)
        hazy.fixture.register('testParent', testParent)

        hazy.fixture.get('testParent').child.should.equal('|@missingChild|')
      })

      it('should be independent of whitespace', function() {
        var testChild  = {role: 'child'},
            testParent = {role: 'parent', child: '|@   testChild|'}

        hazy.fixture.register('testChild', testChild)
        hazy.fixture.register('testParent', testParent)

        hazy.fixture.get('testParent').child.should.equal(testChild)
      })
    })

    describe('*', function() {
      it('should embed fixtures matching the provided jsonpath pattern', function() {
        var testFindMe1  = {id: '123'},
            testFindMe2  = {id: '456'},
            testAvoid1   = {bad: 'stuff'}, 
            testSearcher = {allIds: '|*$.id|'}

        hazy.fixture.register('testFindMe1', testFindMe1)
        hazy.fixture.register('testFindMe2', testFindMe2)
        hazy.fixture.register('testAvoid1', testAvoid1)
        hazy.fixture.register('testSearcher', testSearcher)

        var testFixture = hazy.fixture.get('testSearcher')

        testFixture.allIds.should.containDeep([testFindMe1, testFindMe2])
        testFixture.allIds.should.not.containDeep([testAvoid1])
      })

      it('should be independent of whitespace', function() {
        var testFindMe   = {id: '123'},
            testSearcher = {found: '|*  $.id|'}

        hazy.fixture.register('testFindMe', testFindMe)
        hazy.fixture.register('testSearcher', testSearcher)

        var testFixture = hazy.fixture.get('testSearcher')

        testFixture.found.should.containDeep([testFindMe])
      })
    })
  })

  describe('process()', function() {

  })
})

describe('fixture', function() {

  describe('get()', function() {
    it('should return fixture in pool if it exists, and match the fixture against the matcher pool based on config', function() {
      hazy.config.matcher.use = true

      var testFixture = {id: '|~misc:guid|'}
      var testMatcher = hazy.matcher.config({
        path    : '$.id',
        handler : function(fixture) {
          fixture.matched = true
          return fixture
        }
      })

      hazy.fixture.register('theKey', testFixture)

      var result = hazy.fixture.get('theKey')

      result.matched.should.be.true
    })

    it('should return fixture in pool if it exists, and NOT match the fixture against the matcher pool based on config', function() {
      hazy.config.matcher.use = false
      
      var testFixture = {id: '|~misc:guid|'}
      var testMatcher = hazy.matcher.config({
        path    : '$.id',
        handler : function(fixture) {
          fixture.matched = true
          return fixture
        }
      })

      hazy.fixture.register('theKey', testFixture)

      var result = hazy.fixture.get('theKey')

      should.not.exist(result.matched)
    })
  })

  describe('all()', function() {
    
  })

  describe('register()', function() {
    
  })

  describe('process()', function() {
    
  })

  describe('query()', function() {
    
  })

  describe('load()', function() {
    
  })
})

describe('matcher', function() {

  describe('config()', function() {

  })

  describe('matches()', function() {
    
  })

  describe('hasMatch()', function() {
    
  })

  describe('search()', function() {
    
  })

  describe('process()', function() {
    
  })

  describe('processDeep()', function() {
    
  })
})
