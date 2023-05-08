import { getTestSelector } from '../../utils'

describe.skip('network switching', () => {
  it('should clear swap inputs when switching networks', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })

    // Select an output currency
    cy.get('#swap-currency-output .open-currency-select-button').click()
    cy.contains('USDC').click()

    // Populate input/output fields
    cy.get('#swap-currency-input .token-amount-input').clear().type('1')
    cy.get('#swap-currency-output .token-amount-input').should('not.equal', '')

    // Switch networks
    cy.get(getTestSelector('chain-selector-button')).eq(1).click()
    cy.contains('Polygon').click()

    // Assert that the input/output fields are empty
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
    cy.get('#swap-currency-output .token-amount-input').should('have.value', '')
  })

  it('should render a different LP position for the same id', () => {
    cy.visit('/pools/1', { ethereum: 'hardhat' })

    cy.contains('UNI / ETH').should('exist')

    // Switch networks
    cy.get(getTestSelector('chain-selector-button')).eq(1).click()
    cy.contains('Arbitrum').click()

    // Assert that the LP position is different
    cy.contains('UNI / ETH').should('not.exist')
    cy.contains('MOODY / NOAH').should('exist')
  })

  it('should successfully add a new network to the wallet', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })

    // Switch networks
    cy.get(getTestSelector('chain-selector-button')).eq(1).click()
    cy.contains('Polygon').click()

    // Assert that the network is added
    cy.contains('Polygon').should('exist')
  })
})
