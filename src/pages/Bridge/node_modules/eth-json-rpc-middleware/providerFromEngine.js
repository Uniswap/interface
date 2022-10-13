const SafeEventEmitter = require('safe-event-emitter')

module.exports = providerFromEngine

function providerFromEngine (engine) {
  const provider = new SafeEventEmitter()
  // handle both rpc send methods
  provider.sendAsync = engine.handle.bind(engine)
  provider.send = (req, callback) => {
    if (!callback) throw new Error('Web3 Provider - must provider callback to "send" method')
    engine.handle(req, callback)
  }
  // forward notifications
  if (engine.on) {
    engine.on('notification', (message) => {
      provider.emit('data', null, message)
    })
  }
  return provider
}
