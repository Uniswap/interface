import { getTestSelector } from '../utils'

describe('Landing Page', () => {
  it('shows landing page when no selectedWallet', () => {
    cy.visit('/', { noWallet: true })
    cy.get(getTestSelector('landing-page'))
    cy.screenshot()
  })

  it('redirects to swap page when selectedWallet is INJECTED', () => {
    cy.visit('/', { selectedWallet: 'INJECTED' })
    cy.get('#swap-page')
    cy.url().should('include', '/swap')
    cy.screenshot()
  })

  it('shows landing page when selectedWallet is INJECTED and ?intro=true is in query', () => {
    cy.visit('/?intro=true', { selectedWallet: 'INJECTED' })
    cy.get(getTestSelector('landing-page'))
  })

  it('shows landing page when the unicorn icon in nav is selected', () => {
    cy.get(getTestSelector('uniswap-logo')).click()
    cy.get(getTestSelector('landing-page'))
  })

  it('allows navigation to pool', () => {
    cy.viewport(2000, 1600)
    cy.visit('/swap')
    cy.get(getTestSelector('pool-nav-link')).first().click()
    cy.url().should('include', '/pools')
  })

  it('allows navigation to pool on mobile', () => {
    cy.viewport('iphone-6')
    cy.visit('/swap')
    cy.get(getTestSelector('pool-nav-link')).last().click()
    cy.url().should('include', '/pools')
  })
})
