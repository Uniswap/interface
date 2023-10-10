import { getTestSelector, getTestSelectorStartsWith } from '../utils'

describe('Token explore', () => {
  before(() => {
    cy.visit('/')
  })

  it('should load token leaderboard', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelectorStartsWith('token-table')).its('length').should('be.greaterThan', 0)
    // check sorted svg icon is present in volume cell, since tokens are sorted by volume by default
    cy.get(getTestSelector('header-row')).find(getTestSelector('volume-cell')).find('svg').should('exist')
    cy.get(getTestSelector('token-table-row-NATIVE')).find(getTestSelector('name-cell')).should('include.text', 'Ether')
    cy.get(getTestSelector('token-table-row-NATIVE')).find(getTestSelector('volume-cell')).should('include.text', '$')
    cy.get(getTestSelector('token-table-row-NATIVE')).find(getTestSelector('price-cell')).should('include.text', '$')
    cy.get(getTestSelector('token-table-row-NATIVE')).find(getTestSelector('tvl-cell')).should('include.text', '$')
    cy.get(getTestSelector('token-table-row-NATIVE'))
      .find(getTestSelector('percent-change-cell'))
      .should('include.text', '%')
    cy.get(getTestSelector('header-row')).find(getTestSelector('price-cell')).click()
    cy.get(getTestSelector('header-row')).find(getTestSelector('price-cell')).find('svg').should('exist')
  })

  it('should update when time window toggled', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelector('time-selector')).should('contain', '1D')
    cy.get(getTestSelector('token-table-row-NATIVE'))
      .find(getTestSelector('volume-cell'))
      .then(function ($elem) {
        cy.wrap($elem.text()).as('dailyEthVol')
      })
    cy.get(getTestSelector('time-selector')).click()
    cy.get(getTestSelector('1Y')).click()
    cy.get(getTestSelector('token-table-row-NATIVE'))
      .find(getTestSelector('volume-cell'))
      .then(function ($elem) {
        cy.wrap($elem.text()).as('yearlyEthVol')
      })
    cy.get('@dailyEthVol').should('not.equal', cy.get('@yearlyEthVol'))
  })

  it('should navigate to token detail page when row clicked', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelector('token-table-row-NATIVE')).click()
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-info-container')).should('exist')
    cy.get(getTestSelector('chart-container')).should('exist')
    cy.contains('Ethereum is a smart contract platform that enables developers to build tokens').should('exist')
    cy.contains('Etherscan').should('exist')
  })

  it('should update when global network changed', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelector('tokens-network-filter-selected')).should('contain', 'Ethereum')
    cy.get(getTestSelector('token-table-row-NATIVE')).should('exist')

    // note: cannot switch global chain via UI because we cannot approve the network switch
    // in metamask modal using plain cypress. this is a workaround.
    cy.visit('/tokens/polygon')
    cy.get(getTestSelector('tokens-network-filter-selected')).should('contain', 'Polygon')
    cy.get(getTestSelector('token-table-row-NATIVE'))
      .find(getTestSelector('name-cell'))
      .should('include.text', 'Polygon Matic')
  })

  it('should update when token explore table network changed', () => {
    cy.visit('/tokens/ethereum')
    cy.get(getTestSelector('tokens-network-filter-selected')).click()
    cy.get(getTestSelector('tokens-network-filter-option-optimism')).click()
    cy.get(getTestSelector('tokens-network-filter-selected')).should('contain', 'Optimism')
    cy.get(getTestSelector('chain-selector-logo')).find('title').should('include.text', 'Ethereum logo')
  })
})
