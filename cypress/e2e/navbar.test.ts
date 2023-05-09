import { getTestSelector } from '../utils'

describe('NavBar', () => {
  it('navigates between pages', () => {
    cy.visit('/', { userState: {} })

    // Click every internal link in the navbar and verify that the page loads.
    cy.contains('Swap').click()
    cy.url().should('include', '/swap')
    cy.contains('Select token').should('exist')

    cy.contains('Tokens').click()
    cy.url().should('include', '/tokens')
    cy.contains('Top tokens on Uniswap').should('exist')

    cy.contains('NFTs').click()
    cy.url().should('include', '/nfts')
    cy.contains('Trending NFT collections').should('exist')

    // Click the dropdown and verify that it is labeled and opens.
    cy.get(getTestSelector('navbar-more')).first().get('[aria-label="Show resources"]')
    cy.get(getTestSelector('navbar-more')).first().click()
    cy.get(getTestSelector('navbar-more')).first().get('[aria-label="Hide resources"]')
    cy.get(getTestSelector('navbar-more')).first().click()

    // Click every internal link in the dropdown and verify that the page loads.
    cy.get(getTestSelector('navbar-more')).first().click().contains('Pool').click()
    cy.url().should('include', '/pool')
    cy.contains('liquidity positions').should('exist')

    cy.get(getTestSelector('navbar-more')).first().click().contains('governance').click()
    cy.url().should('include', '/vote')
    cy.contains('Create Proposal').should('exist')
  })

  it('includes Pool on larger viewport', () => {
    cy.viewport(2000, 1600).visit('/', { userState: {} })
    cy.contains('Pools').click()
    cy.url().should('include', '/pool')
    cy.contains('liquidity positions').should('exist')
  })

  it('works on mobile', () => {
    cy.viewport('iphone-6').visit('/', { userState: {} })

    // Click every internal link in the navbar and verify that the page loads.
    cy.get(getTestSelector('mobile-navbar')).contains('Swap').click()
    cy.url().should('include', '/swap')
    cy.contains('Select token').should('exist')

    cy.get(getTestSelector('mobile-navbar')).contains('Tokens').click()
    cy.url().should('include', '/tokens')
    cy.contains('Top tokens on Uniswap').should('exist')

    cy.get(getTestSelector('mobile-navbar')).contains('NFTs').click()
    cy.url().should('include', '/nfts')
    cy.contains('Trending NFT collections').should('exist')

    cy.get(getTestSelector('mobile-navbar')).contains('Pools').click()
    cy.url().should('include', '/pool')
    cy.contains('liquidity positions').should('exist')

    // Click the dropdown and verify that it is labeled and opens.
    cy.get(getTestSelector('navbar-more')).last().get('[aria-label="Show resources"]')
    cy.get(getTestSelector('navbar-more')).last().click()
    cy.get(getTestSelector('navbar-more')).last().get('[aria-label="Hide resources"]')
    cy.get(getTestSelector('navbar-more')).last().click()

    // Click every internal link in the dropdown and verify that the page loads.
    cy.get(getTestSelector('navbar-more')).last().click().contains('governance').click()
    cy.url().should('include', '/vote')
    cy.contains('Create Proposal').should('exist')
  })
})
