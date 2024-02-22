import { FeatureFlag } from 'featureFlags'
import { getTestSelector } from '../../utils'

describe('Uni tags support', () => {
  beforeEach(() => {
    const unitagSpy = cy.spy().as('unitagSpy')
    cy.intercept(/gateway.uniswap.org\/v2\/address/, (req) => {
      unitagSpy(req)
    })
    cy.visit('/swap', {
      featureFlags: [{ name: FeatureFlag.uniTags, value: true }],
    })
  })

  it('displays banner in account drawer', () => {
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.contains('Introducing uni.eth usernames')
  })

  it('displays large banner on page', () => {
    cy.get(getTestSelector('large-unitag-banner')).should('be.visible')
  })

  it('does not display banner on landing page', () => {
    cy.visit('/?intro=true', {
      featureFlags: [{ name: FeatureFlag.uniTags, value: true }],
    })
    cy.get(getTestSelector('large-unitag-banner')).should('not.be.visible')
  })

  it('opens modal and hides itself when accept button is clicked', () => {
    cy.get(getTestSelector('large-unitag-banner')).within(() => {
      cy.get(getTestSelector('unitag-banner-accept-button')).click()
    })
    cy.contains('Download the Uniswap app').should('exist')
    cy.get(getTestSelector('get-the-app-close-button')).click()
    cy.get(getTestSelector('large-unitag-banner')).should('not.be.visible')
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get('Introducing uni.eth usernames').should('not.exist')
  })

  it('hides itself when reject button is clicked', () => {
    cy.get(getTestSelector('large-unitag-banner')).within(() => {
      cy.get(getTestSelector('unitag-banner-reject-button')).click()
    })
    cy.get(getTestSelector('large-unitag-banner')).should('not.be.visible')
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get('Introducing uni.eth usernames').should('not.exist')
  })

  it('shows address if no Unitag or ENS exists', () => {
    cy.hardhat().then(() => {
      const unusedAccount = '0xF030EaA01aFf57A23483dC8A1c3550d153be69Fb'
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.window().then((win) => win.ethereum.emit('accountsChanged', [unusedAccount]))
      cy.get(getTestSelector('account-drawer-status')).within(() => {
        cy.contains('0xF030...69Fb').should('be.visible')
      })
    })
  })

  it('shows Unitag, followed by address, if Unitag exists but not ENS', () => {
    cy.intercept(/address/, { fixture: 'mini-portfolio/unitag.json' })
    cy.hardhat().then(() => {
      const accountWithUnitag = '0xF030EaA01aFf57A23483dC8A1c3550d153be69Fb'
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.window().then((win) => win.ethereum.emit('accountsChanged', [accountWithUnitag]))
      cy.get(getTestSelector('account-drawer-status')).within(() => {
        cy.contains('hayden').should('be.visible')
        cy.contains('0xF030...69Fb').should('be.visible')
      })
    })
  })

  it('shows ENS, followed by address, if ENS exists but not Unitag', () => {
    cy.hardhat().then(() => {
      const haydenAccount = '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3'
      const haydenENS = 'hayden.eth'
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.window().then((win) => win.ethereum.emit('accountsChanged', [haydenAccount]))
      cy.get(getTestSelector('account-drawer-status')).within(() => {
        cy.contains(haydenENS).should('be.visible')
        cy.contains('0x50EC...79C3').should('be.visible')
      })
    })
  })

  it('shows Unitag and more option if user has both Unitag and ENS', () => {
    cy.intercept(/address/, { fixture: 'mini-portfolio/unitag.json' })
    cy.hardhat().then(() => {
      const haydenAccount = '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3'
      const haydenUnitag = 'hayden'
      const haydenENS = 'hayden.eth'
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.window().then((win) => win.ethereum.emit('accountsChanged', [haydenAccount]))
      cy.get(getTestSelector('account-drawer-status')).within(() => {
        cy.contains(haydenUnitag).should('be.visible')
        cy.contains('0x50EC...79C3').should('be.visible')
      })
      cy.get(getTestSelector('secondary-identifiers'))
        .trigger('mouseover')
        .click()
        .within(() => {
          cy.contains(haydenENS).should('be.visible')
          cy.contains('0x50EC...79C3').should('be.visible')
        })
    })
  })
})
