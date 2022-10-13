const createAsyncMiddleware = require('json-rpc-engine/src/createAsyncMiddleware')
const createScaffoldMiddleware = require('json-rpc-engine/src/createScaffoldMiddleware')

module.exports = createParityWalletMiddleware

function createParityWalletMiddleware({ walletMiddleware }){
  const parityRequestCount = 0
  const parityRequests = []

  return createScaffoldMiddleware({
    'parity_defaultAccount': createAsyncMiddleware(defaultAccount),
    'parity_postTransaction': createAsyncMiddleware(postTransaction),
    'parity_postSign': createAsyncMiddleware(postSign),
    'parity_checkRequest': createAsyncMiddleware(checkRequest),
  })

  //
  // parity wallet methods
  //

  async function defaultAccount (req, res) {
    res.result = await callOnWalletMiddleware({ method: 'eth_coinbase', params: [] })
  }

  async function postTransaction (req, res) {
    const reqId = createReqId()
    res.result = reqId

    // dont wait for result
    setTimeout(async () => {
      try {
        const txHash = await callOnWalletMiddleware({ method: 'eth_sendTransaction', params: req.params })
        parityRequests[reqId] = { result: txHash }
      } catch (error) {
        parityRequests[reqId] = { error }
      }
    })
  }

  async function postSign (req, res) {
    const reqId = createReqId()
    res.result = reqId

    // dont wait for result
    setTimeout(async () => {
      try {
        const sigResult = await callOnWalletMiddleware({ method: 'eth_sign', params: req.params })
        parityRequests[reqId] = { result: sigResult }
      } catch (error) {
        parityRequests[reqId] = { error }
      }
    })
  }

  async function checkRequest (req, res) {
    const result = parityRequests[reqId]
    // request not handled yet
    if (!result) {
      res.result = null
      return
    }
    // request resulted in error (e.g. tx was rejected)
    if (result.error) {
      throw result.error
    }
    // request was handled correctly
    res.result = result
  }

  //
  // utility
  //

  function createReqId() {
    // get request id
    const reqId = `0x${parityRequestCount.toString(16)}`
    parityRequestCount++
    return reqId
  }

  async function callOnWalletMiddleware(req) {
    const res = {}
    await new Promise(resolve => walletMiddleware(req, res, null, resolve))
    return res.result
  }

}
