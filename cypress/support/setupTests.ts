// @ts-ignore
import TokenListJSON from '@uniswap/default-token-list'
import { CyHttpMessages } from 'cypress/types/net-stubbing'

beforeEach(() => {
  // Many API calls enforce that requests come from our app, so we must mock Origin and Referer.
  cy.intercept('*', (req) => {
    req.headers['referer'] = 'https://app.uniswap.org'
    req.headers['origin'] = 'https://app.uniswap.org'
  })

  // Infura uses a test endpoint, which allow-lists http://localhost:3000 instead.
  cy.intercept(/infura.io/, (req) => {
    req.headers['referer'] = 'http://localhost:3000'
    req.headers['origin'] = 'http://localhost:3000'
    req.alias = req.body.method
    req.continue()
  })

  // Log requests to hardhat.
  cy.intercept(/:8545/, logJsonRpc)

  // Mock analytics responses to avoid analytics in tests.
  cy.intercept('https://api.uniswap.org/v1/amplitude-proxy', (req) => {
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
  }).intercept('https://*.sentry.io', { statusCode: 200 })

  // Mock our own token list responses to avoid the latency of IPFS.
  cy.intercept('https://gateway.ipfs.io/ipns/tokens.uniswap.org', TokenListJSON)
    .intercept('https://gateway.ipfs.io/ipns/extendedtokens.uniswap.org', { statusCode: 404 })
    .intercept('https://gateway.ipfs.io/ipns/unsupportedtokens.uniswap.org', { statusCode: 404 })

  // Reset hardhat between tests to ensure isolation.
  // This resets the fork, as well as options like automine.
  cy.hardhat().then((hardhat) => hardhat.reset())
})

function logJsonRpc(req: CyHttpMessages.IncomingHttpRequest) {
  req.alias = req.body.method
  const log = Cypress.log({
    autoEnd: false,
    name: req.body.method,
    message: req.body.params?.map((param: unknown) =>
      typeof param === 'object' ? '{...}' : param?.toString().substring(0, 10)
    ),
  })
  req.on('after:response', (res) => {
    if (res.statusCode === 200) {
      log.end()
    } else {
      log.error(new Error(`${res.statusCode}: ${res.statusMessage}`))
    }
  })
}
