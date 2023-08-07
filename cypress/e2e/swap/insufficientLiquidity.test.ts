import { DAI, USDC_MAINNET } from '../../../src/constants/tokens'

describe('Swap errors (no liquidity)', () => {
  beforeEach(() => {
    cy.intercept('POST', 'https://api.uniswap.org/v2/quote', {
      statusCode: 404,
      fixture: 'insufficientLiquidity.json',
    })
  })

  it('insufficient liquidity', () => {
    cy.visit(`/swap?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`)
    // The API response is too variable so stubbing a 404.
    cy.get('#swap-currency-output .token-amount-input').type('100000000000000').should('have.value', '100000000000000') // 100 trillion
    cy.contains('Insufficient liquidity for this trade.')
    cy.get('#swap-button').should('not.exist')
  })
})
