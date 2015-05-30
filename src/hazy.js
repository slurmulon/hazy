var _ = require('lodash'),
    Chance = require('chance'),
    jsonPath = require('jsonpath')

var hazy = {}

hazy.config = {
  seed: null,
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
    
    // aliases
    // '?' : 'bool',
    // '#' : 'number',
    // '_' : 'string',
    // '$' : this.finance,
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
        // return true
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
      var randProp   = next.split(':')[0] // match text to next : or |
          randVal    = next.split(':')[1]
          canUseProp = hazy.random.hasOwnProperty(randProp)

      if (canUseProp) {
        var randObjByProp  = hazy.random[randProp]
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

    validate: function(token) {
      return this.hasOwnProperty(token)
    },

    process: function(token, prev, next, rest) {
      return _.bindKey(hazy.lang.tokens, token, prev, next, rest)()
    }
  },

  process: function(str) {
    var matches = str.split(hazy.lang.expression.all)
    var tokens = []

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

    // essentially detokenization. original str is returned if no reducing can be performed
    return _.reduce(tokens, function(total, n) { return total + n }) || str
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

  get: function(key) {
    return this.pool[key]
  },

  // FIXME - allow for optional non-lazy override. by defult this should return a function
  register: function(name, stub) {
    this.pool[name] = this.process(stub)
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

    if (_.isFunction(stub)) {
      return stub(null, hazy.config.seed) // TODO - provide/support per-instance seed and the object key
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

  write: function() {
    // TODO - write to FS
  }
}

// Matching filters which can be injected into your application before stubs are allocated to the stub pool

hazy.matcher = {
  pool: {},

  register: function(path, value) {
    this.pool[path] = value
  },

  addConfig: function(config) {
    if (!_.isEmpty(hazy.stub.pool))
      throw 'Matches can only be added before stubs are in the stub pool'

    var stubName       = config.stub,
        matcherPath    = config.path,
        matcherHandler = config.handler,
        matcherKey     = stubName || matcherPath

    this.pool[matcherKey] = {name: stubName, path: matcherPath, handler: matcherHandler}
  },

  hasMatch: function(stub) { // determines if a pattern applies to the provided stub (TODO - clearly optimize, madhax)
    var inPool      = _.isString(stub) && this.pool.hasOwnProperty(stub)
        matchExists = inPool || _.every(_.mapKeys(hazy.matcher.pool, function(v,pattern) {
          return _.isString(stub) && !_.isUndefined(
            jsonPath.query(pattern, stub)
          )
        }), true)

    return matchExists
  },
}
