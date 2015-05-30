'use strict';

var _        = require('lodash'),
    jsonPath = require('jsonpath'),
    fs       = require('fs'),
    Chance   = require('chance')
    // TODO - assert

var hazy = {}

hazy.config = {
  seed: null,
  lazy: true,
  matchers: {
    use: true
  }
}

hazy.meta = {
  types: {
    basic  : ['bool', 'character', 'integer', 'natural', 'string'],
    text   : ['paragraph', 'sentence', 'syllable', 'word'],
    person : ['age', 'birthday', 'cpf', 'first', 'gender', 'last', 'name', 'prefix', 'ssn', 'suffix'],
    mobile : ['android_id', 'apple_token', 'bb_pin', 'wp7_anid', 'wp8_anid2'],
    web    : ['color', 'domain', 'email', 'fbid', 'google_analytics', 'hashtag', 'ip', 'ipv6', 'klout', 'tld', 'twitter', 'url'],
    geo    : ['address', 'altitude', 'areacode', 'city', 'coordinates', 'country', 'depth', 'geohash', 'latitude', 'longitude', 'phone', 'postal', 'province', 'state', 'street', 'zip'],
    time   : ['ampm', 'date', 'hammertime', 'hour', 'millisecond', 'minute', 'month', 'second', 'timestamp', 'year'],
    misc   : ['guid', 'hash', 'hidden', 'n', 'normal', 'radio', 'rpg', 'tv', 'unique', 'weighted']
  }
}

hazy.lang = {
  expression: {
    first : /\|(:|~|@)(.*?)?\|/,
    all   : /\|(:|~|@)(.*?)?\|/g
  },

  tokens: {
    "|": function(prev, next) { // expression start/end
      var isPrevToken    = this.validate(prev),
          isNextTokenEnd = /\|/.test(next) 

      if (isPrevToken || isNextTokenEnd) {
        throw hazy.lang.exception('Cannot define an empty expression')
      }

      if (!next) {
        // TODO - return a special value saying that this is the end of the token expression sequence. currenlty not technically needed
      }
    },

    ":": function(prev, next) { // property accessor
      if (!prev) {
        throw 'Syntax error, : requires a left operand'
      }

      return prev[next]
    },

    "~": function(prev, next, rest) { // random data
      var randProp   = next.split(':')[0],
          randVal    = next.split(':')[1],
          canUseProp = hazy.random.hasOwnProperty(randProp)

      if (canUseProp) {
        var randObjByProp  = hazy.random[randProp],
            randObjSubType = randVal // get property of random operator following ":"

        if (!randObjByProp || !randObjByProp[randObjSubType]) {
          throw hazy.lang.exception('Invalid random data type "' + randObjSubType + '". Supported:', hazy.meta.types[randProp])
        }

        return randObjByProp[randObjSubType]()
      } else {
        throw hazy.lang.exception('Invalid random data category "' + randProp + '". Supported', hazy.meta.types)
      }
    },

    "@": function(prev, next) { // link to stub
      return hazy.stub.get(next)
    },

    // TODO - / escape character

    validate: function(token) {
      return this.hasOwnProperty(token)
    },

    process: function(token, prev, next, rest) {
      return _.bindKey(hazy.lang.tokens, token, prev, next, rest)()
    }
  },

  // extracts tokens from strs and evaluates them. interpolates strings, ignores other data types
  process: function(str) {
    var matches = str.split(hazy.lang.expression.all),
        tokens  = []

    _.forEach(matches, function(match, i) {
      var isToken = hazy.lang.tokens.validate(match)

      if (isToken) {
        var prevMatch   = matches[i - 1],
            nextMatch   = matches[i + 1],
            restMatches = _.drop(matches, i + 1),
            tokenResult = this.tokens.process(match, prevMatch, nextMatch, restMatches)

        if (tokenResult) {
          // if processed token result is a string, substitute in original string as we iterate
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

  exception: function(msg) {
    return '[Hazy syntax error] ' + msg
  }
}

hazy.random = _.mapValues(hazy.meta.types, function(value, key) {
  var hazyRandObj = {}
  
  _.forEach(value, function(v) {
     hazyRandObj[v] = function() { return new Chance()[v]() }
  })
  
  return hazyRandObj
})

hazy.stub = {
  pool: {},

  get: function(key) { // TODO - may want to memoize this
    var stub = this.pool[key]

    return hazy.config.lazy && _.isFunction(stub) ? stub() : stub
  },

  register: function(name, stub, lazy) {
    this.pool[name] = hazy.config.lazy || lazy ? function() { return hazy.stub.process(stub) } : this.process(stub)
  },

  process: function(stub) { // dynamically process stub values by type (object, string, array, or function)
    var processedStub = stub

    if (_.isPlainObject(stub)) {
      _.mapKeys(stub, function(value, key) {
        var processedKey = hazy.lang.process(key),
            nextStub     = value
            
        processedStub[processedKey] = hazy.stub.process(nextStub)
      })
    }

    if (_.isString(stub)) {
      return hazy.lang.process(stub)
    }
    
    if (_.isArray(stub)) {
      return _.map(stub, hazy.stub.process)
    }

    if (hazy.matcher.hasMatch(processedStub)) {
      console.log('MATCH!')
    }

    return processedStub
  },

  load: function(file) { // TODO - load from FS
    if (_.isArray(file)) {
      _.forEach(file, function() {
        
      })
    } else {

    }
  },

  write: function(path) {
    // TODO - write to FS
  }
}

// Matching filters which can be injected into your application before stubs are allocated to the stub pool

hazy.matcher = {
  pool: {},

  register: function(path, value) {
    this.pool[path] = value
  },

  config: function(config) {
    if (!_.isEmpty(hazy.stub.pool))
      throw 'Matches can only be added before stubs are in the stub pool'

    var matcherPath    = config.path,
        matcherHandler = config.handler

    this.pool[matcherPath] = {path: matcherPath, handler: matcherHandler}
  },

  hasMatch: function(stub) { // determines if a pattern applies to the provided stub (TODO - clearly optimize, madhax)
    return _.any(_.mapKeys(hazy.matcher.pool, function(v, pattern) {
      if (_.isObject(stub)) {
        return _.isEmpty(
          jsonPath.query(stub, pattern)
        )
      }
    }), true)
  },
}

module.exports = hazy
