'use strict'

import _ from 'lodash'
import jsonPath from 'jsonpath'
import Chance from 'chance'
import fs from 'fs'
import glob from 'glob'

let hazy = {}


//    ___             __ _       
//   / __\___  _ __  / _(_) __ _ 
//  / /  / _ \| '_ \| |_| |/ _` |
// / /__| (_) | | | |  _| | (_| |
// \____/\___/|_| |_|_| |_|\__, |
//                         |___/ 

hazy.config = {
  seed: null,
  lazy: true,
  debug: false,
  matcher: {
    use: true
  },
  errors: {
    quiet: false,
    soft: false
  }
}

hazy.meta = {
  random: {
    types: {
      basic  : ['bool', 'character', 'integer', 'natural', 'string'],
      text   : ['paragraph', 'sentence', 'syllable', 'word'],
      person : ['age', 'birthday', 'cpf', 'first', 'gender', 'last', 'name', 'prefix', 'ssn', 'suffix'],
      mobile : ['android_id', 'apple_token', 'bb_pin', 'wp7_anid', 'wp8_anid2'],
      web    : ['color', 'domain', 'email', 'fbid', 'google_analytics', 'hashtag', 'ip', 'ipv6', 'klout', 'tld', 'twitter', 'url'],
      geo    : ['address', 'altitude', 'areacode', 'city', 'coordinates', 'country', 'depth', 'geohash', 'latitude', 'longitude', 'phone', 'postal', 'province', 'state', 'street', 'zip'],
      time   : ['ampm', 'date', 'hammertime', 'hour', 'millisecond', 'minute', 'month', 'second', 'timestamp', 'year'],
      misc   : ['guid', 'hash', 'normal', 'radio', 'tv'] 
    } // TODO - support n, unique and weighted! very useful
  }
}


//    __                   
//   / /  __ _ _ __   __ _ 
//  / /  / _` | '_ \ / _` |
// / /__| (_| | | | | (_| |
// \____/\__,_|_| |_|\__, |
//                   |___/ 

hazy.lang = {
  expression: {
    first : /\|(:|~|@|\*)(.*?)?\|/,
    all   : /\|(:|~|@|\*)(.*?)?\|/g
  },

  tokens: {
    // expression start/end
    '|': (prev, next) => {
      const isNextTokenEnd = /\|/.test(next)

      if (isNextTokenEnd) {
        throw hazy.lang.exception('Cannot define an empty expression')
      }

      if (!next) {
        // TODO - return a special value saying that this is the end of the token expression sequence. currenlty not technically needed
      }
    },

    // property separator / accessor
    ':': (prev, next) => { // property accessor
      if (!prev) {
        throw hazy.lang.exception('Syntax error, : requires a left operand')
      }

      return prev[next]
    },

    // random data
    '~': (prev, next) => {
      const randProp   = next.split(':')[0],
            randVal    = next.split(':')[1],
            canUseProp = hazy.random.hasOwnProperty(randProp)

      if (canUseProp) {
        const randObjByProp  = hazy.random[randProp],
              randObjSubType = randVal // get property of random operator following ":"

        if (!randObjByProp || !randObjByProp[randObjSubType]) {
          throw hazy.lang.exception('Invalid random data type "' + randObjSubType + '". Supported:', hazy.meta.random.types[randProp])
        }

        return randObjByProp[randObjSubType]()
      } else {
        throw hazy.lang.exception('Invalid random data category "' + randProp + '". Supported', hazy.meta.random.types)
      }
    },

    // embed fixture
    '@': (prev, next) => hazy.fixture.get(next.trim()),

    // query and embed fixture
    '*': (prev, next) => hazy.fixture.query(next.trim()),

    // TODO - / escape character
    // TODO - ? random character

    validate: (token) => hazy.lang.tokens.hasOwnProperty(token),

    process: (token, prev, next, rest) => _.bindKey(hazy.lang.tokens, token, prev, next, rest)()
  },

  // extracts tokens from strs and evaluates them. interpolates strings, ignores and simply returns other data types
  process: (str) => {
    const matches = str.split(hazy.lang.expression.all),
          tokens  = []

    _.forEach(matches, (match, i) => {
      const isToken = hazy.lang.tokens.validate(match)

      if (isToken) {
        const prevMatch   = matches[i - 1],
              nextMatch   = matches[i + 1],
              restMatches = _.drop(matches, i + 1),
              tokenResult = hazy.lang.tokens.process(match, prevMatch, nextMatch, restMatches)

        if (tokenResult) {
          // if processed token result is a string, substitute original string as we iterate
          if (_.isString(tokenResult)) {
            str = str.replace(hazy.lang.expression.first, tokenResult)
          } else {
            tokens.push(tokenResult)
          }
        }
      }
    }, this)

    if (!_.isEmpty(tokens)) {
      return _.reduce(tokens) || str
    }

    return str
  },

  exception: (msg) => new Error('[Hazy syntax error] ' + msg)
}


