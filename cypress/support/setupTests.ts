// @ts-ignore
import TokenListJSON from '@uniswap/default-token-list'
import { CyHttpMessages } from 'cypress/types/net-stubbing'

beforeEach(() => {
  // Many API calls enforce that requests come from our app, so we must mock Origin and Referer.
  cy.intercept('*', (req) => {
    req.headers['referer'] = 'https://app.uniswap.org'
    req.headers['origin'] = 'https://app.uniswap.org'
  })

  // Network RPCs are disabled for cypress tests - calls should be routed through the connected wallet instead.
  cy.intercept(/infura.io/, { statusCode: 404 })
  cy.intercept(/quiknode.pro/, { statusCode: 404 })

  // Log requests to hardhat.
  cy.intercept(/:8545/, logJsonRpc)

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
    message: req.body.params?.map((param: any) =>
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
