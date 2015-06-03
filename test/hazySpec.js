require('blanket')

var hazy   = require('../src/hazy'),
    should = require('should'),
    _      = require('lodash')


//    __                   
//   / /  __ _ _ __   __ _ 
//  / /  / _` | '_ \ / _` |
// / /__| (_| | | | | (_| |
// \____/\__,_|_| |_|\__, |
//                   |___/ 

describe('lang', function() {
  var hazyStub

  beforeEach(function() {
    hazyStub = hazy.fork()
  })

  describe('expressions', function() {
    describe('all', function() {
      it('should match all expressions defined by two | (start/end) tokens and an operator in each case', function() {
        var testStr   = 'avoid |@capture1| avoid |@capture2|'
        var testMatch = testStr.match(hazyStub.lang.expression.all)

        '|@capture1|'.should.equal(testMatch[0])
        '|@capture2|'.should.equal(testMatch[1])
      })

      it('should avoid expressions without operators', function() {
        var testStr   = 'avoid |@capture| avoid |naughty|'
        var testMatch = testStr.match(hazyStub.lang.expression.all)

        '|@capture|'.should.equal(testMatch[0])
        testMatch.length.should.equal(1)
      })

      it('should avoid empty expressions', function() {
        var testStr   = 'naughty || naughty'
        var testMatch =  testStr.match(hazyStub.lang.expression.all) === null

        testMatch.should.be.true
      })
    })
  })

  describe('tokens', function() {
    describe('|', function() {
      it('should do nothing unless the next token is a |', function() {
        (function(){
          hazyStub.lang.tokens['|'](null, 'anything')
        }).should.not.throw();

        (function(){
         hazyStub.lang.tokens['|'](null, '|')
        }).should.throw();
      })
    })

    describe(':', function() {
      it('should access the "next" property of the "prev" match', function() {
        var testAccessor = hazyStub.lang.tokens[':']({test: 'works'}, 'test')

        testAccessor.should.equal('works')
      })

      it('should throw an exception if there is no "prev" match', function() {
        (function(){
         hazyStub.lang.tokens[':'](null, ':')
        }).should.throw()
      })
    })

    describe('~', function() {
      it('should categorically interface to ChanceJS', function() {
        _.forEach(hazy.meta.random.types, function(subTypes, type) {
          _.forEach(subTypes, function(subType) {
            var randExp = type + ':' + subType,
                randRes = hazyStub.lang.tokens['~'](null, randExp)

            randRes.should.not.be.undefined  
          })
        })
      })

      // TODO - it('should replace valid tokens with appropriate random values')
    })

    describe('@', function() {
      it('should embed fixtures with a matching name', function() {
        var testChild  = {role: 'child'},
            testParent = {role: 'parent', child: '|@testChild|'}

        hazyStub.fixture.register('testChild', testChild)
        hazyStub.fixture.register('testParent', testParent)

        hazyStub.fixture.get('testParent').child.should.equal(testChild)
      })

      // FIXME - should probably make this replace value with 'undefined' instead of leaving an untouched token
      it('should ignore embed links with no matching names', function() {
        var testChild  = {role: 'child'},
            testParent = {role: 'parent', child: '|@missingChild|'}

        hazyStub.fixture.register('testChild', testChild)
        hazyStub.fixture.register('testParent', testParent)

        hazyStub.fixture.get('testParent').child.should.equal('|@missingChild|')
      })

      it('should be independent of whitespace', function() {
        var testChild  = {role: 'child'},
            testParent = {role: 'parent', child: '|@   testChild|'}

        hazyStub.fixture.register('testChild', testChild)
        hazyStub.fixture.register('testParent', testParent)

        hazyStub.fixture.get('testParent').child.should.equal(testChild)
      })
    })

    describe('*', function() {
      it('should embed fixtures matching the provided jsonpath pattern', function() {
        var testFindMe1  = {id: '123'},
            testFindMe2  = {id: '456'},
            testAvoid1   = {bad: 'stuff'}, 
            testSearcher = {allIds: '|*$.id|'}

        hazyStub.fixture.register('testFindMe1', testFindMe1)
        hazyStub.fixture.register('testFindMe2', testFindMe2)
        hazyStub.fixture.register('testAvoid1', testAvoid1)
        hazyStub.fixture.register('testSearcher', testSearcher)

        var testFixture = hazyStub.fixture.get('testSearcher')

        testFixture.allIds.should.containDeep([testFindMe1, testFindMe2])
        testFixture.allIds.should.not.containDeep([testAvoid1])
      })

      it('should be independent of whitespace', function() {
        var testFindMe   = {id: '123'},
            testSearcher = {found: '|*  $.id|'}

        hazyStub.fixture.register('testFindMe', testFindMe)
        hazyStub.fixture.register('testSearcher', testSearcher)

        var testFixture = hazyStub.fixture.get('testSearcher')

        testFixture.found.should.containDeep([testFindMe])
      })
    })
  })

  describe('process()', function() {

  })
})


