import TokenListJSON from '@uniswap/default-token-list'

beforeEach(() => {
  cy
    // Many API calls enforce that requests come from our app, so we must mock Origin and Referer.
    .intercept('*', (req) => {
      req.headers['referer'] = 'https://app.uniswap.org'
      req.headers['origin'] = 'https://app.uniswap.org'
    })
    // Infura uses a test endpoint, which allow-lists http://localhost:3000 instead.
    .intercept(/infura.io/, (req) => {
      req.headers['referer'] = 'http://localhost:3000'
      req.headers['origin'] = 'http://localhost:3000'
      req.alias = req.body.method
      req.continue()
    })
    // Mock Amplitude responses to avoid analytics from tests.
    .intercept('https://api.uniswap.org/v1/amplitude-proxy', (req) => {
      const requestBody = JSON.stringify(req.body)
      const byteSize = new Blob([requestBody]).size
      req.reply(
        JSON.stringify({
          code: 200,
          server_upload_time: Date.now(),
          payload_size_bytes: byteSize,
          events_ingested: req.body.events.length,
        })
      )
    })
    // Mock our own token list responses to avoid the latency of IPFS.
    .intercept('https://gateway.ipfs.io/ipns/tokens.uniswap.org', TokenListJSON)
    .intercept('https://gateway.ipfs.io/ipns/extendedtokens.uniswap.org', { statusCode: 201, body: { tokens: [] } })
    .intercept('https://gateway.ipfs.io/ipns/unsupportedtokens.uniswap.org', { statusCode: 201, body: { tokens: [] } })
    // Reset hardhat between tests to ensure isolation.
    // This resets the fork, as well as options like automine.
    .hardhat()
    .then((hardhat) => hardhat.reset())
})
