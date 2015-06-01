var hazy   = require('../src/hazy'),
    should = require('should')

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
        var testMatch =  testStr.match(hazy.lang.expression.all)

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

    })

    describe(':', function() {
      
    })

    describe('~', function() {
      
    })

    describe('@', function() {
      
    })

    describe('*', function() {
      
    })
  })

  describe('process()', function() {

  })
})

describe('fixture', function() {

  describe('get()', function() {

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
