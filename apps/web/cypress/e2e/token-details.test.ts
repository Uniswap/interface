import { ChainId, WETH9 } from '@ubeswap/sdk-core'
import { shortenAddress } from 'utilities/src/addresses'
import { ARB, UBE } from '../../src/constants/tokens'
import { getTestSelector } from '../utils'

const UBE_CELO = UBE[ChainId.CELO]

const UBE_ADDRESS = '0x71e26d0E519D14591b9dE9a0fE9513A398101490'

describe('Token details', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
  })

  it('should have a single h1 tag on smaller screen size', () => {
    cy.viewport(800, 600)
    cy.visit(`/explore/tokens/celo/${UBE_ADDRESS}`)
    cy.get('h1').should('have.length', 1)
  })

  it('UBE token should have all information populated', () => {
    // $UBE token
    cy.visit(`/explore/tokens/celo/${UBE_ADDRESS}`)
    // There should be a single h1 tag on large screen sizes
    cy.get('h1').should('have.length', 1)

    // Price chart should be filled in
    cy.get('[data-cy="chart-header"]').should('include.text', '$')
    cy.get('[data-cy="tdp-Price-chart-container"]').should('exist')

    // Stats should have: TVL, FDV, market cap, 24H volume
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-stats')).within(() => {
      cy.get('[data-cy="tvl"]').should('include.text', '$')
      cy.get('[data-cy="fdv"]').should('include.text', '$')
      cy.get('[data-cy="market-cap"]').should('include.text', '$')
      cy.get('[data-cy="volume-24h"]').should('include.text', '$')
    })

    // Info section should have description of token & relevant links
    cy.get(getTestSelector('token-details-info-section')).should('exist')
    cy.contains('UBE is the governance token for Ubeswap').should('exist')
    cy.get(getTestSelector('token-details-info-links')).within(() => {
      cy.contains('Celoscan').should('have.attr', 'href').and('include', `celoscan.io/token/${UBE_ADDRESS}`)
      cy.contains('Website').should('have.attr', 'href').and('include', 'ubeswap.org')
      cy.contains('Twitter').should('have.attr', 'href').and('include', 'x.com/Ubeswap')
    })

    // Contract address should be displayed
    cy.contains(shortenAddress(UBE_ADDRESS)).should('exist')
  })

  it('token with warning and low trading volume should have all information populated', () => {
    // Null token created for this test, 0 trading volume and has warning modal
    cy.visit('/explore/tokens/celo/0x71e26d0E519D14591b9dE9a0fE9513A398101490')

    // Should have missing price view when price unavailable (expected for this token)
    cy.get('[data-cy="chart-error-view"]').should('exist')

    // Stats should not exist
    cy.get('[data-cy="token-details-no-stats-data"]').should('exist')

    // Info section should have description of token
    cy.get(getTestSelector('token-details-info-section')).should('exist')
    cy.contains('No token information available').should('exist')

    // Links section should link out to Celoscan
    cy.get(getTestSelector('token-details-info-links')).within(() => {
      cy.contains('Celoscan')
        .should('have.attr', 'href')
        .and('include', 'celoscan.io/token/0x71e26d0E519D14591b9dE9a0fE9513A398101490')
    })

    // Contract address should be displayed
    cy.contains(shortenAddress('0x71e26d0E519D14591b9dE9a0fE9513A398101490')).should('exist')

    // Warning label should show if relevant ([spec](https://www.notion.so/3f7fce6f93694be08a94a6984d50298e))
    cy.get('[data-cy="token-safety-message"]')
      .should('include.text', 'Warning')
      .and('include.text', "This token isn't traded on leading U.S. centralized exchanges")
  })

  describe('swapping', () => {
    beforeEach(() => {
      // On mobile widths, we just link back to /swap instead of rendering the swap component.
      cy.viewport(1200, 800)
      cy.visit(`/explore/tokens/celo/${UBE_CELO.address}`).then(() => {
        cy.wait('@eth_blockNumber')
        cy.scrollTo('top')
      })
    })

    it('should have the expected output for a tokens detail page', () => {
      cy.get(`#swap-currency-input .token-amount-input`).should('have.value', '')
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'Select token')
      cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'UBE')
    })

    it('should automatically navigate to the new TDP', () => {
      cy.get(`#swap-currency-output .open-currency-select-button`).click()
      cy.get('[data-reach-dialog-content]').contains('WETH').click()
      cy.url().should('include', `${WETH9[1].address}`)
      cy.url().should('not.include', `${UBE_CELO.address}`)
    })

    it('should not share swap state with the main swap page', () => {
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'UBE')
      cy.get(`#swap-currency-input .open-currency-select-button`).click()
      cy.contains('WETH').click()
      cy.visit('/swap')
      cy.contains('UBE').should('not.exist')
      cy.contains('WETH').should('not.exist')
    })

    it('can enter an amount into input', () => {
      cy.get('#swap-currency-input .token-amount-input').clear().type('0.001').should('have.value', '0.001')
    })

    it('zero swap amount', () => {
      cy.get('#swap-currency-input .token-amount-input').clear().type('0.0').should('have.value', '0.0')
    })

    it('invalid swap amount', () => {
      cy.get('#swap-currency-input .token-amount-input').clear().type('\\').should('have.value', '')
    })

    it('can enter an amount into output', () => {
      cy.get('#swap-currency-output .token-amount-input').clear().type('0.001').should('have.value', '0.001')
    })

    it('zero output amount', () => {
      cy.get('#swap-currency-output .token-amount-input').clear().type('0.0').should('have.value', '0.0')
    })

    it('should show a L2 token even if the user is connected to a different network', () => {
      cy.visit('/explore/tokens')
      cy.get(getTestSelector('tokens-network-filter-selected')).click()
      cy.get(getTestSelector('tokens-network-filter-option-arbitrum')).click()
      cy.get(getTestSelector('tokens-network-filter-selected')).should('contain', 'Arbitrum')
      cy.get(getTestSelector(`token-table-row-${ARB.address.toLowerCase()}`)).click()
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'ARB')
      cy.get(getTestSelector('open-settings-dialog-button')).should('be.disabled')
      cy.contains('Connect to Arbitrum').should('exist')
    })
  })
})
