# Hazy

> Lazy JSON fixtures in Node

-----

Hazy aims to ease the hassle of generating, maintaining and working with fixtures by making them DRY and more expressive.
Hazy lets developers describe and generate test data in a normailzed fasion and allows for fixtures to be processed further
at run-time for increased flexibility.

### Features

* Simple syntax for supporting both normalized and random data in fixtures
* DRY, embeddable, and queryable fixtures / sub-fixtures
* Random `String`, `Number` and `Date` data via `ChanceJS`
* Lazy processing via run-time queries ([JsonPath](http://goessner.net/articles/JsonPath/))

### Design Goals

* Non-invasive (retain all involved standards, especially JSON)
* Unique and identifiable syntax
* Convention based, interpreter agnostic
* Pre-processed, but optionally evaluated at run-time
* Cleanly integrate with __all__ Node testing frameworks

### Example

Here we register a couple of JSON fixtures into what's refered to as the fixture pool:

```javascript
import hazy from 'hazy'

hazy.fixture.register('someDude', {
  id    : '|~misc.guid|',
  name  : '|~person.prefix| |~person.name|',
  email : '|~web.email|',
  bday  : '|~person.birthday|',
  ssn   : '|~person.ssn| (not really)',
})

/* loads someDog.json (assumes .json extension when none is provided), containing:
{
  id    : '|~misc.guid|',
  owner : '|*someDude|'
  name  : 'Dawg',
}*/
hazy.fixture.src('someDog')

const hazyDude = hazy.fixture.get('someDude')
const hazyDog  = hazy.fixture.get('someDog')
```

The processed fixtures result as follows:

```javascript
// hazyDude
{
  id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
  name: 'Mr. Agnes Hammond',
  bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
  ssn: '264-66-4154 (not really)'
}

// hazyDog
{
  id: '427b2fa6-02f8-5be5-b3d1-cdf96f432e28',
  name: 'Dawg',
  owner: {
    id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
    name: 'Mr. Agnes Hammond',
    bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
    ssn: '264-66-4154 (not really)'
  }
}
```

### Installation

```
> npm install hazy
```

if you wish to develop:

```
> git clone http://github.com/slurmulon/hazy.git
> cd hazy
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

# Documentation

The following provides a high-level summary of all of Hazy's features as well as some examples and gotchas.

A notable observation is that Hazy's syntax can be expressed quite simply:

`|<operator> <expression|statement>|`

Supported operators are:

 * `~` generate random data
 * `*` embed fixture data from pool
 * `$` query by `JsonPath` pattern and embed fixture from pool
 * `@` find and embed fixture from filesystem
 * `?` find and embed fixture from pool or filesystem
 * `>` evaluate content as literal JavaScript
 * `=` interpolate expression result

(more thorough documentation on the way)

## Randomness

Hazy sits on top of ChanceJS, a great library for generating all sorts of useful random data.
Hazy categorizes ChanceJS's generation methods for a more symantic syntax, but otherwise integration
is completely transparent.

The token for generating random data is `~`:

`|~ <class>.<type>|`

### Random Data Tokens

* `|~basic.<type>|`

  supports `'bool', 'character', 'integer', 'natural', 'string'`

* `|~text.<type>|`

  supports `'paragraph', 'sentence', 'syllable', 'word'`

* `|~person.<type>|`

  supports `'age', 'birthday', 'cpf', 'first', 'gender', 'last', 'name', 'prefix', 'ssn', 'suffix'`

* `|~mobile.<type>|`

  supports `'android_id', 'apple_token', 'bb_pin', 'wp7_anid', 'wp8_anid2'`

* `|~web.<type>|`

  supports `'color', 'domain', 'email', 'fbid', 'google_analytics', 'hashtag', 'ip', 'ipv6', 'klout', 'tld', 'twitter', 'url'`

* `|~geo.<type>|`

  supports `'address', 'altitude', 'areacode', 'city', 'coordinates', 'country', 'depth', 'geohash', 'latitude', 'longitude', 'phone', 'postal', 'province', 'state', 'street', 'zip'`

* `|~time.<type>|`

  supports `'ampm', 'date', 'hammertime', 'hour', 'millisecond', 'minute', 'month', 'second', 'timestamp', 'year'`

* `|~misc.<type>|`

  supports `'guid', 'hash', 'hidden', 'n', 'normal', 'radio', 'rpg', 'tv', 'unique', 'weighted'`

## Embedding

Hazy supports referencing and embedding other JSON fixtures (or really any value) present in the fixture pool using the `*` operator.

`|* <fixture-pool-key>|`

The `someDog` example above already shows how this is used:

```javascript
hazy.fixture.register('someDog', {
  id    : '|~misc.guid|',
  owner : '|*someDude|'
  name  : 'Dawg',
})
```

the above will resolve to the following provided that `someDude` is in the fixture pool:

```javascript
{
  id: '427b2fa6-02f8-5be5-b3d1-cdf96f432e28',
  name: 'Dawg',
  owner: {
    id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
    name: 'Mr. Agnes Hammond',
    bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
    ssn: '264-66-4154 (not really)'
  }
}
```

Hazy also supports more advanced ways of embedding fixtures using queries, but more on that will follow
in the next section.

## Queries

Hazy utilizes `JsonPath` for defining functionality to pre-processed fixtures in a query-like fasion.
Details on `JsonPath` can be found at http://goessner.net/articles/JsonPath/. There are many ways in which
JSON objects can be queried using this flexible technique.

A primary goal of Hazy is to give developers both fine grained and generalized control over the data and
functionality relevant to their fixtures.

Take our `someDog` fixture, for example:

```javascript
{
  id: '427b2fa6-02f8-5be5-b3d1-cdf96f432e28',
  name: 'Dawg',
  owner: {
    id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
    name: 'Mr. Agnes Hammond',
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

`JsonPath` expressions that match against the fixture pool can be specified with the query operator `$`.
The results of the expression and will be embedded into the fixture upon processing. The syntax for embedded queries is:

`|$ <jsonpath-expression>|`

where `<jsonpath-expression>` is a valid [JsonPath](http://goessner.net/articles/JsonPath/) expression (minus the leading '$')

> **Note:** Embedded queries (i.e. those defined outside of the lazy matcher pool `hazy.matcher`, particularly in source *.json files/data) are **not** and cannot be lazily evaluated because:
>
> 1. Very high risk of cyclic dependencies and infinite recursion (e.g., some fixtures may need to be lazily evaluated if they have not already been, potentially triggering an endless cycle)
> 2. Applying queries to pre-processed fixtures allows for cleaner queries (since you can query against Hazy tags) and provides consistent results.
>    If queries were applied to post-processed fixtures, they would be bottlenecked to only working with properties since the processed random values 
>    are obviously inconsistent.
>
> See the section on [Lazy Query Matchers](#lazy-query-matchers) for a pragmatic and idiomatic solution to the issue.

Use of the operator is straight forward:

```javascript
hazy.fixture.register('someShark', {
  id   : '|~misc.guid|',
  name : 'Tiger Shark',
  ate  : '|$.id|', // queries pool for any fixture with an "id" property at the highest level
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
        name: 'Mr. Agnes Hammond',
        bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
        ssn: '264-66-4154 (not really)'
      },
      { 
        id: '427b2fa6-02f8-5be5-b3d1-cdf96f432e28',
        name: 'Dawg',
        owner: {
          id: 'e76de72e-6010-5140-a270-da7b6b6ad2d7',
          name: 'Mr. Agnes Hammond',
          bday: Wed Apr 27 1994 04:05:27 GMT-0700 (Pacific Daylight Time),
          ssn: '264-66-4154 (not really)'
        }
      } 
    ] 
}
```

> **Note:** The query operator currently always returns an `Array`. I consider this a limitation because it makes it difficult to integrate queries with other expressions. I hope to address this issue soon.

The only known limitation on the nesting depth of embedded fixtures is the stack size of the process.  I have not pushed this limitation very far at all, but if any
issues are encountered then please open an issue on Github.

### Lazy Query Matchers

With Hazy we can leverage this powerful query mechanism in any Node environment to provide test-specific functionality to your fixtures.
This is achieved by monkey-patching fixtures in the pool that match a specific `JsonPath` pattern.

For example, if we wanted to query our fixture pool for any fixture with an `owner` object containing an `id` property
and then update those fixtures with new `bark()` functionality, then we would use the following:

```javascript
hazy.matcher.config({
  path   : '$.owner.id',
  handle : (fixture, matches, pattern) => {
    // return the fixture after mutating it (if you so desire)
    return Object.assign({
      hasOwner : true,
      bark : () => {
        console.log('woof woof, my owner is ', matches[0])
      }
    }, fixture)
  }
})

hazy.fixture.register('someDogWithOwner', {
  id    : '|~misc.guid|',
  owner : '|*someDude|'
  name  : 'Happy Dog',
})

hazy.fixture.register('someDogWithoutOwner', {
  id   : '|~misc.guid|',
  name : 'Lonely Dog'
})

const happyDog  = hazy.fixture.get('someDogWithOwner')
const lonelyDog = hazy.fixture.get('someDogWithoutOwner')
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

This feature can also be combined with `hazy.fork()` so that query matchers can be scoped to a particular state of the fixture pool.
Any query matcher defined at a higher scope can be easily and safely overwritten in a Hazy fork:

```javascript
hazy.matcher.config({
  path   : '$.owner.id',
  handle : (fixture, matches, pattern) => {
    // return the fixture after mutating it (if you so desire)
    return Object.assign({
      hasOwner : true,
      bark : () => {
        console.log('woof woof, my owner is ', matches[0])
      }
    }, fixture)  
  }
})

hazy.fixture.register('someDogWithOwner', {
  id    : '|~misc.guid|',
  owner : '|*someDude|'
  name  : 'Happy Dog',
})

const happyDog  = hazy.fixture.get('someDogWithOwner')
let   sleepyDog = null

function forkTest() {
  const newHazy = hazy.fork()

  newHazy.matcher.config({
    path   : '$.owner.id',
    handle : (fixture) => {
      fixture.bark = () => {
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

Lastly, you have some control over when evaluation occurs:

 * `hazy.fixture.get` will apply any pattern-matched functionality to the relevant fixture **each time** it is called.
 * `hazy.fixture.lazyGet` applies any pattern-matched functionality to the relevant fixture, but only does so **once (memoized)**.

Both implementations are technically lazy since their evaluation is deferred until the last minute, but `lazyGet` is even more so since it only runs once.

## Scripting

Hazy also evaluates text through a `lodash` interpolation template. This enables you
to include JavaScript expressions in your fixtures.

This is an experimental feature, so use it with caution.

### Interpolate
Insert the result of an expression. The fixture pool and random data factories are all available as variables.

Specified with the `=` operator.

```javascript
hazy.lang.process('{"random_point": "|= random.basic.integer({min: 0, max: 100})|"}')
```

As a convenience, ES6's interpolation syntax can also be used:

```javascript
hazy.lang.process('{"random_point": "${random.basic.integer({min: 0, max: 100})}"}')
```

### Evaluate
Evaluates content as JavaScript, allowing you to perform `if` statements, loops, etc.

Specified with the `>` operator.

```javascript
hazy.lang.process('{"random_point": |> if (foo) {| |=random.basic.integer({min: 0, max: 100})| |> }|}', {foo: true})
```

## TODO

- [ ] Silent/collapsed whitespace override (useful for loading fixtures into pool without having to print the contents)
- [ ] Retain indentation of parent line
- [ ] Cache last randomly generated result and allow user to easily re-use the latest value (allows fixtures to be consistent with each other when needed)
- [ ] Array literal operator
- [ ] Seeds for random data
- [ ] Memoized/scoped random data
- [ ] Support JSON Pointer
- [ ] Support `json-rel`
- [ ] Remote fixtures via `http`
- [ ] CLI
