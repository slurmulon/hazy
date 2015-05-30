var hazy = require('./src/hazy')

hazy.matcher.config({
  path: '$.owner.id',
  handler: function(match) {
    // do something to the stub 
    console.log('dog owner id, derp')
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
  name: ' !!Letter |~basic:character| --- |~basic:character|',
  owner: '|@someDude|',
  born: '|@simpleDate|'
})



console.log('\nSome dude:',  hazy.stub.get('someDude'))
console.log('\nSome dog:',   hazy.stub.get('someDog'))
console.log('\nSimple var:', hazy.stub.get('simpleDate'))
