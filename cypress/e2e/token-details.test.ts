import { ChainId, WETH9 } from '@uniswap/sdk-core'
import { FeatureFlag } from 'featureFlags'

import { ARB, UNI } from '../../src/constants/tokens'
import { getTestSelector } from '../utils'

const UNI_MAINNET = UNI[ChainId.MAINNET]

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

describe('Token details', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
  })

  it('Uniswap token should have all information populated', () => {
    // Uniswap token
    cy.visit(`/tokens/ethereum/${UNI_ADDRESS}`, {
      featureFlags: [{ name: FeatureFlag.infoTDP, value: false }],
    })
    // Price chart should be filled in
    cy.get('[data-cy="chart-header"]').should('include.text', '$')
    cy.get('[data-cy="price-chart"]').should('exist')

    // Stats should have: TVL, 24H Volume, 52W low, 52W high
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-stats')).within(() => {
      cy.get('[data-cy="tvl"]').should('include.text', '$')
      cy.get('[data-cy="volume-24h"]').should('include.text', '$')
      cy.get('[data-cy="52w-low"]').should('include.text', '$')
      cy.get('[data-cy="52w-high"]').should('include.text', '$')
    })

    // About section should have description of token
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.contains('UNI is the governance token for Uniswap').should('exist')

    // Links section should link out to Etherscan, More analytics, Website, Twitter
    cy.get('[data-cy="resources-container"]').within(() => {
      cy.contains('Etherscan').should('have.attr', 'href').and('include', `etherscan.io/address/${UNI_ADDRESS}`)
      cy.contains('More analytics')
        .should('have.attr', 'href')
        .and('include', `info.uniswap.org/#/tokens/${UNI_ADDRESS}`)
      cy.contains('Website').should('have.attr', 'href').and('include', 'uniswap.org')
      cy.contains('Twitter').should('have.attr', 'href').and('include', 'twitter.com/Uniswap')
    })

    // Contract address should be displayed
    cy.contains(UNI_ADDRESS).should('exist')
  })

  it('Uniswap token should have correct stats boxes if infoTDP flag on', () => {
    // Uniswap token
    cy.visit(`/tokens/ethereum/${UNI_ADDRESS}`, {
      featureFlags: [{ name: FeatureFlag.infoTDP, value: true }],
    })

    // Stats should have: TVL, FDV, market cap, 24H volume
    cy.get(getTestSelector('token-details-stats')).should('exist')
    cy.get(getTestSelector('token-details-stats')).within(() => {
      cy.get('[data-cy="tvl"]').should('include.text', '$')
      cy.get('[data-cy="fdv"]').should('include.text', '$')
      cy.get('[data-cy="market-cap"]').should('include.text', '$')
      cy.get('[data-cy="volume-24h"]').should('include.text', '$')
    })
  })

  it('token with warning and low trading volume should have all information populated', () => {
    // Null token created for this test, 0 trading volume and has warning modal
    cy.visit('/tokens/ethereum/0x1eFBB78C8b917f67986BcE54cE575069c0143681')

    // Should have missing price chart when price unavailable (expected for this token)
    if (cy.get('[data-cy="chart-header"]').contains('Price unavailable')) {
      cy.get('[data-cy="missing-chart"]').should('exist')
    }

    // Stats should not exist
    cy.get(getTestSelector('token-details-stats')).should('not.exist')

    // About section should have description of token
    cy.get(getTestSelector('token-details-about-section')).should('exist')
    cy.contains('No token information available').should('exist')

    // Links section should link out to Etherscan, More analytics
    cy.get('[data-cy="resources-container"]').within(() => {
      cy.contains('Etherscan')
        .should('have.attr', 'href')
        .and('include', 'etherscan.io/address/0x1eFBB78C8b917f67986BcE54cE575069c0143681')
      cy.contains('More analytics')
        .should('have.attr', 'href')
        .and('include', 'info.uniswap.org/#/tokens/0x1eFBB78C8b917f67986BcE54cE575069c0143681')
    })

    // Contract address should be displayed
    cy.contains('0x1eFBB78C8b917f67986BcE54cE575069c0143681').should('exist')

    // Warning label should show if relevant ([spec](https://www.notion.so/3f7fce6f93694be08a94a6984d50298e))
    cy.get('[data-cy="token-safety-message"]')
      .should('include.text', 'Warning')
      .and('include.text', "This token isn't traded on leading U.S. centralized exchanges")
  })

  describe('swapping', () => {
    beforeEach(() => {
      // On mobile widths, we just link back to /swap instead of rendering the swap component.
      cy.viewport(1200, 800)
      cy.visit(`/tokens/ethereum/${UNI_MAINNET.address}`).then(() => {
        cy.wait('@eth_blockNumber')
        cy.scrollTo('top')
      })
    })

    it('should have the expected output for a tokens detail page', () => {
      cy.get(`#swap-currency-input .token-amount-input`).should('have.value', '')
      cy.get(`#swap-currency-input .token-symbol-container`).should('contain.text', 'Select token')
      cy.get(`#swap-currency-output .token-amount-input`).should('not.have.value')
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'UNI')
    })

    it('should automatically navigate to the new TDP', () => {
      cy.get(`#swap-currency-output .open-currency-select-button`).click()
      cy.get('[data-reach-dialog-content]').contains('WETH').click()
      cy.url().should('include', `${WETH9[1].address}`)
      cy.url().should('not.include', `${UNI_MAINNET.address}`)
    })

    it('should not share swap state with the main swap page', () => {
      cy.get(`#swap-currency-output .token-symbol-container`).should('contain.text', 'UNI')
      cy.get(`#swap-currency-input .open-currency-select-button`).click()
      cy.contains('WETH').click()
      cy.visit('/swap')
      cy.contains('UNI').should('not.exist')
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
      cy.visit('/tokens')
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
