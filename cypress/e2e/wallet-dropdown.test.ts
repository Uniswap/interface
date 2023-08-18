import { FeatureFlag } from 'featureFlags'

import { getTestSelector } from '../utils'

describe('Wallet Dropdown', () => {
  function itChangesTheme() {
    it('should change theme', () => {
      cy.get(getTestSelector('theme-lightmode')).click()

      cy.get(getTestSelector('theme-lightmode')).should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
      cy.get(getTestSelector('theme-darkmode')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
      cy.get(getTestSelector('theme-auto')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')

      cy.get(getTestSelector('theme-darkmode')).click()
      cy.get(getTestSelector('theme-lightmode')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
      cy.get(getTestSelector('theme-darkmode')).should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
      cy.get(getTestSelector('theme-auto')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')

      cy.get(getTestSelector('theme-auto')).click()
      cy.get(getTestSelector('theme-lightmode')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
      cy.get(getTestSelector('theme-darkmode')).should('have.css', 'background-color', 'rgba(0, 0, 0, 0)')
      cy.get(getTestSelector('theme-auto')).should('not.have.css', 'background-color', 'rgba(0, 0, 0, 0)')
    })
  }

  function itChangesLocale({ featureFlag = false }: { featureFlag?: boolean } = {}) {
    it('should change locale', () => {
      cy.contains('Uniswap available in: English').should('not.exist')

      if (featureFlag) {
        cy.get(getTestSelector('language-settings-button')).click()
      }

      cy.get(getTestSelector('wallet-language-item')).contains('Afrikaans').click({ force: true })
      cy.location('hash').should('match', /\?lng=af-ZA$/)
      cy.contains('Uniswap available in: English')

      cy.get(getTestSelector('wallet-language-item')).contains('English').click({ force: true })
      cy.location('hash').should('match', /\?lng=en-US$/)
      cy.contains('Uniswap available in: English').should('not.exist')
    })
  }

  describe('connected', () => {
    beforeEach(() => {
      cy.visit('/')
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.get(getTestSelector('wallet-settings')).click()
    })
    itChangesTheme()
    itChangesLocale()
  })

  describe('should change locale with feature flag', () => {
    beforeEach(() => {
      cy.visit('/', { featureFlags: [FeatureFlag.currencyConversion] })
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.get(getTestSelector('wallet-settings')).click()
    })
    itChangesLocale({ featureFlag: true })
  })

  describe('testnet toggle', () => {
    beforeEach(() => {
      cy.visit('/swap')
    })
    it('should toggle testnet visibility', () => {
      cy.get(getTestSelector('chain-selector')).last().click()
      cy.get(getTestSelector('chain-selector-options')).should('not.contain.text', 'Sepolia')

      cy.get(getTestSelector('web3-status-connected')).click()
      cy.get(getTestSelector('wallet-settings')).click()
      cy.get('#testnets-toggle').click()
      cy.get(getTestSelector('close-account-drawer')).click()
      cy.get(getTestSelector('chain-selector')).last().click()
      cy.get(getTestSelector('chain-selector-options')).should('contain.text', 'Sepolia')
    })
  })

  describe('disconnected', () => {
    beforeEach(() => {
      cy.visit('/')
      cy.get(getTestSelector('web3-status-connected')).click()
      // click twice, first time to show confirmation, second to confirm
      cy.get(getTestSelector('wallet-disconnect')).click()
      cy.get(getTestSelector('wallet-disconnect')).should('contain', 'Disconnect')
      cy.get(getTestSelector('wallet-disconnect')).click()
      cy.get(getTestSelector('wallet-settings')).click()
    })
    itChangesTheme()
    itChangesLocale()
  })

  describe('with color theme', () => {
    function visitSwapWithColorTheme({ dark }: { dark: boolean }) {
      cy.visit('/swap', {
        onBeforeLoad(win) {
          cy.stub(win, 'matchMedia')
            .withArgs('(prefers-color-scheme: dark)')
            .returns({
              matches: dark,
              addEventListener() {
                /* noop */
              },
              removeEventListener() {
                /* noop */
              },
            })
        },
      })
    }

    it('should properly use dark system theme when auto theme setting is selected', () => {
      visitSwapWithColorTheme({ dark: true })
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.get(getTestSelector('wallet-settings')).click()
      cy.get(getTestSelector('theme-auto')).click()
      cy.get(getTestSelector('wallet-header')).should('have.css', 'color', 'rgb(152, 161, 192)')
    })

    it('should properly use light system theme when auto theme setting is selected', () => {
      visitSwapWithColorTheme({ dark: false })
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.get(getTestSelector('wallet-settings')).click()
      cy.get(getTestSelector('theme-auto')).click()
      cy.get(getTestSelector('wallet-header')).should('have.css', 'color', 'rgb(119, 128, 160)')
    })
  })

  describe('mobile', () => {
    beforeEach(() => {
      cy.viewport('iphone-6').visit('/')
    })

    it('should dismiss the wallet bottom sheet when clicking buy crypto', () => {
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.get(getTestSelector('wallet-buy-crypto')).click()
      cy.contains('Buy crypto').should('not.be.visible')
    })

    it('should use a bottom sheet and dismiss when on a mobile screen size', () => {
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.root().click(15, 40)
      cy.get(getTestSelector('wallet-settings')).should('not.be.visible')
    })
  })
})
