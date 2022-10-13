const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')

const futureBlockRefRequests = ['eth_getTransactionByHash', 'eth_getTransactionReceipt']

module.exports = createBlockTrackerInspectorMiddleware

// inspect if response contains a block ref higher than our latest block
function createBlockTrackerInspectorMiddleware ({ blockTracker }) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (!futureBlockRefRequests.includes(req.method)) return next()
    await next()
    // abort if no result or no block number
    if (!res.result || !res.result.blockNumber) return
    // if number is higher, suggest block-tracker check for a new block
    const blockNumber = Number.parseInt(res.result.blockNumber, 16)
    const currentBlockNumber = Number.parseInt(blockTracker.getCurrentBlock(), 16)
    if (blockNumber > currentBlockNumber) await blockTracker.checkForLatestBlock()
  })
}
