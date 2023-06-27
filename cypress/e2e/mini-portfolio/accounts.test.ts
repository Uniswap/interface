import { getTestSelector } from '../../utils'

describe('Mini Portfolio account drawer', () => {
  beforeEach(() => {
    cy.intercept(/api.uniswap.org\/v1\/graphql/, cy.spy().as('gqlSpy'))
    cy.visit('/swap', { ethereum: 'hardhat' })
  })

  it('fetches balances when account button is first hovered', () => {
    // The balances should not be fetched before the account button is hovered
    cy.get('@gqlSpy').should('not.have.been.called')

    // Balances should have been fetched once after hover
    cy.get(getTestSelector('web3-status-connected')).trigger('mouseover')
    cy.get('@gqlSpy').should('have.been.calledOnce')

    // Balances should not be refetched upon second hover
    cy.get(getTestSelector('web3-status-connected')).trigger('mouseover')
    cy.get('@gqlSpy').should('have.been.calledOnce')

    // Balances should not be refetched upon opening drawer
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get('@gqlSpy').should('have.been.calledOnce')

    // Balances should not be refetched upon closing & reopening drawer
    cy.get(getTestSelector('close-account-drawer')).click()
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get('@gqlSpy').should('have.been.calledOnce')
  })

  it('fetches account information', () => {
    // Open the mini portfolio
    cy.intercept(/graphql/, { fixture: 'mini-portfolio/tokens.json' })
    cy.get(getTestSelector('web3-status-connected')).click()

    // Verify that wallet state loads correctly
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('Tokens')
    cy.get(getTestSelector('mini-portfolio-page')).contains('Hidden (201)')

    cy.intercept(/graphql/, { fixture: 'mini-portfolio/nfts.json' })
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('NFTs').click()
    cy.get(getTestSelector('mini-portfolio-page')).contains('I Got Plenty')

    cy.get(getTestSelector('mini-portfolio-navbar')).contains('Pools').click()
    cy.get(getTestSelector('mini-portfolio-page')).contains('No pools yet')

    cy.intercept(/graphql/, { fixture: 'mini-portfolio/activity.json' })
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()
    cy.get(getTestSelector('mini-portfolio-page')).contains('Contract Interaction')
  })

  it('refetches balances when account changes', () => {
    cy.hardhat().then((hardhat) => {
      const accountA = hardhat.wallets[0].address
      const accountB = hardhat.wallets[1].address

      // Opens the account drawer
      cy.get(getTestSelector('web3-status-connected')).click()

      // A shortened version of the first account's address should be shown
      cy.contains(accountA.slice(0, 6)).should('exist')

      // Stores the current portfolio balance to later compare to next account's balance
      cy.get(getTestSelector('portfolio-total-balance'))
        .invoke('text')
        .then((originalBalance) => {
          // TODO(INFRA-3) Replace window.ethereum access below with cypress-hardhat utility
          // Simulates the wallet changing accounts via eip-1193 event
          cy.window().then((win) => win.ethereum.emit('accountsChanged', [accountB]))

          // The second account's address should now be shown
          cy.contains(accountB.slice(0, 6)).should('exist')

          // The second account's portfolio balance should differ from the original balance
          cy.get(getTestSelector('portfolio-total-balance')).should('not.have.text', originalBalance)
        })
    })
  })
})
