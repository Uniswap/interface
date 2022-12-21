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
    cy.get('#pool-nav-link').click()
    cy.url().should('include', '/pool')
  })
})
