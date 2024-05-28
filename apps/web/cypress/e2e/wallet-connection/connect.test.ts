import { getTestSelector } from '../../utils'

describe('disconnect wallet', () => {
  it('should not clear state', () => {
    cy.visit('/swap')
    cy.get('#swap-currency-input .token-amount-input').clear().type('1')

    // Verify wallet is connected
    cy.hardhat().then((hardhat) => cy.contains(hardhat.wallet.address.substring(0, 6)))
    cy.contains('Balance:')

    // Disconnect the wallet
    cy.hardhat().then((hardhat) => cy.contains(hardhat.wallet.address.substring(0, 6)).click())
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.get(getTestSelector('wallet-disconnect')).contains('Disconnect') // Confirmation UI
    cy.get(getTestSelector('wallet-disconnect')).click() // Confirm

    // Verify wallet has disconnected
    cy.contains('Connect a wallet').should('exist')
    cy.get(getTestSelector('navbar-connect-wallet')).contains('Connect')
    cy.contains('Connect wallet')

    // Verify swap input is not cleared
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '1')
  })
})

describe('connect wallet', () => {
  it('should load state', () => {
    cy.visit('/swap', { eagerlyConnect: false })

    // Connect the wallet
    cy.get(getTestSelector('navbar-connect-wallet')).contains('Connect').click()
    cy.contains('MetaMask').click()

    // Verify wallet is connected
    cy.hardhat().then((hardhat) => cy.contains(hardhat.wallet.address.substring(0, 6)))
    cy.contains('Balance:')
  })
})
