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

  it('remains on landing page when account drawer is opened and only redirects after user becomes connected', () => {
    // Visit landing page with no connection or recent connection, and open account drawer
    cy.visit('/', { userState: DISCONNECTED_WALLET_USER_STATE })
    cy.get(getTestSelector('navbar-connect-wallet')).contains('Connect').click()
    cy.url().should('not.include', '/swap')

    // Connect and verify redirect
    cy.contains('MetaMask').click()
    cy.hardhat().then((hardhat) => cy.contains(hardhat.wallet.address.substring(0, 6)))
    cy.url().should('include', '/swap')
  })

  it('allows navigation to pool', () => {
    cy.viewport(2000, 1600)
    cy.visit('/swap')
    cy.get(getTestSelector('pool-nav-link')).first().click()
    cy.url().should('include', '/pool')
  })

  it('allows navigation to pool on mobile', () => {
    cy.viewport('iphone-6')
    cy.visit('/swap')
    cy.get(getTestSelector('pool-nav-link')).last().click()
    cy.url().should('include', '/pool')
  })

  it('does not render landing page when / path is blocked', () => {
    cy.intercept('/', (req) => {
      req.reply((res) => {
        const parser = new DOMParser()
        const doc = parser.parseFromString(res.body, 'text/html')
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'x:blocked-paths')
        meta.setAttribute('content', '/,/buy')
        doc.head.appendChild(meta)

        res.body = doc.documentElement.outerHTML
      })
    })
    cy.visit('/', { userState: DISCONNECTED_WALLET_USER_STATE })

    cy.get(getTestSelector('landing-page')).should('not.exist')
    cy.get(getTestSelector('buy-fiat-button')).should('not.exist')
    cy.url().should('include', '/swap')
  })

  it('does not render uk compliance banner in US', () => {
    cy.visit('/swap')
    cy.contains('UK disclaimer').should('not.exist')
  })

  it('renders uk compliance banner in uk', () => {
    cy.intercept('https://interface.gateway.uniswap.org/v1/amplitude-proxy', (req) => {
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

  it('shows a nav button to download the app when feature is enabled', () => {
    cy.visit('/?intro=true')
    cy.get('nav').within(() => {
      cy.contains('Get the app').should('be.visible')
    })
    cy.visit('/swap')
    cy.get('nav').within(() => {
      cy.contains('Get the app').should('not.exist')
    })
  })

  it('hides call to action text on small screen sizes', () => {
    cy.viewport('iphone-8')
    cy.visit('/?intro=true')
    cy.get(getTestSelector('get-the-app-cta')).should('not.be.visible')
  })

  it('opens modal when Get-the-App button is selected', () => {
    cy.visit('/?intro=true')
    cy.get('nav').within(() => {
      cy.contains('Get the app').should('exist').click()
    })
    cy.contains('Download the Uniswap app').should('exist')
  })

  it('closes modal when close button is selected', () => {
    cy.visit('/?intro=true')
    cy.get('nav').within(() => {
      cy.contains('Get the app').should('exist').click()
    })
    cy.contains('Download the Uniswap app').should('exist')
    cy.get(getTestSelector('get-the-app-close-button')).click()
    cy.contains('Download the Uniswap app').should('not.exist')
  })

  it('closes modal when user selects area outside of modal', () => {
    cy.visit('/?intro=true')
    cy.get('nav').within(() => {
      cy.contains('Get the app').should('exist').click()
    })
    cy.contains('Download the Uniswap app').should('exist')
    cy.get('nav').click({ force: true })
    cy.contains('Download the Uniswap app').should('not.exist')
  })
})
