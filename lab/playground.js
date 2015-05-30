var hazy = require('../src/hazy'),
    _    = require('lodash')

hazy.matcher.config({
  path: '$.owner.id',
  handler: function(fixture, matches, pattern) {
    console.log('\nMatched dog owner id ', matches, pattern)

    return _.extend(fixture, {special: true})  // return the fixture after mutating it (if you so desire)
  }
})

hazy.fixture.register('someDude', {
  id: '|~misc:guid|',
  name: '|~person:name|',
  ssn: '|~person:ssn| (not really)',
  twitter: '|~web:twitter|',
  // super: {
    deep: [
      1, 2, 3, 4, 'derp |~web:hashtag|'
    ]
  // }
})

hazy.fixture.register('simpleDate', '|~time:date|')

hazy.fixture.register('someDog', {
  id: '|~misc:guid|',
  name: 'Dawg|~basic:character|',
  owner: '|@someDude|',
  born: '|@simpleDate|'
})



console.log('\nSome dude:',  hazy.fixture.get('someDude'))
console.log('\nSome dog:',   hazy.fixture.get('someDog'))
console.log('\nSimple var:', hazy.fixture.get('simpleDate'))
