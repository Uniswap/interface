const pify = require('pify')
const clone = require('clone')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const blockTagParamIndex = require('./cache-utils').blockTagParamIndex

module.exports = createBlockRefMiddleware

function createBlockRefMiddleware (opts = {}) {
  const { provider, blockTracker } = opts
  if (!provider) throw Error('BlockRefMiddleware - mandatory "provider" option is missing.')
  if (!blockTracker) throw Error('BlockRefMiddleware - mandatory "blockTracker" option is missing.')

  return createAsyncMiddleware(async (req, res, next) => {
    const blockRefIndex = blockTagParamIndex(req)
    // skip if method does not include blockRef
    if (blockRefIndex === undefined) return next()
    // skip if not "latest"
    let blockRef = req.params[blockRefIndex]
    // omitted blockRef implies "latest"
    if (blockRef === undefined) blockRef = 'latest'
    if (blockRef !== 'latest') return next()
    // lookup latest block
    const latestBlockNumber = await blockTracker.getLatestBlock()
    // create child request with specific block-ref
    const childRequest = clone(req)
    childRequest.params[blockRefIndex] = latestBlockNumber
    // perform child request
    const childRes = await pify(provider.sendAsync).call(provider, childRequest)
    // copy child response onto original response
    res.result = childRes.result
    res.error = childRes.error
  })

}
