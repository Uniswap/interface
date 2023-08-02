import { DAI, USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

const QuoteEndpoint = 'https://api.uniswap.org/v2/quote'
const QuoteWhereUniswapXIsBetter = 'uniswapx/quote1.json'

/** Simulates the user opening swap settings and toggling UniswapX.  */
function toggleUniswapXInSwapSettings() {
  cy.get(getTestSelector('open-settings-dialog-button')).click()
  cy.get(getTestSelector('toggle-uniswap-x-button')).click()
  cy.get(getTestSelector('open-settings-dialog-button')).click()
}

describe('UniswapX Toggle', () => {
  beforeEach(() => {
    cy.intercept(QuoteEndpoint, { fixture: QuoteWhereUniswapXIsBetter })
    cy.visit(`/swap/?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`, {
      ethereum: 'hardhat',
    })
  })

  it('only displays uniswapx ui when setting is on', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')

    // UniswapX ui should not be visible
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('not.exist')

    toggleUniswapXInSwapSettings()

    // UniswapX ui should not be visible
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('exist')
  })

  it('prompts opt-in if UniswapX is better', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')

    // UniswapX should not display in gas estimate row before opt-in
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('not.exist')

    // Hide banner that partially covers UniswapX mustache
    cy.get(getTestSelector('uniswap-wallet-banner')).click()

    // UniswapX mustache should be visible
    cy.contains('Try it now').click()

    // Opt-in dialog should now be hidden
    cy.contains('Try it now').should('not.be.visible')

    // UniswapX should display in gas estimate row
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('exist')

    // Opt-in dialog should not reappear if user manually toggles UniswapX off
    toggleUniswapXInSwapSettings()
    cy.contains('Try it now').should('not.be.visible')
  })
})