//    ___ _      _                       
//   / __(_)_  _| |_ _   _ _ __ ___  ___ 
//  / _\ | \ \/ / __| | | | '__/ _ \/ __|
// / /   | |>  <| |_| |_| | | |  __/\__ \
// \/    |_/_/\_\\__|\__,_|_|  \___||___/
//

describe('fixture', function() {
  var hazyStub

  beforeEach(function() {
    hazyStub = hazy.fork()
  })

  afterEach(function() {
    hazyStub.fixture.removeAll()
  })

  describe('get()', function() {
    it('should return fixture in pool if it exists and match the fixture against the matcher pool based on config', function() {
      hazyStub.config.matcher.use = true

      var testFixture = {id: '|~misc:guid|'}
      var testMatcher = hazyStub.matcher.config({
        path    : '$.id',
        handler : function(fixture) {
          fixture.matched = true
          return fixture
        }
      })

      hazyStub.fixture.register('theKey', testFixture)

      var result = hazyStub.fixture.get('theKey')

      result.matched.should.be.true
    })

    it('should return fixture in pool if it exists without performing any matching based on the config', function() {
      hazyStub.config.matcher.use = false
      
      var testFixture = {id: '|~misc:guid|'}
      var testMatcher = hazyStub.matcher.config({
        path    : '$.id',
        handler : function(fixture) {
          fixture.matched = true
          return fixture
        }
      })

      hazyStub.fixture.register('theKey', testFixture)

      var result = hazyStub.fixture.get('theKey')

      should.not.exist(result.matched)
    })
  })

  describe('all()', function() {
    beforeEach(function() {
      hazyStub = hazy.fork()

      hazyStub.matcher.config({
        path    : '$.id',
        handler : function(fixture) {
          fixture.matched = true
          return fixture
        }
      })
      
      hazyStub.fixture.registerAll({'first': {id: '|~misc:guid|'}, 'second': {id: '|~misc:guid|'}})
    })

    it('should return all fixtures in the pool, matching any that exist against the matcher pool based based on config', function() {
      hazyStub.config.matcher.use = true

      var results = hazyStub.fixture.query('$.id')

      results.length.should.eql(2)
      results.should.matchEach(function(r) { return r.matched.should.be.true })
    })

    it('should return all fixtures in the pool without performing any matching based on the config', function() {
      hazyStub.config.matcher.use = false

      var results = hazyStub.fixture.query('$.id')

      results.length.should.eql(2)
      results.should.matchEach(function(r) { return r.should.not.have.property('matched') })
    })
  })

  describe('register()', function() {
    // TODO - it('should wrap incoming fixtures with a special lazy object when specified')

    it('should process incoming fixtures and place them into the fixture pool', function() {

    })
  })

  describe('registerAll()', function() {
    
  })

  describe('process()', function() {
    
  })

  describe('query()', function() {
    
  })

  describe('load()', function() {
    
  })
})


//               _       _                   
//   /\/\   __ _| |_ ___| |__   ___ _ __ ___ 
//  /    \ / _` | __/ __| '_ \ / _ \ '__/ __|
// / /\/\ \ (_| | || (__| | | |  __/ |  \__ \
// \/    \/\__,_|\__\___|_| |_|\___|_|  |___/
//

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
