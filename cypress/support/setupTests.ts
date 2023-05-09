// @ts-ignore
import TokenListJSON from '@uniswap/default-token-list'

const loggableUrls = ['infura.io', 'api.uniswap.org', 'sentry.io', 'gateway.ipfs.io/ipns/tokens.uniswap.org']

const log = Cypress.log
Cypress.log = function (options, ...args) {
  // Squelch logs from "unlisted" domains, as they clutter the logs so much as to make them unusable.
  // See https://docs.cypress.io/api/commands/intercept#Disabling-logs-for-a-request.
  // TODO(https://github.com/cypress-io/cypress/issues/26069): Squelch only wildcard logs once Cypress allows it.
  if (options.displayName === 'script' || options.name === 'request') {
    if (!loggableUrls.some((url) => (options as { url: string }).url.includes(url))) {
      return
    }
  }
  return log(options, ...args)
} as typeof log

beforeEach(() => {
  // Many API calls enforce that requests come from our app, so we must mock Origin and Referer.
  cy.intercept({ url: '*', middleware: true }, (req) => {
    req.headers['referer'] = 'https://app.uniswap.org'
    req.headers['origin'] = 'https://app.uniswap.org'
  })

  // Infura uses a test endpoint, which allow-lists http://localhost:3000 instead.
  cy.intercept({ url: /infura\.io/, middleware: true }, (req) => {
    req.headers['referer'] = 'http://localhost:3000'
    req.headers['origin'] = 'http://localhost:3000'
  }).as('infura')

  // Mock analytics responses to avoid analytics in tests.
  cy.intercept(/\/\/api.uniswap.org\/v1\/amplitude-proxy/, (req) => {
    const requestBody = JSON.stringify(req.body)
    const byteSize = new Blob([requestBody]).size
    req.alias = 'amplitude'
    req.reply(
      JSON.stringify({
        code: 200,
        server_upload_time: Date.now(),
        payload_size_bytes: byteSize,
        events_ingested: req.body.events.length,
      })
    )
  })
    .as('amplitude')
    .intercept(/\/\/api.uniswap.org\/v1\/statsig-proxy/)
    .as('statsig')
    .intercept(/sentry\.io/, { statusCode: 200 })
    .as('sentry')

  // Mock our own token list responses to avoid the latency of IPFS.
  cy.intercept('https://gateway.ipfs.io/ipns/tokens.uniswap.org', { body: TokenListJSON })
    .as('tokenlist')
    .intercept('https://gateway.ipfs.io/ipns/extendedtokens.uniswap.org', { statusCode: 404 })
    .intercept('https://gateway.ipfs.io/ipns/unsupportedtokens.uniswap.org', {
      statusCode: 404,
    })

  // Reset hardhat between tests to ensure isolation.
  // This resets the fork, as well as options like automine.
  cy.hardhat().then((hardhat) => hardhat.reset())
})
