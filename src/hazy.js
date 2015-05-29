var _ = require('lodash'),
    Chance = require('chance'),
    jsonPath = require('jsonpath')

var hazy = {}

hazy.config = {
  global: {
    seed: null
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
  expression: /\|(:|~|@)(.*?)?\|/,

  tokens: {
    "|": function(prev, next) { // expression start/end
      var isPrevToken    = this.validate(prev),
          isNextTokenEnd = /\|/.test(next) 

      if (isPrevToken || isNextTokenEnd) {
        throw hazy.lang.exception('Cannot define an empty expression')
      }

      if (!next) {
        // return true
        // TODO - return a special value saying that this is the end of the token expression sequence
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
    var matches = str.match(this.expression)
    var results = []

    _.forEach(matches, function(match, i) {
      var isToken = hazy.lang.tokens.validate(match)

      if (isToken) {
        var prevMatch   = matches[i - 1],
            nextMatch   = matches[i + 1],
            restMatches = _.drop(matches, i + 1),
            expResult   = this.tokens.process(match, prevMatch, nextMatch, restMatches)

        if (expResult) {
          results.push(expResult)
        }
      }
    }, this)
    
    results = _.reduce(results, function(total, n) { return total + n })

    // replace tokens in original string with processed replacements
    if (_.isString(results)) {
      return str.replace(this.expression, results) 
    }

    return results || str
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
    var processedStub = {}

    if (_.isPlainObject(stub)) {
      _.mapKeys(stub, function(value, key) {
        var processedKey = hazy.lang.process(key),
            nextStub     = value
            
        processedStub[processedKey] = this.process(nextStub)
      }, this)
    }
    
    if (_.isArray(stub)) {
      return _.map(stub, hazy.lang.process)
    }

    if (_.isString(stub)) {
      return hazy.lang.process(stub)
    }

    if (_.isFunction(stub)) {
      return stub(null, hazy.config.global.seed) // TODO - provide/support per-instance seed and the object key
    }

    // TODO - determine if current stub matches a regex or name
    // hazy.stub.

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

hazy.pattern = {
  pool: {},

  appliesTo: function(stub) { // determines if a seed can be populated to the provided function
    return this.pool.hasOwnProperty(stub)
  },

  register: function(path, value) {
    this.pool[path] = value
  },

  registerConfig: function(patternConfig) {
    var stubName       = patternConfig.stub,
        patternPath    = patternConfig.path,
        patternHandler = patternConfig.handler,
        patternKey     = stubName || stubPath

    if (!_.contains(this.pool, stubName)) {
      throw 'Stub is not registered in pool, failed to register pattern ' + stubName
    }

    this.pool[patternKey] = {name: stubName, path: stubPath, handler: patternHandler}
  }
}

hazy.seed   = _.cloneDeep(hazy.pattern)
hazy.filter = _.cloneDeep(hazy.pattern)
