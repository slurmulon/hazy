'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jsonpath = require('jsonpath');

var _jsonpath2 = _interopRequireDefault(_jsonpath);

var _chance = require('chance');

var _chance2 = _interopRequireDefault(_chance);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _glob2 = require('glob');

var _glob3 = _interopRequireDefault(_glob2);

var _lodash = require('lodash.isempty');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.isplainobject');

var _lodash4 = _interopRequireDefault(_lodash3);

var _lodash5 = require('lodash.get');

var _lodash6 = _interopRequireDefault(_lodash5);

var _lodash7 = require('lodash.map');

var _lodash8 = _interopRequireDefault(_lodash7);

var _lodash9 = require('lodash.drop');

var _lodash10 = _interopRequireDefault(_lodash9);

var _lodash11 = require('lodash.reject');

var _lodash12 = _interopRequireDefault(_lodash11);

var _lodash13 = require('lodash.foreach');

var _lodash14 = _interopRequireDefault(_lodash13);

var _lodash15 = require('lodash.values');

var _lodash16 = _interopRequireDefault(_lodash15);

var _lodash17 = require('lodash.mapvalues');

var _lodash18 = _interopRequireDefault(_lodash17);

var _lodash19 = require('lodash.bindkey');

var _lodash20 = _interopRequireDefault(_lodash19);

var _lodash21 = require('lodash.reduce');

var _lodash22 = _interopRequireDefault(_lodash21);

var _lodash23 = require('lodash.template');

var _lodash24 = _interopRequireDefault(_lodash23);

var _lodash25 = require('lodash.memoize');

var _lodash26 = _interopRequireDefault(_lodash25);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hazy = {};

//    ___             __ _      
//   / __\___  _ __  / _(_) __ _
//  / /  / _ \| '_ \| |_| |/ _` |
// / /__| (_) | | | |  _| | (_| |
// \____/\___/|_| |_|_| |_|\__, |
//                         |___/

hazy.config = {
  matcher: {
    use: true,
    collapseWhitespace: true // whether or not to leave whitespace when performing string replacements
  },
  fs: {
    ext: {
      assume: 'json'
    }
  }
};

hazy.meta = {
  random: {
    types: {
      basic: ['bool', 'character', 'integer', 'natural', 'string'],
      text: ['paragraph', 'sentence', 'syllable', 'word'],
      person: ['age', 'birthday', 'cpf', 'first', 'gender', 'last', 'name', 'prefix', 'ssn', 'suffix'],
      mobile: ['android_id', 'apple_token', 'bb_pin', 'wp7_anid', 'wp8_anid2'],
      web: ['color', 'domain', 'email', 'fbid', 'google_analytics', 'hashtag', 'ip', 'ipv6', 'klout', 'tld', 'twitter', 'url'],
      geo: ['address', 'altitude', 'areacode', 'city', 'coordinates', 'country', 'depth', 'geohash', 'latitude', 'longitude', 'phone', 'postal', 'province', 'state', 'street', 'zip'],
      time: ['ampm', 'date', 'hammertime', 'hour', 'millisecond', 'minute', 'month', 'second', 'timestamp', 'year'],
      misc: ['guid', 'hash', 'normal', 'radio', 'tv']
    } // TODO - support n, unique and weighted! very useful
  }
};

//    __                  
//   / /  __ _ _ __   __ _
//  / /  / _` | '_ \ / _` |
// / /__| (_| | | | | (_| |
// \____/\__,_|_| |_|\__, |
//                   |___/

