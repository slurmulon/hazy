# Hazy

Hazy is a preprocessor for providing dynamic stub and mocking functionality at the JSON fixture level. It secondarily provides a DSL wrapper for generating random data with Chance

## Dependencies
* Lodash
* Chance

## Syntax

### Expressions

`| ... |` denotes a Hazy expression that must return either a `string`, `number` or `object` depending on the use case.

  * When used in a JSON __key__ the expression will always result in a unique `string`
  * When used in a JSON __value__ the expression will result in either a `string`, a `number` or an `object`

`(| ... |)` denotes a Hazy expression that returns a function


All expressions support multiplication. For instance, to generate between 1 and 10 random names:

```
|~person:name:full| * |~#:1-10|
```

If the expression is in a key, the key and all value logic will be multiplied by N and result in N unique key/value pairs.
If the expression is in the value, the filter function will be executed only to the value N times and will always return an array.

### Randomness

Hazy supports a variety of out-of-the-box data generators for you to use. You can also easily extend the presets either globally or per use-case or can even add your own.

`|~...|` denotes a __random__ expression, and will always return either a `string` or a `number`. The expression may be used in both keys and values.

#### Numbers

#### People
`|~person:name|` full name
`|~person:first|` first name
`|~person:last|` last name
`|~person:prefix|` Mr., Mrs., etc.
`|~person:suffix|` Jr., Sr., etc.
`|~person:age|` age
`|~person:birthday|` birthday
`|~person:ssn|` Social Security Number

#### Places
`|~place:coords|` random array containing [latitude, longitude]
`|~place:coords:x|` random latitude
`|~place:coords:y|` random longitude
`|~place:country|` random country
`|~place:state|` random state (USA)

### Time

TODO

-----

### References

Stubs may reference each other by key, but must be acyclic. The reference symbol is processed in strings as follows:

`|@stubName|`

### Filters

Any static JSON value can be replaced with a powerful filter function that provides both a reference to the value's pre-processed key but also
a generic seed object which can be provided on a per-instance basis.

> __Note__
> The result of every filter function is processed by `hazy.lang.process` in order to provide an additional layer of processing before resulting with a static object.

```
{
  "title": function(key, seed) {
    // any JSON value can be a function accepting both a reference to the value's key and a stub seed object
    return seed.title + ' Stub ' + seed.someNumber
  }
}
```

A short-hand is to provide an expression as a string, which is always provided with the key and a seed object

```
{
  "title": "|seed:title + ' Stub ' + seed.someNumber|"
}
```

The examples above provide synonymous results



# Links

```
|@stubKey|
```

# Register Stubs

```
var hazy = require('hazy')

hazy.register.stub('stubName',
{
  "title": function(key, seed) {
    // any JSON value can be a function accepting both a reference to the value's key and a stub seed object
    return seed.title + ' Stub'
  },
  "description": "A product from Acme's catalog",
  "properties": {
      "id": {
          "description": "The unique identifier for a product",
          "type": "integer"
      },
      "name": {
          "description": "Name of the product",
          "type": "string"
      }
  },
  "required": ["id", "name"]
  "more": "|@someStub|" // links to a stub object named "more"
})

```

# Loading Fixtures

```
hazy.load.stub('some_base_fixture.json', function(stub) {
  stub.pairs.forEach(function(k,v) {
    if 
  })

  return 
})
```