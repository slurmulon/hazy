var hazy = require('./src/hazy')

// hazy.matcher.addConfig({
//   stub: 'someDog',
//   handler: function() {
//     // do something to the stub 
//     console.log('derp')
//   }
// })

hazy.stub.register('someDude', {
  name: '|~person:name|',
  ssn: '|~person:ssn| (not really)',
  id: '|~misc:guid|',
  // super: {
    deep: [
      1, 2, 3, 4, 'derp'
    ]
  // }
})

hazy.stub.register('someDog', {
  name: ' !!Letter |~basic:character| --- |~basic:character|',
  owner: '|@someDude|'
})

console.log('HAZY ASDFLKAJSDFASFD', hazy.stub.pool['someDog'])

console.log('HAZY SEED POOL ', hazy.stub.get('someDog'))
console.log('HAZY SEED POOL ', hazy.stub.get('someDog'))
