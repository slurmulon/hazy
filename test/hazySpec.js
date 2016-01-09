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

  afterEach(() => {
    hazyStub.fixture.removeAll()
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
        (() => {
          hazyStub.lang.tokens['|'](null, 'anything')
        }).should.not.throw();

        (() => {
         hazyStub.lang.tokens['|'](null, '|')
        }).should.throw();
      })
    })

    describe('~', () => {
      it('should categorically interface to ChanceJS', () => {
        _.forEach(hazy.meta.random.types, (subTypes, type) => {
          _.forEach(subTypes, (subType) => {
            const randExp = type + '.' + subType,
                  randRes = hazyStub.lang.tokens['~'](null, randExp)

            randRes.should.not.be.undefined
            randRes.should.not.equal(`~${randExp}`)
          })
        })
      })
    })

    describe('*', () => {
      it('should embed fixtures with a matching name', () => {
        const testChild  = {role: 'child'},
              testParent = {role: 'parent', child: '|*testChild|'}

        hazyStub.fixture.register('testChild', testChild)
        hazyStub.fixture.register('testParent', testParent)

        hazyStub.fixture.get('testParent').child.should.deep.equal(testChild)
      })

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

        hazyStub.fixture.get('testParent').child.should.deep.equal(testChild)
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

    describe('@', () => {
      // TODO
    })

    xdescribe('?', () => {
      it('should find and embed fixtures from either the filepath (by glob) or fixture pool', () => {
        // TODO
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
      const testTxt = '|> _.forEach([1,2,3,4], (i) => {| |~basic.character| |> })|';

      hazy.lang.process(testTxt).should.have.length(12)
    })
  })

  describe('evaluate()', () => {
    it('should be a defined method', () => {
      hazy.lang.evaluate.should.be.a('function')
    })

    describe('>', () => {
      it('should evaluate contents as JavaScript expressions', () => {
        hazyStub.lang.evaluate('|> print(3 % 2)|').should.equal('1')
      })
    })

    describe('=', () => {
      it('should interpolate tokens against the fixture data pool', () => {
        hazyStub.fixture.register('foo', 'bar')
        hazyStub.lang.evaluate('|= fixture.get("foo")|').should.equal('bar')
      })

      it('should interpolate tokens against the random data generators', () => {
        hazyStub.lang.evaluate('|= random.basic.bool()|').should.match(/^true|false/)
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

    it('should process incoming fixture and place it into the fixture pool', () => {
      hazyStub.fixture.register('foo', {bar: '|~basic.string|'})
      hazyStub.fixture.get('foo').bar.should.not.equal('|~basic.string|')
    })

    it('should process fixture and place it into the pool using the unprocessed key', () => {
      hazyStub.fixture.register('|~misc.guid|', true)
      _.keys(hazyStub.fixture.pool).should.contain('|~misc.guid|')
    })
  })

  describe('registerAll()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.registerAll.should.be.a('function')
    })

    it('should process fixture map and place fixtures into the pool', () => {
      hazyStub.fixture.registerAll({foo: 'bar', baz: '|~basic.string|'})
      hazyStub.fixture.get('foo').should.equal('bar')
      hazyStub.fixture.get('baz').should.not.equal('|~basic.string|')
    })
  })

  describe('process()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.process.should.be.a('function')
    })

    describe('fixtures by type', () => {
      describe('object', () => {
        it('should process each key through hazy.lang', () => {
          const testFixture = {'|~text.word|': true}
          hazyStub.fixture.register('foo', testFixture)

          const testResult = hazyStub.fixture.process(testFixture)
          testResult.should.not.equal(testFixture)
        })

        it('should process each value through hazy.lang', () => {
          const testFixture = {foo: '|~basic.string|', bar: '|~basic.natural|'}

          hazyStub.fixture.process(testFixture).foo.should.not.equal('|~basic.string|')
          hazyStub.fixture.process(testFixture).bar.should.not.equal('|~basic.natural|')
        })
      })

      describe('string', () => {
        it('should process the fixture through lang.process', () => {
          hazyStub.fixture.process('|~basic.natural|').should.match(/^\d+/)
        })
      })

      describe('array', () => {
        it('should recursively process each fixture', () => {
          const testFixtureFoo = {foo: '|~basic.string|'}
          const testFixtureBar = {bar: '|~basic.natural|'}
          const testResult     = hazyStub.fixture.process([testFixtureFoo, testFixtureBar])

          testResult[0].should.have.ownProperty('foo')
          testResult[1].should.have.ownProperty('bar')
        })
      })
    })

    describe('matching', () => {
      it('should only occur if config.matcher.use is true and match is true', () => {
        hazyStub.matcher.config({
          path: '$.a',
          handle: (data) => Object.assign(data, {boom: true})
        })

        hazyStub.config.matcher.use = false
        hazyStub.fixture.process({a: 'b'}, false).should.not.have.ownProperty('boom')

        hazyStub.config.matcher.use = false
        hazyStub.fixture.process({a: 'b'}, true).should.not.have.ownProperty('boom')

        hazyStub.config.matcher.use = true
        hazyStub.fixture.process({a: 'b'}, false).should.not.have.ownProperty('boom')

        hazyStub.config.matcher.use = true
        hazyStub.fixture.process({a: 'b'}, true).should.have.ownProperty('boom')
      })
    })
  })

  describe('processAll()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.processAll.should.be.a('function')
    })

    it('should process a collection of fixtures', () => {
      const testProcess = hazyStub.fixture.processAll(['|~basic.natural|', '|~basic.string|'])

      testProcess.should.not.be.empty
      testProcess[0].should.be.a('string') // TODO - consider returning this as a number instead
      testProcess[1].should.be.a('string')
    })
  })

  describe('query()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.query.should.be.a('function')
    })

    // TODO
  })

  describe('glob()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.glob.should.be.a('function')
    })

    // TODO
  })

  describe('src()', () => {
    it('should be a defined method', () => {
      hazyStub.fixture.src.should.be.a('function')
    })

    it('should find UTF-8 encoded fixtures from either the filepath (by glob) or fixture pool', () => {
      const actualObj   = hazyStub.fixture.src('test/fixtures/glob.js', false)
      const expectedObj = '{"globbin": true}\n'

      actualObj.should.deep.equal(expectedObj)
    })

    it('should find and parse JSON fixtures from either the filepath (by glob) or fixture pool', () => {
      const actualObj   = hazyStub.fixture.src('test/fixtures/glob.js', true)
      const expectedObj = {globbin: true}

      actualObj.should.deep.equal(expectedObj)
    })

    it('should register fixtures found on the filepath (by glob) or fixture pool', () => {
      hazyStub.fixture.src('test/fixtures/glob.js')

      JSON.parse(hazyStub.fixture.get('test/fixtures/glob.js')).should.deep.equal({globbin: true})
    })
  })
})