//    ___ _      _                       
//   / __(_)_  _| |_ _   _ _ __ ___  ___ 
//  / _\ | \ \/ / __| | | | '__/ _ \/ __|
// / /   | |>  <| |_| |_| | | |  __/\__ \
// \/    |_/_/\_\\__|\__,_|_|  \___||___/
//

hazy.fixture = {
  pool: {},

  // fetches a fixture from the pool and processes it if necessary
  get: (key) => {
    const fixture = hazy.fixture.pool[key]

    if (hazy.config.matcher.use) {
      return hazy.matcher.processDeep(fixture)
    }

    return fixture
  },

  // lazily acquires a fixture from the pool, processing it only once
  lazyGet: _.memoize(key => hazy.fixture.get(key)),

  // fetches all fixtures from the pool and processes them if necessary
  all: () => _.map(hazy.fixture.pool, (fixture, name) => hazy.fixture.get(name)),

  // registers a processable fixture into the fixture pool
  register: (name, fixture) => {
    hazy.fixture.pool[name] = hazy.fixture.process(fixture) // FIXME - wrap with a special lazy object opposed to just wrapping with a function, too ambiguous
  },

  // registers an array of processable fixtures into the fixture pool
  registerAll: (fixtureMap) => {
    if (_.isObject(fixtureMap)) {
      _.each(fixtureMap, (fixture, name) => hazy.fixture.register(name, fixture))
    } else {
      throw new Error('Fixture map following {name: fixture} must be provided')
    }
  },

   // dynamically process fixture values by type (object, string, array, or function)
  process: (fixture) => {
    const processedFixture = fixture

    if (_.isPlainObject(fixture)) {
      _.forEach(fixture, (value, key) => {
        const processedKey = hazy.lang.process(key),
              nextFixture  = value
            
        processedFixture[processedKey] = hazy.fixture.process(nextFixture)
      })
    }

    if (_.isString(fixture)) {
      return hazy.lang.process(fixture)
    }
    
    if (_.isArray(fixture)) {
      return _.map(fixture, hazy.fixture.process)
    }

    return processedFixture
  },

  // processes each fixture in the array
  processAll: (fixtures) => fixtures.map(fixture => hazy.fixture.process(fixture)),

  // queries the fixture pool for anything that matches the jsonpath pattern and processes it
  query: (pattern, match) => hazy.matcher.search(pattern, match),

  // load and register a fixture from files matching a glob pattern
  load: (pattern, options) => {
    glob(pattern, options, (err, files) => {
      if (err) {
        throw new Error('Failed to load file')
      }

      _.forEach(files, (file) => {
        hazy.fixture.register(file.name, JSON.parse(file))
      })
    })
  },

  // removes a fixture by name from the pool
  remove: (name) => {
    delete hazy.fixture.pool[name]
  },

  // removes all fixtures from the pool
  removeAll: () => {
    hazy.fixture.pool = {}
  }
}


//               _       _                   
//   /\/\   __ _| |_ ___| |__   ___ _ __ ___ 
//  /    \ / _` | __/ __| '_ \ / _ \ '__/ __|
// / /\/\ \ (_| | || (__| | | |  __/ |  \__ \
// \/    \/\__,_|\__\___|_| |_|\___|_|  |___/
//

