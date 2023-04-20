import { HardhatProvider } from '../support/hardhat'

describe('Swap', () => {
  let hardhat: HardhatProvider
  before(() => {
    cy.visit('/swap', { ethereum: 'hardhat' }).then((window) => {
      hardhat = window.hardhat
    })
  })

  it('starts with ETH selected by default', () => {
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
    cy.get('#swap-currency-input .token-symbol-container').should('contain.text', 'ETH')
    cy.get('#swap-currency-output .token-amount-input').should('not.have.value')
    cy.get('#swap-currency-output .token-symbol-container').should('contain.text', 'Select token')
  })

  it('can enter an amount into input', () => {
    cy.get('#swap-currency-input .token-amount-input').clear().type('0.001').should('have.value', '0.001')
  })

  it('zero swap amount', () => {
    cy.get('#swap-currency-input .token-amount-input').clear().type('0.0').should('have.value', '0.0')
  })

  it('invalid swap amount', () => {
    cy.get('#swap-currency-input .token-amount-input').clear().type('\\').should('have.value', '')
  })

  it('can enter an amount into output', () => {
    cy.get('#swap-currency-output .token-amount-input').clear().type('0.001').should('have.value', '0.001')
  })

  it('zero output amount', () => {
    cy.get('#swap-currency-output .token-amount-input').clear().type('0.0').should('have.value', '0.0')
  })

  /*
1. use token selector to import token0 and token1 addresses as in/output
2. “touch” input (or output for exactOutput) value and set to some very minimal value
3. wait for quoter to complete and “swap” button to enable
4. `assert` swap details expansion panel content is as expected (input amount, token symbols)
5. click “approve use of <$TOKEN>”
  1. approve via hardhat
  2. or sign permit and submit via hardhat
6. `assert` ”approve in your wallet” state
7. mine transaction w/ hardhat
8. click swap button
9. `assert` correct confirmation modal content (input amount, token symbols)
10. click “confirm swap”
11. `assert` waiting for confirmation modal
12. mine transaction w/ hardhat
13. `assert` smart contract balance updated
14. `comment` with jira link to task outlining a test update which would assert based on backend data derived from chain state (i.e., mini portfolio)
*/

  it.only('can swap ETH for USDC', () => {
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get('[data-testid="token-search-input"]').clear().type('USDC')
    cy.contains('USDC').click()
    cy.get('#swap-currency-input .token-amount-input').clear().type('0.0000001')
    cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')
    // cy.get('#swap-button').click()
    // cy.get('#confirm-swap-or-send').should('contain', 'Confirm Swap')
    // cy.get('[data-cy="confirmation-close-icon"]').click()
  })

  it('add a recipient does not exist unless in expert mode', () => {
    cy.get('#add-recipient-button').should('not.exist')
  })

  it('ETH to wETH is same value (wrapped swaps have no price impact)', () => {
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get('.token-item-0xc778417E063141139Fce010982780140Aa0cD5Ab').click()
    cy.get('#swap-currency-input .token-amount-input').clear().type('0.01')
    cy.get('#swap-currency-output .token-amount-input').should('have.value', '0.01')
  })
})