//               _       _                   
//   /\/\   __ _| |_ ___| |__   ___ _ __ ___ 
//  /    \ / _` | __/ __| '_ \ / _ \ '__/ __|
// / /\/\ \ (_| | || (__| | | |  __/ |  \__ \
// \/    \/\__,_|\__\___|_| |_|\___|_|  |___/
//

describe('matcher', () => {
  let hazyStub

  beforeEach(() => {
    hazyStub = hazy.fork()
  })

  afterEach(() => {
    hazyStub.matcher.pool = {}
    hazyStub.config.matcher.use = true
  })

  describe('pool', () => {
    it('should be a defined object', () => {
      hazyStub.matcher.pool.should.be.an('object')
    })
  })

  describe('config()', () => {
    it('should be a defined method', () => {
      hazyStub.matcher.config.should.be.a('function')
    })

    it('should register a matcher fixture into the matcher pool', () => {
      const testPath = '$..*'
      const testConfig = {path: testPath, handle: true}

      hazyStub.matcher.config(testConfig)
      hazyStub.matcher.pool[testPath].should.deep.equal(testConfig)
    })
  })

  describe('matches()', () => {
    let stubPath
    let stubFixture

    beforeEach(() => {
      stubPath    = '$..foo'
      stubFixture = {foo: '1'}
    })

    it('should be a defined method', () => {
      hazyStub.matcher.matches.should.be.a('function')
    })

    it('should provide a map of all matched JsonPath patterns in the fixture (pattern as key)', () => {
      hazyStub.matcher.config({path: stubPath, handle: () => true})
      hazyStub.matcher.matches(stubFixture).should.deep.equal({'$..foo': ['1']})
    })

    it('should not match any fixtures if `hazy.config.matcher.use` is `false`', () => {
      hazyStub.config.matcher.use = false
      hazyStub.matcher.config({path: stubPath, handle: () => true})
      hazyStub.matcher.matches(stubFixture).should.be.empty
    })
  })

  describe('hasMatch()', () => {
    it('should be a defined method', () => {
      hazyStub.matcher.hasMatch.should.be.a('function')
    })

    it('should provide a map of all matched JsonPath patterns in the fixture (pattern as key)', () => {
      hazyStub.config.matcher.use = true
      hazyStub.matcher.config({path: '$..foo', handle: () => true})
      hazyStub.matcher.hasMatch({foo: 'bar'}).should.be.true
    })
  })

  xdescribe('search()', () => {
    it('should be a defined method', () => {
      hazyStub.matcher.search.should.be.a('function')
    })

    // it('should reject undefined values')
    // it('should not match any fixtures if `hazy.config.matcher.use` or `process` is `false`', () => {})
  })

  xdescribe('process()', () => {
    
  })

  xdescribe('processDeep()', () => {
    
  })
})


//    __                 _                 
//   /__\ __ _ _ __   __| | ___  _ __ ___  
//  / \/// _` | '_ \ / _` |/ _ \| '_ ` _ \ 
// / _  \ (_| | | | | (_| | (_) | | | | | |
// \/ \_/\__,_|_| |_|\__,_|\___/|_| |_| |_|
//

describe('random', () => {
  it('should map to the ChanceJS library', () => {
    _.forEach(hazy.meta.random.types, (subTypes, type) => {
      _.forEach(subTypes, (subType) => {
        _.get(hazy.random, `${type}.${subType}`).should.be.instanceof(Function)
      })
    })
  })

  it('should return unique values each time a ChanceJS-based own property is accessed', () => {
    const arbRandFunc = hazy.random.misc.guid
    const arbRand1 = arbRandFunc()
    const arbRand2 = arbRandFunc()

    arbRand1.should.not.equal(arbRand2)
  })

  it('should allow a configuration object to be provided to random factories', () => {
    const arbRandFunc = hazy.random.basic.integer
    const arbRand1 = arbRandFunc({min: 0,  max: 10})
    const arbRand2 = arbRandFunc({min: -5, max: 5})

    arbRand1.should.not.be.above(10)
    arbRand1.should.not.be.below(0)
    arbRand2.should.not.be.above(5)
    arbRand2.should.not.be.below(-5)
  })
})