hazy.lang = {
  expression: {
    first: /\|(~|@|\*|\$|\?){1}(.*?)?\|/,
    all: /\|(~|@|\*|\$|\?){1}(.*?)?\|/g
  },

  tokens: {
    // expression start/end
    '|': function _(prev, next) {
      var isNextTokenEnd = /\|/.test(next);

      if (isNextTokenEnd) {
        throw hazy.lang.exception('Cannot define an empty expression');
      }
    },

    // random data
    '~': function _(prev, next) {
      return (0, _lodash6.default)(hazy.random, next.trim(), '')();
    },

    // embed fixture (or any data really) from the pool
    '*': function _(prev, next) {
      return hazy.fixture.get(next.trim());
    },

    // query and embed fixture from the pool
    '$': function $(prev, next) {
      return hazy.fixture.query('$' + next.trim());
    },

    // embed fixture from the filesystem
    '@': function _(prev, next) {
      return hazy.fixture.glob(next.trim());
    },

    // find and embed fixture from filesystem or pool
    '?': function _(prev, next) {
      return hazy.fixture.find(next.trim());
    },

    // ensure token is supported
    validate: function validate(token) {
      return hazy.lang.tokens.hasOwnProperty(token);
    },

    // processes token (operator/prev) and associated data (operand/next)
    process: function process(token, prev, next, rest) {
      return (0, _lodash20.default)(hazy.lang.tokens, token, prev, next, rest)();
    }
  },

  // extracts tokens from text and evaluates them for interpolation.
  // interpolates strings, ignores and simply returns other data types.
  process: function process(text, scope) {
    var result = hazy.lang.evaluate(text, scope);
    var matches = result.split(hazy.lang.expression.all);
    var tokens = [];

    // match tokens and process them
    matches.forEach(function (match, i) {
      var isTokenValid = hazy.lang.tokens.validate(match);

      if (isTokenValid) {
        var prevMatch = matches[i - 1],
            nextMatch = matches[i + 1],
            restMatches = (0, _lodash10.default)(matches, i + 1),
            tokenResult = hazy.lang.tokens.process(match, prevMatch, nextMatch, restMatches);

        // when processed token result is a string, substitute original string as we iterate
        if (tokenResult) {
          if (tokenResult.constructor === String || tokenResult.constructor === Number) {
            result = result.replace(hazy.lang.expression.first, tokenResult);
          } else {
            tokens.push(tokenResult);
          }
        }
      }
    });

    // reduce complex token replacements (non-String, non-Number)
    if (!(0, _lodash2.default)(tokens)) {
      return (0, _lodash22.default)(tokens) || result;
    }

    // when no tokens could be matched, return interpolated result
    return result;
  },

  // evaluates an interpolation template against text. operators defined here
  // essentially allow for the evaluation of JavaScript with global data.
  // use with caution as you can technically break the JSON specification.
  // TODO - make collection aliases that are surrounded with brackets instead of '|'
  evaluate: function evaluate(text, scope) {
    var options = {
      escape: /(?!(.*?)*)/g, // don't match anything
      evaluate: /\|>([\s\S]+?)\|/g,
      interpolate: /\|=([\s\S]+?)\|/g,
      imports: {
        fixture: hazy.fixture,
        random: hazy.random
      }
    };

    return (0, _lodash24.default)(text, options)(scope);
  },

  exception: function exception(msg) {
    return new Error('[Hazy syntax error] ' + msg);
  }
};

//    ___ _      _                      
//   / __(_)_  _| |_ _   _ _ __ ___  ___
//  / _\ | \ \/ / __| | | | '__/ _ \/ __|
// / /   | |>  <| |_| |_| | | |  __/\__ \
// \/    |_/_/\_\\__|\__,_|_|  \___||___/
//

