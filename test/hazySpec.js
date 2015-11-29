import 'blanket'

import * as hazy from '../src/hazy'
import _ from 'lodash'

import chai from 'chai'
import chaiThings from 'chai-things'

chai.should()
chai.use(chaiThings)

//    __                   
//   / /  __ _ _ __   __ _ 
//  / /  / _` | '_ \ / _` |
// / /__| (_| | | | | (_| |
// \____/\__,_|_| |_|\__, |
//                   |___/ 

describe('lang', () => {
  let hazyStub

  beforeEach(() => {
    hazyStub = hazy.fork()
  })

  describe('expressions', () => {
    describe('all', () => {
      it('should match all expressions defined by two | (start/end) tokens and a leading operator in each case', () => {
        const testStr   = 'avoid |*capture1| avoid |*capture2|'
        const testMatch = testStr.match(hazyStub.lang.expression.all)

        '|*capture1|'.should.equal(testMatch[0])
        '|*capture2|'.should.equal(testMatch[1])
      })

      it('should avoid expressions without operators', () => {
        const testStr   = 'avoid |*capture| avoid |naughty|'
        const testMatch = testStr.match(hazyStub.lang.expression.all)

        '|*capture|'.should.equal(testMatch[0])
        testMatch.length.should.equal(1)
      })

      it('should avoid empty expressions', () => {
        const testStr   = 'naughty || naughty'
        const testMatch =  testStr.match(hazyStub.lang.expression.all) === null

        testMatch.should.be.true
      })
    })
  })

  describe('tokens', () => {
    describe('|', () => {
      it('should do nothing unless the next token is a |', () => {
        (function(){
          hazyStub.lang.tokens['|'](null, 'anything')
        }).should.not.throw();

        (function(){
         hazyStub.lang.tokens['|'](null, '|')
        }).should.throw();
      })
    })

    // describe('.', () => {
    //   it('should access the "next" property of the "prev" match', () => {
    //     const testAccessor = hazyStub.lang.tokens['.']({test: 'works'}, 'test')

    //     testAccessor.should.equal('works')
    //   })

    //   it('should throw an exception if there is no "prev" match', () => {
    //     (function(){
    //      hazyStub.lang.tokens['.'](null, '.')
    //     }).should.throw()
    //   })
    // })

    describe('~', () => {
      it('should categorically interface to ChanceJS', () => {
        _.forEach(hazy.meta.random.types, function(subTypes, type) {
          _.forEach(subTypes, function(subType) {
            var randExp = type + '.' + subType,
                randRes = hazyStub.lang.tokens['~'](null, randExp)

            randRes.should.not.be.undefined  
          })
        })
      })

      // TODO - it('should replace valid tokens with appropriate random values')
    })

    describe('*', () => {
      it('should embed fixtures with a matching name', () => {
        const testChild  = {role: 'child'},
              testParent = {role: 'parent', child: '|*testChild|'}

        hazyStub.fixture.register('testChild', testChild)
        hazyStub.fixture.register('testParent', testParent)

        hazyStub.fixture.get('testParent').child.should.equal(testChild)
      })

      // FIXME - should probably make this replace value with 'undefined' instead of leaving an untouched token
      it('should ignore embed links with no matching names', () => {
        const testChild  = {role: 'child'},
              testParent = {role: 'parent', child: '|*missingChild|'}

        hazyStub.fixture.register('testChild', testChild)
        hazyStub.fixture.register('testParent', testParent)

        hazyStub.fixture.get('testParent').child.should.equal('|*missingChild|')
      })

      it('should be independent of whitespace', () => {
        const testChild  = {role: 'child'},
              testParent = {role: 'parent', child: '|*  testChild |'}

        hazyStub.fixture.register('testChild', testChild)
        hazyStub.fixture.register('testParent', testParent)

        hazyStub.fixture.get('testParent').child.should.equal(testChild)
      })
    })

    describe('$', () => {
      it('should embed fixtures matching the provided jsonpath pattern', () => {
        const testFindMe1  = {id: '123'},
              testFindMe2  = {id: '456'},
              testAvoid1   = {bad: 'stuff'}, 
              testSearcher = {allIds: '|$.id|'}

        hazyStub.fixture.register('testFindMe1', testFindMe1)
        hazyStub.fixture.register('testFindMe2', testFindMe2)
        hazyStub.fixture.register('testAvoid1', testAvoid1)
        hazyStub.fixture.register('testSearcher', testSearcher)

        const testFixture = hazyStub.fixture.get('testSearcher')

        testFixture.allIds.should.eql([testFindMe1, testFindMe2])
        testFixture.allIds.should.not.deep.include([testAvoid1])
      })

      it('should be independent of whitespace', () => {
        const testFindMe   = {id: '123'},
              testSearcher = {found: '|$  .id|'}

        hazyStub.fixture.register('testFindMe', testFindMe)
        hazyStub.fixture.register('testSearcher', testSearcher)

        const testFixture = hazyStub.fixture.get('testSearcher')

        testFixture.found.should.deep.include(testFindMe)
      })
    })

    describe('>', () => {
      it('should find and embed fixtures from either the filepath (by glob) or fixture pool', () => {

      })
    })

    describe('?', () => {
      it('should find and embed fixtures from either the filepath (by glob) or fixture pool', () => {

      })
    })
  })

  describe('process()', () => {
    it('should be a defined method', () => {
      hazy.lang.process.should.be.a('function')
    })

    it('should process valid token matches in text', () => {
      hazyStub.fixture.register('foo', 'bar')
      hazyStub.fixture.register('baz', {find: true})
      hazyStub.lang.process('|~ basic.string|').should.be.a('string')
      hazyStub.lang.process('|* foo|').should.equal('bar')
      //hazyStub.lang.process('|$ .find|')
    })

    it('should not process invalid tokens in text', () => {
      hazy.lang.process('|~ web.email').should.equal('|~ web.email')
      hazy.lang.process('| web.email|').should.equal('| web.email|')
      hazy.lang.process('||web.email|').should.equal('||web.email|')
    })

    it('should evaluate text before processing it through the interpolator', () => {
      const stub = '|> _.forEach([1,2,3,4], function(i) {| |~basic.character| |> })|';

      hazy.lang.process(stub).should.have.length(12)
    })
  })

  describe('evaluate()', () => {
    it('should be a defined method', () => {
      hazy.lang.evaluate.should.be.a('function')
    })

    it('should provide fixture pool to template', () => {

    })

    it('should provide random data generators to template', () => {

    })

    describe('>', () => {
      it('should evaluate contents as JavaScript expressions', () => {

      })
    })

    describe('=', () => {
      it('should interpolate contents against the data pool', () => {

      })
    })
  })
})


