import { getTestSelector } from '../utils'
import { CONNECTED_WALLET_USER_STATE, DISCONNECTED_WALLET_USER_STATE } from '../utils/user-state'

describe('Landing Page', () => {
  it('shows landing page when no user state exists', () => {
    cy.visit('/', { userState: DISCONNECTED_WALLET_USER_STATE })
    cy.get(getTestSelector('landing-page'))
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
    cy.get(getTestSelector('landing-page'))
  })

  it('shows landing page when the unicorn icon in nav is selected', () => {
    cy.visit('/swap')
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

  it('does not render uk compliance banner in US', () => {
    cy.visit('/swap')
    cy.contains('UK disclaimer').should('not.exist')
  })

  it('renders uk compliance banner in uk', () => {
    cy.intercept('https://api.uniswap.org/v1/amplitude-proxy', (req) => {
      const requestBody = JSON.stringify(req.body)
      const byteSize = new Blob([requestBody]).size
      req.alias = 'amplitude'
      req.reply(
        JSON.stringify({
          code: 200,
          server_upload_time: Date.now(),
          payload_size_bytes: byteSize,
          events_ingested: req.body.events.length,
        }),
        {
          'origin-country': 'GB',
        }
      )
    })
    cy.visit('/swap')
    cy.contains('UK disclaimer')
  })
})