hazy.fixture = {
  pool: {},

  // fetches a fixture from the pool and processes it if necessary
  get: function get(key) {
    var fixture = hazy.fixture.pool[key];

    if (hazy.config.matcher.use) {
      return hazy.matcher.processDeep(fixture);
    }

    return fixture;
  },

  // attempts to get a fixture from the pool. if that fails, the fixture is searched for on the file system.
  find: function find(key) {
    return hazy.fixture.get(key) || hazy.fixture.src(key + '.json');
  },

  // lazily acquires a fixture from the pool, processing it only once
  lazyGet: (0, _lodash26.default)(function (key) {
    return hazy.fixture.get(key);
  }),

  // lazily finds a fixture, processing it only once
  lazyFind: (0, _lodash26.default)(function (key) {
    return hazy.fixture.find(key);
  }),

  // fetches all fixtures from the pool and processes them if necessary
  all: function all() {
    return (0, _lodash8.default)(hazy.fixture.pool, function (fixture, name) {
      return hazy.fixture.get(name);
    });
  },

  // registers a processable fixture into the fixture pool
  register: function register(name, fixture) {
    hazy.fixture.pool[name] = hazy.fixture.process(fixture);
  },

  // registers an array of processable fixtures into the fixture pool
  registerAll: function registerAll(fixtureMap) {
    if (fixtureMap instanceof Object) {
      (0, _lodash14.default)(fixtureMap, function (fixture, name) {
        return hazy.fixture.register(name, fixture);
      });
    } else {
      throw 'a fixture map following {name: fixture} must be provided';
    }
  },

  // dynamically process fixture values by type (object, string, array, or function)
  process: function process(fixture, match) {
    var processedFixture = fixture instanceof Object ? Object.assign({}, fixture) : fixture;

    if ((0, _lodash4.default)(fixture)) {
      (0, _lodash14.default)(fixture, function (value, key) {
        var processedKey = hazy.lang.process(key);
        var nextFixture = value;

        // remove fixture with unprocessed key from pool to prevent duplicate entries
        delete processedFixture[key];

        processedFixture[processedKey] = hazy.fixture.process(nextFixture);
      });
    }

    if (fixture && fixture.constructor === String) {
      return hazy.lang.process(fixture);
    }

    if (fixture instanceof Array) {
      return fixture.map(hazy.fixture.process);
    }

    if (hazy.config.matcher.use && match) {
      return hazy.matcher.processDeep(processedFixture);
    }

    return processedFixture;
  },

  // processes each fixture in the array
  processAll: function processAll(fixtures) {
    return fixtures.map(hazy.fixture.process);
  },

  // queries the fixture pool for anything that matches the jsonpath pattern and processes it
  query: function query(pattern, handler) {
    return hazy.matcher.search(pattern, handler);
  },

  // glob and register a fixture from files matching a glob pattern
  glob: function glob(_ref) {
    var pattern = _ref.pattern;
    var options = _ref.options;
    var parse = _ref.parse;
    var loose = _ref.loose;

    var fixtures = [];

    try {
      var files = _glob3.default.sync(pattern, options);

      files.forEach(function (file) {
        try {
          hazy.fixture.src(file, parse, loose, function (data) {
            return fixtures.push(data);
          });
        } catch (e) {
          throw 'failed to register fixture from "' + file + '" during glob';
        }
      });
    } catch (e) {
      throw 'failed to load file';
    }

    return fixtures;
  },

  // read in a fixture from the filesystem and register it
  src: function src(filepath) {
    var parse = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
    var loose = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
    var success = arguments.length <= 3 || arguments[3] === undefined ? function (_) {
      return _;
    } : arguments[3];

    if (filepath) {
      var assume = loose && !_path2.default.extname(filepath) && !filepath.endsWith('/');
      var normpath = _path2.default.normalize(assume ? filepath + '.' + (hazy.config.fs.ext.assume || 'json') : filepath);
      var data = _fs2.default.readFileSync(normpath, 'utf-8');

      if (data) {
        var fixtureKey = filepath;
        var fixtureData = (parse ? JSON.parse : function (_) {
          return _;
        })(hazy.fixture.process(data));

        hazy.fixture.register(fixtureKey, fixtureData);

        if (success instanceof Function) {
          success(fixtureData);
        }

        return fixtureData;
      }
    } else {
      throw 'failed to read file, filepath required';
    }

    return null;
  },


  // removes a fixture by name from the pool
  remove: function remove(name) {
    delete hazy.fixture.pool[name];
  },

  // removes all fixtures from the pool
  removeAll: function removeAll() {
    hazy.fixture.pool = {};
  }
};

