const test = require('tape')
const SourcePollingBlockTracker = require('../src/polling')
const DistPollingBlockTracker = require('../dist/PollingBlockTracker')
const SourceSubscribeBlockTracker = require('../src/subscribe')
const DistSubscribeBlockTracker = require('../dist/SubscribeBlockTracker')
const SourceBaseBlockTracker = require('../src/base')
const DistBaseBlockTracker = require('../dist/BaseBlockTracker')
const runBaseTests = require('./base')
const runPollingTests = require('./polling')
const runSubscribeTests = require('./subscribe')

runBaseTests(test, 'source - BaseBlockTracker', SourceBaseBlockTracker)
runBaseTests(test, 'dist - BaseBlockTracker', DistBaseBlockTracker)

runPollingTests(test, 'source - PollingBlockTracker', SourcePollingBlockTracker)
runPollingTests(test, 'dist - PollingBlockTracker', DistPollingBlockTracker)

runSubscribeTests(test, 'source - SubscribeBlockTracker', SourceSubscribeBlockTracker)
runSubscribeTests(test, 'dist - SubscribeBlockTracker', DistSubscribeBlockTracker)
