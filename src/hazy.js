'use strict'

import _ from 'lodash'
import jsonPath from 'jsonpath'
import Chance from 'chance'
import fs from 'fs'
import path from 'path'
import glob from 'glob'

const hazy = {}

//    ___             __ _       
//   / __\___  _ __  / _(_) __ _ 
//  / /  / _ \| '_ \| |_| |/ _` |
// / /__| (_) | | | |  _| | (_| |
// \____/\___/|_| |_|_| |_|\__, |
//                         |___/ 

hazy.config = {
  matcher: {
    use: true
  },
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
    first : /\|(~|@|\*|\$|\?){1}(.*?)?\|/,
    all   : /\|(~|@|\*|\$|\?){1}(.*?)?\|/g
  },

  tokens: {
    // expression start/end
    '|': (prev, next) => {
      const isNextTokenEnd = /\|/.test(next)

      if (isNextTokenEnd) {
        throw hazy.lang.exception('Cannot define an empty expression')
      }
    },

    // random data
    '~': (prev, next) => _.get(hazy.random, next.trim(), '')(),

    // embed fixture (or any data really) from the pool
    '*': (prev, next) => hazy.fixture.get(next.trim()),

    // query and embed fixture from the pool
    '$': (prev, next) => hazy.fixture.query(`$${next.trim()}`),

    // embed fixture from the filesystem
    '@': (prev, next) => hazy.fixture.glob(next.trim()),

    // find and embed fixture from filesystem or pool
    '?': (prev, next) => hazy.fixture.find(next.trim()),

    // ensure token is supported
    validate: (token) => hazy.lang.tokens.hasOwnProperty(token),

    // processes token (operator/prev) and associated data (operand/next)
    process: (token, prev, next, rest) => _.bindKey(hazy.lang.tokens, token, prev, next, rest)()
  },

  // extracts tokens from text and evaluates them for interpolation.
  // interpolates strings, ignores and simply returns other data types.
  process: (text, scope) => {
    let   result  = hazy.lang.evaluate(text, scope)
    const matches = result.split(hazy.lang.expression.all)
    const tokens  = []

    // match tokens and process them
    matches.forEach((match, i) => {
      const isTokenValid = hazy.lang.tokens.validate(match)

      if (isTokenValid) {
        const prevMatch   = matches[i - 1],
              nextMatch   = matches[i + 1],
              restMatches = _.drop(matches, i + 1),
              tokenResult = hazy.lang.tokens.process(match, prevMatch, nextMatch, restMatches)

        // when processed token result is a string, substitute original string as we iterate
        if (tokenResult) {
          if (_.isString(tokenResult) || _.isNumber(tokenResult)) {
            result = result.replace(hazy.lang.expression.first, tokenResult)
          } else {
            tokens.push(tokenResult)
          }
        }
      }
    })

    // reduce complex token replacements (non-String, non-Number)
    if (!_.isEmpty(tokens)) {
      return _.reduce(tokens) || result
    }

    // when no tokens could be matched, return interpolated result
    return result
  },

  // evaluates an interpolation template against text. operators defined here
  // essentially allow for the evaluation of JavaScript with global data.
  // use with caution as you can technically break the JSON specification.
  // TODO - make collection aliases that are surrounded with brackets instead of '|'
  evaluate: (text, scope) => {
    const options = {
      escape      : /(?!(.*?)*)/g, // don't match anyhthing
      evaluate    : /\|>([\s\S]+?)\|/g,
      interpolate : /\|=([\s\S]+?)\|/g,
      imports     : {
        fixture : hazy.fixture,
        random  : hazy.random, _
      }
    }

    return _.template(text, options)(scope)
  },

  exception: (msg) => new Error(`[Hazy syntax error] ${msg}`)
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

  // attempts to get a fixture from the pool. if that fails, the fixture is searched for on the file system.
  find: (key) => hazy.fixture.get(key) || hazy.fixture.src(`${key}.json`),

  // lazily acquires a fixture from the pool, processing it only once
  lazyGet: _.memoize(key => hazy.fixture.get(key)),

  // lazily finds a fixture, processing it only once
  lazyFind: _.memoize(key => hazy.fixture.find(key)),

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
  process: (fixture, match) => {
    const processedFixture = _.clone(fixture, true) // fixture

    if (_.isPlainObject(fixture)) {
      _.forEach(fixture, (value, key) => {
        const processedKey = hazy.lang.process(key),
              nextFixture  = value

        // remove fixture with unprocessed key from pool to prevent duplicate entries
        delete processedFixture[key]
            
        processedFixture[processedKey] = hazy.fixture.process(nextFixture)
      })
    }

    if (_.isString(fixture)) {
      return hazy.lang.process(fixture)
    }
    
    if (_.isArray(fixture)) {
      return fixture.map(hazy.fixture.process)
    }

    if (hazy.config.matcher.use && match) {
      return hazy.matcher.processDeep(processedFixture)
    }

    return processedFixture
  },

  // processes each fixture in the array
  processAll: (fixtures) => fixtures.map(fixture => hazy.fixture.process(fixture)),

  // queries the fixture pool for anything that matches the jsonpath pattern and processes it
  query: (pattern, handler) => hazy.matcher.search(pattern, handler),

  // glob and register a fixture from files matching a glob pattern
  glob: (pattern, options, key) => {
    glob(pattern, options, (err, files) => {
      if (err) {
        throw new Error('failed to load file')
      }

      const fixtures = []

      files.forEach(file => {
        try {
          hazy.fixture.src(file, fixtures.push)
        } catch (e) {
          throw new hazy.lang.exception(`failed to register fixture from "${file}" during glob`)
        }
      })

      return fixtures
    })
  },

  // read in a fixture from the filesystem and register it
  src(filepath) {
    if (filepath) {
      return fs.readFileSync(path.resolve(filepath), 'utf-8', (err, data) => {
        if (!err) {
          const fixtureKey  = filepath
          const fixtureData = JSON.parse(hazy.fixture.process(data))

          hazy.fixture.register(fixtureKey, fixtureData)

          return fixtureData
        } else {
          throw `failed to read file: ${err}`
        }
      })
    } else {
      throw `failed to read file, filepath required`
    }
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
          matcherHandler = config.handle

    if (hazy.matcher.pool[matcherPath]) {
      delete hazy.matcher.pool[matcherPath]
    }

    hazy.matcher.pool[matcherPath] = {path: matcherPath, handle: matcherHandler}
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

  // passively executes a single pattern matcher handle on a fixture.
  process: (pattern, fixture) => {
    const matcher = hazy.matcher.pool[pattern]

    if (matcher) {
      if (_.isObject(matcher) && _.isFunction(matcher.handle)) {
        const matches = jsonPath.query(fixture, pattern)

        return matcher.handle(fixture, matches, pattern)
      } else {
        throw 'match pattern does not apply to fixture or handle is not a function'
      }
    }

    return fixture
  },

  // executes handles for all pattern matches on a fixture
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

// map to random data generator (Chance)
hazy.random = _.mapValues(hazy.meta.random.types, (value, key) => {
  const hazyRandObj = {}
  
  _.forEach(value, (v) => {
     hazyRandObj[v] = (conf) => new Chance()[v](conf)
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
export default hazy
