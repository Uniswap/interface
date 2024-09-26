import { FeatureFlags } from "uniswap/src/features/gating/flags"
import { getTestSelector } from "../utils"

describe('Buy Crypto Form', () => {
  beforeEach(() => {
    cy.intercept('*/fiat-on-ramp/get-country', { fixture: 'fiatOnRamp/get-country.json' })
    cy.intercept('*/fiat-on-ramp/supported-fiat-currencies*', { fixture: 'fiatOnRamp/supported-fiat-currencies.json' })
    cy.intercept('*/fiat-on-ramp/supported-countries*', { fixture: 'fiatOnRamp/supported-countries.json' })
    cy.intercept('*/fiat-on-ramp/supported-tokens*', { fixture: 'fiatOnRamp/supported-tokens.json' })
    cy.intercept('*/fiat-on-ramp/quote*', { fixture: 'fiatOnRamp/quotes.json' })
    cy.visit('/buy', {featureFlags: [{flag: FeatureFlags.ForAggregator, value: true}]})
  })
  
  it('quick amount select', () => {
    cy.contains('$100').click()
    cy.contains('Continue').click()

    cy.get('#ChooseProviderModal').should('be.visible')
  })

  it('user input amount', () => {
    cy.get(getTestSelector('buy-form-amount-input')).type('123').should('have.value', '123')
    cy.contains('Continue').click()

    cy.get('#ChooseProviderModal').should('be.visible')
  })

  it('change input token', () => {
    cy.contains('ETH').click()
    cy.contains('DAI').click()
    cy.get(getTestSelector('buy-form-amount-input')).type('123').should('have.value', '123')
    cy.contains('Continue').click()
    cy.get('#ChooseProviderModal').should('be.visible')
  })

  it('change country', () => {
    cy.get(getTestSelector('FiatOnRampCountryPicker')).click()
    cy.contains('Argentina').click()
    cy.get(getTestSelector('buy-form-amount-input')).type('123').should('have.value', '123')
    cy.contains('Continue').click()
    cy.get('#ChooseProviderModal').should('be.visible')
  })
})
