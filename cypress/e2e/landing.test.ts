import { CONNECTED_WALLET_USER_STATE } from '../utils/user-state'

describe('Landing Page', () => {
  it('shows landing page when no user state exists', () => {
    cy.visit('/', { userState: {} })
    cy.getByTestId('landing-page')
    cy.screenshot()
  })

  it('redirects to swap page when a user has already connected a wallet', () => {
    cy.visit('/', { userState: CONNECTED_WALLET_USER_STATE })
    cy.get('#swap-page')
    cy.url().should('include', '/swap')
    cy.screenshot()
  })

  it('shows landing page when a user has already connected a wallet but ?intro=true is in query', () => {
    cy.visit('/?intro=true', { userState: CONNECTED_WALLET_USER_STATE })
    cy.getByTestId('landing-page')
  })

  it('shows landing page when the unicorn icon in nav is selected', () => {
    cy.getByTestId('uniswap-logo').click()
    cy.getByTestId('landing-page')
  })

  it('allows navigation to pool', () => {
    cy.viewport(2000, 1600)
    cy.visit('/swap')
    cy.getByTestId('pool-nav-link').first().click()
    cy.url().should('include', '/pools')
  })

  it('allows navigation to pool on mobile', () => {
    cy.viewport('iphone-6')
    cy.visit('/swap')
    cy.getByTestId('pool-nav-link').last().click()
    cy.url().should('include', '/pools')
  })
})
