var hazy = require('../src/hazy'),
    _    = require('lodash')

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

hazy.fixture.register('someDude', {
  id: '|~misc:guid|',
  name: '|~person:name|',
  ssn: '|~person:ssn| (not really)',
  // TODO - something: '|* $.owner.id|'
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

hazy.fixture.register('someShark', {
  id: '|~misc:guid|',
  name: 'Tiger Shark',
  born: '|@simpleDate|',
  ate: ['|@someDog|', '|@someDude|' ]
})

console.log('\nSome dude:',  hazy.fixture.get('someDude'))
console.log('\nSome dog:',   hazy.fixture.get('someDog'))
console.log('\nSome shark:', hazy.fixture.get('someShark'))

function innerTest() {
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

  var sleepyDog = newHazy.fixture.get('someDog')

  sleepyDog.bark() // now prints "zzzz, too tired"
}

hazy.fixture.get('someDog').bark()

innerTest()

console.log('\n\nall fixtures matching $.id', hazy.fixture.query('$.id'))