import { USDC_MAINNET } from '../../src/constants/tokens'
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

  it('can swap ETH for USDC', () => {
    const TOKEN_ADDRESS = USDC_MAINNET.address
    const BALANCE_INCREMENT = 1
    cy.then(() => hardhat.utils.getBalance(hardhat.wallet.address, USDC_MAINNET))
      .then((balance) => Number(balance.toFixed(1)))
      .then((initialBalance) => {
        cy.get('#swap-currency-output .open-currency-select-button').click()
        cy.get('[data-testid="token-search-input"]').clear().type(TOKEN_ADDRESS)
        cy.contains('USDC').click()
        cy.get('#swap-currency-output .token-amount-input').clear().type(BALANCE_INCREMENT.toString())
        cy.get('#swap-currency-input .token-amount-input').should('not.equal', '')
        cy.get('#swap-button').click()
        cy.get('#confirm-swap-or-send').click()
        cy.get('[data-testid="dismiss-tx-confirmation"]').click()
        // ui check
        cy.get('#swap-currency-output [data-testid="balance-text"]').should(
          'have.text',
          `Balance: ${initialBalance + BALANCE_INCREMENT}`
        )

        // chain state check
        cy.then(() => hardhat.utils.getBalance(hardhat.wallet.address, USDC_MAINNET))
          .then((balance) => Number(balance.toFixed(1)))
          .should('eq', initialBalance + BALANCE_INCREMENT)
      })
  })

  it('add a recipient does not exist unless in expert mode', () => {
    cy.get('#add-recipient-button').should('not.exist')
  })

  it.skip('ETH to wETH is same value (wrapped swaps have no price impact)', () => {
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.get('.token-item-0xc778417E063141139Fce010982780140Aa0cD5Ab').click()
    cy.get('#swap-currency-input .token-amount-input').clear().type('0.01')
    cy.get('#swap-currency-output .token-amount-input').should('have.value', '0.01')
  })
})
