import { USDT_ARBITRUM_ONE } from 'uniswap/src/constants/tokens'
import { getTestSelector, getTestSelectorStartsWith } from '../utils'

describe('Token explore', () => {
  before(() => {
    cy.visit('/')
  })

  it('should load token leaderboard', () => {
    cy.visit('/explore/tokens/ethereum')
    cy.get(getTestSelectorStartsWith('token-table')).its('length').should('be.greaterThan', 0)

    cy.get(getTestSelector('token-table-row-NATIVE'))
      .find(getTestSelector('token-name'))
      .should('include.text', 'Ether')
    cy.get(getTestSelector('token-table-row-NATIVE')).find(getTestSelector('volume-cell')).should('include.text', '$')
    cy.get(getTestSelector('token-table-row-NATIVE')).find(getTestSelector('price-cell')).should('include.text', '$')
    cy.get(getTestSelector('token-table-row-NATIVE')).find(getTestSelector('fdv-cell')).should('include.text', '$')

    // TODO(WEB-3844): test the default sorting by checking the column headers
  })

  it('should update when time window toggled', () => {
    cy.visit('/explore/tokens/ethereum')
    cy.get(getTestSelector('time-selector')).should('contain', '1D')
    cy.get(getTestSelector('token-table-row-NATIVE'))
      .find(getTestSelector('volume-cell'))
      .then(function ($elem) {
        cy.wrap($elem.text()).as('dailyEthVol')
      })
    cy.get(getTestSelector('time-selector')).click()
    cy.get(getTestSelector('1Y')).first().click()
    cy.get(getTestSelector('token-table-row-NATIVE'))
      .find(getTestSelector('volume-cell'))
      .then(function ($elem) {
        cy.wrap($elem.text()).as('yearlyEthVol')
      })
    cy.get('@dailyEthVol').should('not.equal', cy.get('@yearlyEthVol'))
  })

  it('should navigate to token detail page when row clicked', () => {
    cy.visit('/explore/tokens/ethereum')
    cy.get(getTestSelector('token-table-row-NATIVE')).click({ force: true })
    cy.url().should('match', /\/explore\/tokens\/ethereum\/NATIVE/)
  })

  it('should update when global network changed', () => {
    cy.visit('/explore/tokens/ethereum')
    cy.get(getTestSelector('tokens-network-filter-selected')).invoke('attr', 'alt').should('eq', `Ethereum logo`)
    cy.get(getTestSelector('token-table-row-NATIVE')).should('exist')

    // note: cannot switch global chain via UI because we cannot approve the network switch
    // in metamask modal using plain cypress. this is a workaround.
    cy.visit('/explore/tokens/optimism')
    cy.get(getTestSelector('tokens-network-filter-selected')).invoke('attr', 'alt').should('eq', `Optimism logo`)
    cy.get(getTestSelector('token-table-row-NATIVE')).find(getTestSelector('name-cell')).should('include.text', 'Ethereum')
  })

  it('should update when token explore table network changed', () => {
    cy.visit('/explore/tokens/ethereum')
    cy.get(getTestSelector('tokens-network-filter-selected')).click()
    cy.get(getTestSelector('tokens-network-filter-option-optimism')).first().click()
    cy.get(getTestSelector('tokens-network-filter-selected')).invoke('attr', 'alt').should('eq', `Optimism logo`)
  })

  it('should show a L2 token even if the user is connected to a different network', () => {
    cy.viewport(1200, 800)
    cy.visit('/explore/tokens/ethereum')
    cy.get(getTestSelector('tokens-network-filter-selected')).click()
    cy.get(getTestSelector('tokens-network-filter-option-arbitrum')).first().click()
    cy.get(getTestSelector('tokens-network-filter-selected')).invoke('attr', 'alt').should('eq', `Arbitrum logo`)
    cy.get(getTestSelector(`token-table-row-${USDT_ARBITRUM_ONE.address}`)).click()
    cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'USDT')
  })

})
