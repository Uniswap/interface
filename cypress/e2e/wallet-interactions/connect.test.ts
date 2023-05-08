import { getTestSelector } from '../../utils'

describe('disconnect wallet', () => {
  it('should remove the connected wallet mini portfolio', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })

    cy.contains('Balance:').should('exist')
    cy.get('#swap-currency-input .token-amount-input').clear().type('1')

    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.contains('Connect a wallet').should('exist')
    cy.get(getTestSelector('close-account-drawer')).click()
  })
  it('should clear swap inputs on disconnect', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })

    cy.contains('Balance:').should('exist')
    cy.get('#swap-currency-input .token-amount-input').clear().type('1')

    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.get(getTestSelector('close-account-drawer')).click()
    cy.get('#swap-currency-input .token-amount-input').should('have.value', '')
  })
})

describe('connect wallet', () => {
  it('should load balances', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })
    // Disconnect the injected wallet from the application
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.contains('Balance:').should('not.exist')

    // Reconnect to the application
    cy.contains('MetaMask').click()

    // Assert that the balances are loaded
    cy.contains('Balance:').should('exist')
  })
  it('should load NFTs', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })
    // Disconnect the injected wallet from the application
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.contains('Balance:').should('not.exist')

    // Reconnect to the application
    cy.contains('MetaMask').click()

    // Open the mini portfolio
    cy.get(getTestSelector('web3-status-connected')).click()
    // Navigate to the NFTs tab
    cy.get(getTestSelector('mini-portfolio-nav-nfts')).click()
    // Assert that the NFTs are loaded
    cy.get(getTestSelector('mini-portfolio-nfts-container')).children().should('have.length.gt', 0)
  })
  it('should load activity history', () => {
    cy.visit('/swap', { ethereum: 'hardhat' })
    // Disconnect the injected wallet from the application
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get(getTestSelector('wallet-disconnect')).click()
    cy.contains('Balance:').should('not.exist')

    // Reconnect to the application
    cy.contains('MetaMask').click()

    // Open the mini portfolio
    cy.get(getTestSelector('web3-status-connected')).click()
    // Navigate to Activity tab
    cy.get(getTestSelector('mini-portfolio-nav-activity')).click()

    // Assert that the activity history is loaded
    cy.get(getTestSelector('mini-portfolio-activity-descriptor')).should('exist')
  })
})
