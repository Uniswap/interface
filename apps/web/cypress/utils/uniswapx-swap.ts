import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { CyHttpMessages } from 'cypress/types/net-stubbing'

const PricingQuoteUSDC = 'uniswapx/pricingQuoteUSDC.json'
const PricingQuoteDAI = 'uniswapx/pricingQuoteDAI.json'

const QuoteEndpoint = 'https://interface.gateway.uniswap.org/v2/quote'

/** Stubs quote to return a quote for non-price requests */
export function stubNonPriceQuoteWith(fixture: string) {
  cy.intercept(QuoteEndpoint, (req: CyHttpMessages.IncomingHttpRequest) => {
    let body = req.body
    if (typeof body === 'string') {
      body = JSON.parse(body)
    }
    if (body.intent === 'pricing') {
      const pricingFixture = body.tokenIn === USDC_MAINNET.address ? PricingQuoteUSDC : PricingQuoteDAI
      req.reply({ fixture: pricingFixture })
    } else {
      req.reply({ fixture })
    }
  }).as('quote')
}

/** Stubs the provider to return a tx receipt corresponding to the mock filled uniswapx order's txHash */
export function stubSwapTxReceipt() {
  cy.hardhat().then((hardhat) => {
    cy.fixture('uniswapx/fillTransactionReceipt.json').then((mockTxReceipt) => {
      const getTransactionReceiptStub = cy.stub(hardhat.provider, 'getTransactionReceipt').log(false)
      getTransactionReceiptStub.withArgs(mockTxReceipt.transactionHash).resolves(mockTxReceipt)
      getTransactionReceiptStub.callThrough()
    })
  })
}
