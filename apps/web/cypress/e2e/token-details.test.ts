import { UNI, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'
import { getTestSelector } from '../utils'

const UNI_MAINNET = UNI[UniverseChainId.Mainnet]

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

const INPUT_TOKEN_LABEL = `${TestID.ChooseInputToken}-label`
const OUTPUT_TOKEN_LABEL = `${TestID.ChooseOutputToken}-label`

describe('Token details', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
  })

  it('should have a single h1 tag on smaller screen size', () => {
    cy.viewport(800, 600)
    cy.visit(`/explore/tokens/ethereum/${UNI_ADDRESS}`)
    cy.get('h1').should('have.length', 1)
  })

  it('UNI token should have all information populated', () => {
    // $UNI token
    cy.visit(`/explore/tokens/ethereum/${UNI_ADDRESS}`)
    // There should be a single h1 tag on large screen sizes
    cy.get('h1').should('have.length', 1)

    // Price chart should be filled in
    cy.get('#chart-header').should('include.text', '$')
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
    cy.contains('UNI is the governance token for Uniswap').should('exist')
    cy.get(getTestSelector('token-details-info-links')).within(() => {
      cy.contains('Etherscan').should('have.attr', 'href').and('include', `etherscan.io/token/${UNI_ADDRESS}`)
      cy.contains('Website').should('have.attr', 'href').and('include', 'uniswap.org')
      cy.contains('Twitter').should('have.attr', 'href').and('include', 'x.com/Uniswap')
    })

    // Contract address should be displayed
    cy.contains(shortenAddress(UNI_ADDRESS)).should('exist')
  })

  describe('swapping', () => {
    beforeEach(() => {
      // On mobile widths, we just link back to /swap instead of rendering the swap component.
      cy.viewport(1200, 800)
      cy.visit(`/explore/tokens/ethereum/${UNI_MAINNET.address}`, {
        featureFlags: [
          {
            flag: FeatureFlags.UniversalSwap,
            value: true,
          },
        ],
      })
    })

    it('should have the expected output for a tokens detail page', () => {
      cy.get(getTestSelector(INPUT_TOKEN_LABEL)).should('contain.text', 'Select token')
      cy.get(getTestSelector(TestID.AmountInputOut)).should('not.have.value')
      cy.get(getTestSelector(OUTPUT_TOKEN_LABEL)).should('contain.text', 'UNI')
    })

    it('should automatically navigate to the new TDP (erc20)', () => {
      cy.get(getTestSelector(OUTPUT_TOKEN_LABEL)).click()
      cy.get(getTestSelector('token-option-1-USDT')).click()
      cy.url().should('include', `${USDT.address}`)
      cy.url().should('not.include', `${UNI_MAINNET.address}`)
    })

    it('should automatically navigate to the new TDP (native)', () => {
      cy.get(getTestSelector(OUTPUT_TOKEN_LABEL)).click()
      cy.get(getTestSelector(`token-option-${UniverseChainId.Optimism}-ETH`)).click()
      cy.url().should('include', 'optimism')
    })

    it('should not share swap state with the main swap page', () => {
      cy.get(getTestSelector(OUTPUT_TOKEN_LABEL)).should('contain.text', 'UNI')
      cy.get(getTestSelector(INPUT_TOKEN_LABEL)).click()
      cy.get(getTestSelector('token-option-1-USDT')).click()
      cy.visit('/swap')
      cy.contains('UNI').should('not.exist')
      cy.contains('USDT').should('not.exist')
    })

    describe('swap input', () => {
      beforeEach(() => {
        cy.get(getTestSelector(INPUT_TOKEN_LABEL)).scrollIntoView().click()
        cy.get(getTestSelector('token-option-1-USDT')).click()
      })
      it('can enter an amount into input', () => {
        cy.get(getTestSelector(TestID.AmountInputIn)).clear().type('0.001').should('have.value', '0.001')
      })

      it('zero swap amount', () => {
        cy.get(getTestSelector(TestID.AmountInputIn)).clear().type('0.0').should('have.value', '0.0')
      })

      it('invalid swap amount', () => {
        cy.get(getTestSelector(TestID.AmountInputIn)).clear().type('\\').should('have.value', '')
      })
    })

    describe('swap output', () => {
      it('can enter an amount into output', () => {
        cy.get(getTestSelector(TestID.AmountInputOut)).clear().type('0.001').should('have.value', '0.001')
      })

      it('zero output amount', () => {
        cy.get(getTestSelector(TestID.AmountInputOut)).clear().type('0.0').should('have.value', '0.0')
      })
    })
  })
})
