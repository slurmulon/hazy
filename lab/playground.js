var hazy = require('../src/hazy'),
    _    = require('lodash')

hazy.matcher.config({
  path: '$.owner.id',
  handler: function(stub, matches, pattern) {
    console.log('\nMatched dog owner id ', matches, pattern)

    return _.extend(stub, {special: true})  // return the stub after mutating it (if you so desire)
  }
})

hazy.stub.register('someDude', {
  id: '|~misc:guid|',
  name: '|~person:name|',
  ssn: '|~person:ssn| (not really)',
  twitter: '|~web:twitter|',
  // super: {
    deep: [
      1, 2, 3, 4, 'derp'
    ]
  // }
})

hazy.stub.register('simpleDate', '|~time:date|')

hazy.stub.register('someDog', {
  id: '|~misc:guid|',
  name: 'Dawg|~basic:character|',
  owner: '|@someDude|',
  born: '|@simpleDate|'
})



console.log('\nSome dude:',  hazy.stub.get('someDude'))
console.log('\nSome dog:',   hazy.stub.get('someDog'))
console.log('\nSimple var:', hazy.stub.get('simpleDate'))