hazy.matcher = {
  // source of all fixture matchers
  pool: {},

  // registers a fixture pattern with a value into the matcher pool
  register: (path, value) => {
    hazy.matcher.pool[path] = value
  },

  // registers a fixture pattern with an advanced config into the matcher pool
  config: (config) => {
    const matcherPath    = config.path,
          matcherHandler = config.handler

    if (hazy.matcher.pool[matcherPath]) {
      delete hazy.matcher.pool[matcherPath]
    }

    hazy.matcher.pool[matcherPath] = {path: matcherPath, handler: matcherHandler}
  },

  // provides a map of all matched patterns in a fixture (pattern as key)
  matches: (fixture) => {
    let matches = {}

    if (hazy.config.matcher.use) {
      _.forEach(hazy.matcher.pool, (v, pattern) => {
        if (_.isObject(fixture)) {
          const jpMatches = jsonPath.query(fixture, pattern)

          if (!_.isEmpty(jpMatches)) {
            matches[pattern] = jpMatches
          }
        }
      })
    } else {
      // WARN - matching disabled
    }

    return matches
  },

  // determines if any matches in the pool apply to the fixture
  hasMatch: (fixture) => !_.isEmpty(
    hazy.matcher.matches(fixture)
  ),

  // search the fixture pool for fixtures matching a specific pattern (intentionally non-lazy- prone to recursion hell and there's also little benefit in evaluating random values)
  search: (pattern, process) => {
    const fixtures = _.values(hazy.fixture.pool) 

    return _(fixtures)
      .map(fixture => {
        const jpMatches = jsonPath.query(fixture, pattern)

        if (!_.isEmpty(jpMatches)) {
          // process functional matches if desired
          if (_.isUndefined(process) ? hazy.config.matcher.use : process) {
            return hazy.matcher.process(pattern, fixture)
          }

          return fixture
        }
      })
      .reject(_.isUndefined)
      .value()
  },

  // executes a single pattern matcher handler on a fixture.
  // passive. does not consider non-matching patterns an error unless the matcher is corrupt
  process: (pattern, fixture) => {
    const matcher = hazy.matcher.pool[pattern]

    if (matcher) {
      if (_.isObject(matcher) && _.isFunction(matcher.handler)) {
        const matches = jsonPath.query(fixture, pattern)

        return matcher.handler(fixture, matches, pattern)
      } else {
        throw 'Match pattern does not apply to fixture or handler is not a function'
      }
    }

    return fixture
  },

  // executes handlers for all pattern matches on a fixture
  processDeep: (fixture) => {
    const patternMatches = hazy.matcher.matches(fixture)
    let processedFixture = fixture

    _.forEach(patternMatches, (match, pattern) => {
      processedFixture = hazy.matcher.process(pattern, fixture) || processedFixture
    })

    return processedFixture
  }
}


//    __                 _                 
//   /__\ __ _ _ __   __| | ___  _ __ ___  
//  / \/// _` | '_ \ / _` |/ _ \| '_ ` _ \ 
// / _  \ (_| | | | | (_| | (_) | | | | | |
// \/ \_/\__,_|_| |_|\__,_|\___/|_| |_| |_|
//

hazy.random = _.mapValues(hazy.meta.random.types, (value, key) => {
  let hazyRandObj = {}
  
  _.forEach(value, v => {
     hazyRandObj[v] = () => new Chance()[v]()
  })
  
  return hazyRandObj
})


//    ___       _ _     _ 
//   / __\_   _(_) | __| |
//  /__\// | | | | |/ _` |
// / \/  \ |_| | | | (_| |
// \_____/\__,_|_|_|\__,_|
//

// creates a clone of the current hazy object (shallow, new memory references)
hazy.fork = () => _.clone(hazy, false)

// convenience reference to lodash so that developers don't have to explicitly import the lib in their own code
hazy.util = _

// make the module accessible
module.exports = hazy
