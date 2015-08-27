# Hazy

> Lazy and light-weight JSON fixtures in Node

-----

Hazy aims to ease the hassle of generating, maintaining and working with JSON fixtures by making them more self-descriptive and programmatic.
Hazy lets developers describe test data in a generic fasion and allows for fixtures to be processed further at run-time for increased flexibility.

### Features

* Lazy data matching in JSON fixtures
* Lazy fixture embedding
* Lazy processing via run-time queries ([jsonpath](http://goessner.net/articles/JsonPath/))
* Syntax layer integrating `ChanceJS` that provides a simple and non-intrusive interface

### Design Goals

* Non-invasive (retain all involved standards, especially JSON)
* Unique and identifiable syntax
* Convention based, interpreter agnostic
* Pre-processed and optionally evaluated at run-time
* Cleanly integrate with __all__ testing frameworks

### Example

Here we register a couple of Hazy fixtures into what's refered to as the fixture pool:

```javascript
var hazy = require('hazy')

hazy.fixture.register('someDude', {
  id   : '|~misc:guid|',
  name : '|~person:prefix| |~person:name|',
  bday : '|~person:birthday|',
  ssn  : '|~person:ssn| (not really)',
})

/* loads someDog.json, containing:
{
  id    : '|~misc:guid|',
  name  : 'Dawg',
  owner : '|@someDude|'
}*/
hazy.fixture.load('someDog')

var hazyDude = hazy.fixture.get('someDude')
var hazyDog  = hazy.fixture.get('someDog')
```

The processed fixtures result as follows:

```javascript
// hazyDude
{
  id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
  name: 'Mrs. Cornelia Warner Agnes Hammond',
  bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
  ssn: '264-66-4154 (not really)'
}

// hazyDog
{
  id: '427b2fa6-02f8-5be5-b3d1-cdf96f432e28',
  name: 'Dawg',
  owner: {
    id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
    name: 'Mrs. Cornelia Warner Agnes Hammond',
    bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
    ssn: '264-66-4154 (not really)'
  }
}
```

### Installation

```
> git clone http://github.com/slurmulon/hazy.git
> npm link hazy
```

### Test

```
> cd hazy
```

then

```
> npm test
```

or

```
> mocha
```

# Documentation

The following provides a high-level summary of all of Hazy's features as well as some examples and gotchas.
As of now more detailed documention does not exist (coming soon).

## Randomness

Hazy sits on top of ChanceJS, a great library for generating all sorts of useful random data.
Hazy categorizes ChanceJS's generation methods for a more symantic syntax, but otherwise integration
is completely transparent.

The token for generating random data is `~`:

`|~<class>:<type>|`

### Random Data Tokens

* `|~basic:<type>|`

  supports `'bool', 'character', 'integer', 'natural', 'string'`

* `|~text:<type>|`

  supports `'paragraph', 'sentence', 'syllable', 'word'`

* `|~person:<type>|`

  supports `'age', 'birthday', 'cpf', 'first', 'gender', 'last', 'name', 'prefix', 'ssn', 'suffix'`

* `|~mobile:<type>|`

  supports `'android_id', 'apple_token', 'bb_pin', 'wp7_anid', 'wp8_anid2'`

* `|~web:<type>|`

  supports `'color', 'domain', 'email', 'fbid', 'google_analytics', 'hashtag', 'ip', 'ipv6', 'klout', 'tld', 'twitter', 'url'`

* `|~geo:<type>|`

  supports `'address', 'altitude', 'areacode', 'city', 'coordinates', 'country', 'depth', 'geohash', 'latitude', 'longitude', 'phone', 'postal', 'province', 'state', 'street', 'zip'`

* `|~time:<type>|`

  supports `'ampm', 'date', 'hammertime', 'hour', 'millisecond', 'minute', 'month', 'second', 'timestamp', 'year'`

* `|~misc:<type>|`

  supports `'guid', 'hash', 'hidden', 'n', 'normal', 'radio', 'rpg', 'tv', 'unique', 'weighted'`

## Embedding

Hazy supports embedding of other JSON fixtures (or really any value) present in the fixture pool. The example above shows this already:

```javascript
hazy.fixture.register('someDog', {
  id    : '|~misc:guid|',
  name  : 'Dawg',
  owner : '|@someDude|'
})
```

will resolve to the following provided that `someDude` is in the fixture pool

```javascript
{
  id: '427b2fa6-02f8-5be5-b3d1-cdf96f432e28',
  name: 'Dawg',
  owner: {
    id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
    name: 'Mrs. Cornelia Warner Agnes Hammond',
    bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
    ssn: '264-66-4154 (not really)'
  }
}
```

Hazy also supports more advanced ways of embedding fixtures using queries, but more on that will follow
in the next section.

## Queries

Hazy utilizes `jsonpath` for defining functionality to pre-processed fixtures in a query-like fasion.
Details on `jsonpath` can be found at http://goessner.net/articles/JsonPath/. There are many ways in which
JSON objects can be queried using this flexible technique.

The general idea in Haze is to give developers both fine grained and generalized control over the data and
functionality relevant to their fixtures.

Take our `someDog` fixture, for example:

```javascript
{
  id: '427b2fa6-02f8-5be5-b3d1-cdf96f432e28',
  name: 'Dawg',
  owner: {
    id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
    name: 'Mrs. Cornelia Warner Agnes Hammond',
    bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
    ssn: '264-66-4154 (not really)'
  }
}
```

We can obtain the `id` of the dog's owner with the following query:

`$.owner.id`

After the fixture has been queried, this will result with:

`e76de72e-6010-5140-a270-da7b6b6ad2d7`

### Embedded Queries

`jsonpath` expressions that match against the fixture pool can be specified with the query operator `*`.
The results of the expression and will be embedded into the fixture upon processing. The syntax for embedded queries is:

`|*<jsonpath-expression>|`

where `<jsonpath-expression>` is a valid [jsonpath](http://goessner.net/articles/JsonPath/) expression

> **Note:** Embedded queries are **not** and should not be lazily evaluated because:
>
> 1. Very high risk of cyclic dependencies and infinite recursion (e.g., some fixtures may need to be lazily evaluated if they have not already been, potentially triggering an endless cycle)
> 2. Applying queries to pre-processed fixtures allows for cleaner queries (since you can query against Hazy tags) and provides consistent results.
>    If queries were applied to post-processed fixtures, they would be bottlenecked to only working with properties since the processed random values 
>    are obviously inconsistent.

Use of the operator is straight forward:

```javascript
hazy.fixture.register('someShark', {
  id   : '|~misc:guid|',
  name : 'Tiger Shark',
  ate  : '|* $.id|', // queries pool for any fixture with an "id" property at the highest level
})
```
this will result with something like:

```javascript
{ 
  id: '64af61f8-daa8-5959-8be4-bdd536ecc5bd',
  name: 'Tiger Shark',
  ate: 
    [ { 
        id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
        name: 'Mrs. Cornelia Warner Agnes Hammond',
        bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
        ssn: '264-66-4154 (not really)'
      },
      { 
        id: '427b2fa6-02f8-5be5-b3d1-cdf96f432e28',
        name: 'Dawg',
        owner: {
          id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
          name: 'Mrs. Cornelia Warner Agnes Hammond',
          bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
          ssn: '264-66-4154 (not really)'
        }
      } 
    ] 
}
```

> **Note:** The query operator currently always returns an `Array`. I consider this a limitation because it makes it difficult to integrate queries with other expressions. I hope to fix this soon.

### Functional Queries

With Hazy we can leverage this powerful query mechanism in any testing environment to provide test-specific functionality to your fixtures.

For example, if we wanted to query our fixture pool for any fixture with an `owner` object containing an `id` property
and then update those fixtures with new `bark()` functionality, then we would use the following:

```javascript
hazy.matcher.config({
  path    : '$.owner.id',
  handler : function(fixture, matches, pattern) {
    // return the fixture after mutating it (if you so desire)
    return _.extend(fixture, {
      hasOwner : true,
      bark     : function() {
        console.log('woof woof, my owner is ', matches[0])
      }
    })  
  }
})

hazy.fixture.register('someDogWithOwner', {
  id    : '|~misc:guid|',
  name  : 'Happy Dog',
  owner : '|@someDude|'
})

hazy.fixture.register('someDogWithoutOwner', {
  id    : '|~misc:guid|',
  name  : 'Lonely Dog'
})

var happyDog  = hazy.fixture.get('someDogWithOwner'),
    lonelyDog = hazy.fixture.get('someDogWithoutOwner')
```

Since the `matcher` only applies to fixtures with an owner id, only `happyDog` will contain the `hasOwner` property and
a `bark` method:

```javascript
happyDog.bark()
```

> `woof woof, my owner is e76de72e-6010-5140-a270-da7b6b6ad2d7`

```javascript
lonelyDog.bark()
```

> `Error: undefined is not a method`

-----

This feature can also be combined with `hazy.fork()` so that queries can be context-specific. Any query defined
at a higher context level can be easily and safely overwritten in a Hazy fork:

```javascript
hazy.matcher.config({
  path    : '$.owner.id',
  handler : function(fixture, matches, pattern) {
    // return the fixture after mutating it (if you so desire)
    return _.extend(fixture, {
      hasOwner : true,
      bark     : function() {
        console.log('woof woof, my owner is ', matches[0])
      }
    })  
  }
})

hazy.fixture.register('someDogWithOwner', {
  id    : '|~misc:guid|',
  name  : 'Happy Dog',
  owner : '|@someDude|'
})

var happyDog  = hazy.fixture.get('someDogWithOwner'),
    sleepyDog = null

function forkTest() {
  var newHazy = hazy.fork()

  newHazy.matcher.config({
    path    : '$.owner.id',
    handler : function(fixture) {
      fixture.bark = function() {
        console.log('zzzz, too tired')
      }
      
      return fixture
    }
  })

  sleepyDog = newHazy.fixture.get('someDogWithOwner')
}

forkTest()
```

and now...

```javascript
happyDog.bark()
```
> still prints `woof woof, my owner is e76de72e-6010-5140-a270-da7b6b6ad2d7`, while

```javascript
sleepyDog.bark()
```
> now prints `zzzz, too tired`, overriding the matcher defined at a higher context level (AKA `happyDog`'s) safely

## TODO

- [ ] Repeater operator
- [ ] Seeds and ranges for random data
- [ ] Token parameters