//    ___ _      _                       
//   / __(_)_  _| |_ _   _ _ __ ___  ___ 
//  / _\ | \ \/ / __| | | | '__/ _ \/ __|
// / /   | |>  <| |_| |_| | | |  __/\__ \
// \/    |_/_/\_\\__|\__,_|_|  \___||___/
//

describe('fixture', () => {
  let hazyStub

  beforeEach(() => {
    hazyStub = hazy.fork()
  })

  afterEach(() => {
    hazyStub.fixture.removeAll()
  })

  describe('get()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.get.should.be.a('function')
    })

    it('should return fixture in pool if it exists and match the fixture against the matcher pool based on config', () => {
      hazyStub.config.matcher.use = true

      const testFixture = {id: '|~misc.guid|'}
      const testMatcher = hazyStub.matcher.config({
        path   : '$.id',
        handle : (fixture) => {
          fixture.matched = true
          return fixture
        }
      })

      hazyStub.fixture.register('theKey', testFixture)

      const result = hazyStub.fixture.get('theKey')

      result.matched.should.be.true
    })

    it('should return fixture in pool if it exists without performing any matching based on the config', () => {
      hazyStub.config.matcher.use = false
      
      const testFixture = {id: '|~misc.guid|'}
      const testMatcher = hazyStub.matcher.config({
        path   : '$.id',
        handle : (fixture) => {
          fixture.matched = true
          return fixture
        }
      })

      hazyStub.fixture.register('theKey', testFixture)

      const result = hazyStub.fixture.get('theKey')

      result.should.not.have.property('matched')
    })
  })

  describe('all()', () => {
    beforeEach(() => {
      hazyStub = hazy.fork()

      hazyStub.matcher.config({
        path   : '$.id',
        handle : (fixture) => {
          fixture.matched = true
          return fixture
        }
      })
      
      hazyStub.fixture.registerAll({'first': {id: '|~misc.guid|'}, 'second': {id: '|~misc.guid|'}})
    })

    it('should be a defined method', () => {
      hazyStub.fixture.all.should.be.a('function')
    })

    it('should return all fixtures in the pool, matching any that exist against the matcher pool based based on config', () => {
      hazyStub.config.matcher.use = true

      const results = hazyStub.fixture.query('$.id')

      results.length.should.eql(2)
      results.should.all.have.property('matched')
    })

    it('should return all fixtures in the pool without performing any matching based on the config', () => {
      hazyStub.config.matcher.use = false

      const results = hazyStub.fixture.query('$.id')

      results.length.should.eql(2)
      results.should.not.include.something.with.property('matched')
    })
  })

  describe('register()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.register.should.be.a('function')
    })
    // TODO - it('should wrap incoming fixtures with a special lazy object when specified')

    xit('should process incoming fixtures and place them into the fixture pool', () => {

    })
  })

  describe('registerAll()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.registerAll.should.be.a('function')
    })

    // TODO
  })

  describe('process()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.process.should.be.a('function')
    })

    // TODO
  })

  describe('query()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.query.should.be.a('function')
    })

    // TODO
  })

  describe('src()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.src.should.be.a('function')
    })

    // TODO
  })
})


//               _       _                   
//   /\/\   __ _| |_ ___| |__   ___ _ __ ___ 
//  /    \ / _` | __/ __| '_ \ / _ \ '__/ __|
// / /\/\ \ (_| | || (__| | | |  __/ |  \__ \
// \/    \/\__,_|\__\___|_| |_|\___|_|  |___/
//

describe('matcher', () => {

  describe('config()', () => {

  })

  describe('matches()', () => {
    
  })

  describe('hasMatch()', () => {
    
  })

  describe('search()', () => {
    
  })

  describe('process()', () => {
    
  })

  describe('processDeep()', () => {
    
  })
})


//    __                 _                 
//   /__\ __ _ _ __   __| | ___  _ __ ___  
//  / \/// _` | '_ \ / _` |/ _ \| '_ ` _ \ 
// / _  \ (_| | | | | (_| | (_) | | | | | |
// \/ \_/\__,_|_| |_|\__,_|\___/|_| |_| |_|
//

describe('random', () => {
  xit('should map to the ChanceJS library', () => {

  })

  it('should return unique values each time a ChanceJS-based own property is accessed', () => {
    const arbRandFunc = hazy.random.misc.guid
    const arbRand1 = arbRandFunc()
    const arbRand2 = arbRandFunc()

    arbRand1.should.not.equal(arbRand2)
  })
})