//               _       _                  
//   /\/\   __ _| |_ ___| |__   ___ _ __ ___
//  /    \ / _` | __/ __| '_ \ / _ \ '__/ __|
// / /\/\ \ (_| | || (__| | | |  __/ |  \__ \
// \/    \/\__,_|\__\___|_| |_|\___|_|  |___/
//

hazy.matcher = {
  // source of all fixture matchers
  pool: {},

  // registers a fixture pattern matcher into the matcher pool
  config: function config(_ref2) {
    var path = _ref2.path;
    var handle = _ref2.handle;

    hazy.matcher.pool[path] = { path: path, handle: handle };
  },

  // provides a map of all matched patterns in a fixture (pattern as key)
  matches: function matches(fixture) {
    var matches = {};

    if (hazy.config.matcher.use) {
      (0, _lodash14.default)(hazy.matcher.pool, function (v, pattern) {
        if (fixture instanceof Object) {
          var jpMatches = _jsonpath2.default.query(fixture, pattern);

          if (!(0, _lodash2.default)(jpMatches)) {
            matches[pattern] = jpMatches;
          }
        }
      });
    } else {
      // WARN - matching disabled
    }

    return matches;
  },

  // determines if any matches in the pool apply to the fixture
  hasMatch: function hasMatch(fixture) {
    return !(0, _lodash2.default)(hazy.matcher.matches(fixture));
  },

  // search the fixture pool for fixtures matching a specific pattern.
  // intentionally non-lazy - prone to recursion hell and there's also little benefit in evaluating random values
  search: function search(pattern, process) {
    var fixtures = (0, _lodash16.default)(hazy.fixture.pool);

    return (0, _lodash12.default)((0, _lodash8.default)(fixtures, function (fixture) {
      var jpMatches = _jsonpath2.default.query(fixture, pattern);

      if (!(0, _lodash2.default)(jpMatches)) {
        // process functional matches if desired
        if (Object.is(process, undefined) ? hazy.config.matcher.use : process) {
          return hazy.matcher.process(pattern, fixture);
        }

        return fixture;
      }
    }), function (_) {
      return Object.is(_, undefined);
    });
  },

  // passively executes a single pattern matcher handle on a fixture.
  process: function process(pattern, fixture) {
    var matcher = hazy.matcher.pool[pattern];

    if (matcher) {
      if (matcher instanceof Object && matcher.handle instanceof Function) {
        var matches = _jsonpath2.default.query(fixture, pattern);

        return matcher.handle(fixture, matches, pattern);
      } else {
        throw 'match pattern does not apply to fixture or handle is not a function';
      }
    }

    return fixture;
  },

  // executes handles for all pattern matches on a fixture
  processDeep: function processDeep(fixture) {
    var patternMatches = hazy.matcher.matches(fixture);
    var processedFixture = fixture;

    (0, _lodash14.default)(patternMatches, function (match, pattern) {
      processedFixture = hazy.matcher.process(pattern, fixture) || processedFixture;
    });

    return processedFixture;
  }

};

//    __                 _                
//   /__\ __ _ _ __   __| | ___  _ __ ___ 
//  / \/// _` | '_ \ / _` |/ _ \| '_ ` _ \
// / _  \ (_| | | | | (_| | (_) | | | | | |
// \/ \_/\__,_|_| |_|\__,_|\___/|_| |_| |_|
//

// map to random data generator (Chance)
hazy.random = (0, _lodash18.default)(hazy.meta.random.types, function (value, key) {
  var hazyRandObj = {};

  (0, _lodash14.default)(value, function (v) {
    hazyRandObj[v] = function (conf) {
      return new _chance2.default()[v](conf);
    };
  });

  return hazyRandObj;
});

//    ___       _ _     _
//   / __\_   _(_) | __| |
//  /__\// | | | | |/ _` |
// / \/  \ |_| | | | (_| |
// \_____/\__,_|_|_|\__,_|
//

// creates a clone of the current hazy object (shallow, new memory references)
hazy.fork = function () {
  return Object.assign({}, hazy);
};

// make the module accessible
exports.default = hazy;