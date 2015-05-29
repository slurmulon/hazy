var chance = require('chance')

var hazy = {}

hazy.config = {}

hazy.meta = {
  types: {
    basic  : ['bool', 'character', 'integer', 'natural', 'string'],
    text   : ['paragraph', 'sentence', 'syllable', 'word']
    person : ['age', 'birthday', 'cpf', 'first', 'gender', 'last', 'name', 'prefix', 'ssn', 'suffix']
    mobile : ['android_id', 'apple_token', 'bb_pin', 'wp7_anid', 'wp8_anid2']
    // TODO
    // web:
    // location:
    // time:
    // finance:

    '?': 'bool',
    '#': 'number',
    '_': 'string',
    '$': this.finance,
  }
}

hazy.lang = {
  expression: /\|(:|~|@)(.*?)?\|/, // /\|(.*?)\|/,
  tokens: {
    "|": function(pos, prev, next) { // expression start/end
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

    ":": function(pos, prev, next) { // property accessor
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
            randObjSubType = _.first(rest) // get property of random operator following ":". FIXME, needs to be first match against rest string, not just first char

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

    // "*": function(next) {
    //   // TODO - repeat last expression N times
    // },
    
    next: function(tokens) {
      token
    },

    validate: function(token) {
      return this.hasOwnProperty(token)
    },

    process: function(token) {
      return this[token](_.slice(arguments, 1))
    },

    processNext: function(tokens) {
      var nextToken = this.next()

      return process(next)
    }
  },

  process: function(str) {
    var chunks  = this.expression.match(str)
    var results = []

    _.forEach(chunks, function(i, chunk) {
      var isToken = this.token.validate(chunk)

      if (isToken) {
        var nextChunk  = chunks[i + 1],
            restChunks = _.drop(chunks, i + 1),
            expResult  = this.token.process(chunk, nextChunk, restChunks)

        if (expResult) {
          results.push(expResult)
        }
      }
    })

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
  },

  process: function() {
    // hazy.lang.process
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