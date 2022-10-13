const clone = require('clone')
const pify = require('pify')
const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const blockTagParamIndex = require('./cache-utils').blockTagParamIndex

//
// RetryOnEmptyMiddleware will retry any request with an empty response that has
// a numbered block reference at or lower than the blockTracker's latest block.
// Its useful for dealing with load-balanced ethereum JSON RPC
// nodes that are not always in sync with each other.
//

module.exports = createRetryOnEmptyMiddleware

// empty values used to determine if a request should be retried
// `<nil>` comes from https://github.com/ethereum/go-ethereum/issues/16925
const emptyValues = [undefined, null, '\u003cnil\u003e']

function createRetryOnEmptyMiddleware (opts = {}) {
  const { provider, blockTracker } = opts
  if (!provider) throw Error('BlockRefRewriteMiddleware - mandatory "provider" option is missing.')
  if (!blockTracker) throw Error('BlockRefRewriteMiddleware - mandatory "blockTracker" option is missing.')

  return createAsyncMiddleware(async (req, res, next) => {
    const blockRefIndex = blockTagParamIndex(req)
    // skip if method does not include blockRef
    if (blockRefIndex === undefined) return next()
    // skip if not exact block references
    let blockRef = req.params[blockRefIndex]
    // omitted blockRef implies "latest"
    if (blockRef === undefined) blockRef = 'latest'
    // skip if non-number block reference
    if (['latest', 'pending'].includes(blockRef)) return next()
    // skip if block refernce is not a valid number
    const blockRefNumber = Number.parseInt(blockRef.slice(2), 16)
    if (Number.isNaN(blockRefNumber)) return next()
    // lookup latest block
    const latestBlockNumberHex = await blockTracker.getLatestBlock()
    const latestBlockNumber = Number.parseInt(latestBlockNumberHex.slice(2), 16)
    // skip if request block number is higher than current
    if (blockRefNumber > latestBlockNumber) return next()
    // create child request with specific block-ref
    const childRequest = clone(req)
    // attempt child request until non-empty response is received
    const childResponse = await retry(10, async () => {
      const attemptResponse = await pify(provider.sendAsync).call(provider, childRequest)
      // verify result
      if (emptyValues.includes(attemptResponse.result)) {
        throw new Error(`RetryOnEmptyMiddleware - empty response "${JSON.stringify(attemptResponse)}" for request "${JSON.stringify(childRequest)}"`)
      }
      return attemptResponse
    })
    // copy child response onto original response
    res.result = childResponse.result
    res.error = childResponse.error
  })

}

async function retry(maxRetries, asyncFn) {
  for (let index = 0; index < maxRetries; index++) {
    try {
      return await asyncFn()
    } catch (err) {
      await timeout(1000)
    }
  }
  throw new Error('BlockReEmitMiddleware - retries exhausted')
}

function timeout(duration) {
  return new Promise(resolve => setTimeout(resolve, duration))
}
