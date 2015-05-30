# Hazy

Lazy and leight-weight JSON stubbing in JavaScript

-----

Hazy aims to ease the hassle of generating and maintaining fixtures by making your JSON fixtures programmatic through laziness.
Hazy allows for fixtures to be processed and then easily manipulated further at run-time.

### Features

* Lazy data matching in JSON fixtures
* Lazy fixture embedding
* Lazy function matching (supports `jsonpath`, more on this later)
* Syntax layer integrating `ChanceJS` that provides a simple and non-intrusive interface

### Design Goals

* Non-invasive
* Pre-processed
* Convention based
* Unique and identifiable syntax
* Cleanly integrate with __all__ testing frameworks

### Examples

Here we register a couple of Hazy fixtures into what's refered to as the stub pool:

```
var hazy = require('hazy')

hazy.stub.register('someDude', {
  id   : '|~misc:guid|',
  name : '|~person:prefix| |~person:name| |~person:name|',
  bday : '|~person:bday|',
  ssn  : '|~person:ssn| (not really)',
})

hazy.stub.register('someDog', {
  id    : '|~misc:guid|',
  name  : 'Dawg',
  owner : '|@someDude|'
})

var hazyDude = hazy.stub.get('someDude')
var hazyDog  = hazy.stub.get('someDog')
```

The processed fixtures result as follows:

```
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

## Randomness

Hazy sits on top of ChanceJS, a great library for generating all sorts of useful random data.
Hazy categorizes ChanceJS's generation methods for a more symantic syntax, but otherwise integration
is completely transparent.

The token for generating random data is `~`:

`|~...|`

### Random Data Tokens

* `|~basic:<type>|`

  where type can be `'bool', 'character', 'integer', 'natural', 'string'`

* `|~text:<type>|`

  where type can be `'paragraph', 'sentence', 'syllable', 'word'`

* `|~person:<type>|`

  where type can be `'age', 'birthday', 'cpf', 'first', 'gender', 'last', 'name', 'prefix', 'ssn', 'suffix'`

* `|~mobile:<type>|`

  where type can be `'android_id', 'apple_token', 'bb_pin', 'wp7_anid', 'wp8_anid2'`

* `|~web:<type>|`

  where type can be `'color', 'domain', 'email', 'fbid', 'google_analytics', 'hashtag', 'ip', 'ipv6', 'klout', 'tld', 'twitter', 'url'`

* `|~geo:<type>|`

  where type can be `'address', 'altitude', 'areacode', 'city', 'coordinates', 'country', 'depth', 'geohash', 'latitude', 'longitude', 'phone', 'postal', 'province', 'state', 'street', 'zip'`

* `|~time:<type>|`

  where type can be `'ampm', 'date', 'hammertime', 'hour', 'millisecond', 'minute', 'month', 'second', 'timestamp', 'year'`

* `|~misc:<type>|`

  where type can be `'guid', 'hash', 'hidden', 'n', 'normal', 'radio', 'rpg', 'tv', 'unique', 'weighted'`

## Embedding

Hazy supports lazily embedding of other JSON fixtures (or really any value) present in the stub pool. The example above shows this already:

```
hazy.stub.register('someDog', {
  id    : '|~misc:guid|',
  name  : 'Dawg',
  owner : '|@someDude|'
})
```

will resolve to the following provided that `someDude` is in the stub pool

```
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

## Matching

This is in the works, but will allow for seed data and other functionality to be added at run-time and matched in Hazy via `jsonpath` (more to come)
