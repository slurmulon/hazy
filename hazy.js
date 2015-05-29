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
    misc   : ['dice', 'guid', 'hash', 'hidden', 'n', 'normal', 'radio', 'rpg', 'tv', 'unique', 'weighted'],
    
    // aliases
    '?' : 'bool',
    '#' : 'number',
    '_' : 'string',
    '$' : this.finance,
  }
}

hazy.lang = {
  expression: /\|(:|~|@)(.*?)?\|/,
  tokens: {
    "|": function(prev, next) { // expression start/end
      var isPrevToken    = this.validate(prev),
          isNextTokenEnd = /\|/.test(next) 

      if (isPrevToken || isNextTokenEnd) {
        throw new hazy.lang.exception('Cannot define an empty expression')
      }

      if (!next) {
        // return true
        // TODO - return a special value saying that this is the end of the token expression sequence
      }
    },

    ":": function(prev, next) { // property accessor
      if (!prev) {
        throw new Exception('Syntax error, : requires a left operand')
      }

      return prev[next]
    },

    "~": function(prev, next, rest) { // random data
      var randProp   = next,
          canUseProp = hazy.random.hasOwnProperty(randProp)

      if (canUseProp) {
        var randObjByProp  = hazy.random[randProp],
            randObjSubType = _.first(rest) // get property of random operator following ":"

        if (!randObjByProp) {
          throw new hazy.lang.exception('Invalid random data type "' + randObjSubType + '". Supported:', hazy.meta.types[randProp])
        }

        return randObjByProp[randObjSubType]
      } else {
        throw new hazy.lang.exception('Invalid random data category "' + randProp + '". Supported', hazy.meta.types)
      }
    },

    "@": function(prev, next) { // link to stub
      return hazy.link.follow(next)
    },

    validate: function(token) {
      return this.hasOwnProperty(token)
    },

    process: function(token) {
      return this[token](_.slice(arguments, 1))
    }
  },

  process: function(str) {
    var matches  = str.match(this.expression)
    var results = []

    _.forEach(matches, function(i, match) {
      var isToken = this.tokens.validate(match)

      if (isToken) {
        var prevMatch   = chunks[i - 1],
            nextMatch   = chunks[i + 1],
            restMatches = _.drop(chunks, i + 1),
            expResult   = this.tokens.process(match, prevMatch, nextMatch, restChunks)

        if (expResult) {
          results.push(expResult)
        }
      }
    }, this)

    return results // TODO - probably want to flatten or something (like if all elements are strings, flatten to a single string)
  },

  exception: function(msg) {
    throw new Exception('[Hazy syntax error] ', msg)
  }
}

hazy.random = _.object(_.keys(hazy.meta.types), function(randomType) {
  return new Chance()[randomType]
})

hazy.stub = {
  pool: {},

  get: function(key) {
    return this.pool[key]
  },

  register: function(name, stub) {
    this.pool[name] = stub
    this.process(stub)
  },

  process: function(stub, tailStub) {
    var resultStub = tailStub || {}

    if (_.isObject(stub)) {
      _.forEach(_.keys(stub), function(key) {
        var resultKey = hazy.lang.process(key),
            nextStub  = stub[key]

        resultStub[resultKey] = this.process(nextStub, resultStub)
      }, this)
    }

    if (_.isString(stub)) {
      return hazy.lang.process(stub)
    }

    if (_.isFunction(stub)) {
      return stub(null, hazy.config.global.seed) // TODO - provide/support per-instance seed and the object key
    }

    return resultStub
  },

  load: function(file) {
    if (_.isArray(file)) {
      _.forEach(file, function() {
        // TODO
      })
    } else {

    }
  },

  write: function() {

  }
}

hazy.link = {
  follow: function() {

  }
}