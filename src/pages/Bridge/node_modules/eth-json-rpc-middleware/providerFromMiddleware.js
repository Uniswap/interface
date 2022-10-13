const JsonRpcEngine = require('json-rpc-engine')
const providerFromEngine = require('./providerFromEngine')

module.exports = providerFromMiddleware

function providerFromMiddleware(middleware) {
  const engine = new JsonRpcEngine()
  engine.push(middleware)
  const provider = providerFromEngine(engine)
  return provider
}
