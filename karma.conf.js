// karma.conf.js
module.exports = function(config) {
  config.set({
    basePath: '.',
    plugins: ['karma-jasmine', 'karma-jasmine', 'karma-phantomjs-launcher'],
    browsers: ['PhantomJS'],
    frameworks: ['jasmine'],
    singleRun: true
    //...
  })
}