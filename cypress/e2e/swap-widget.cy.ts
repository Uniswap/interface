import { FeatureFlag } from '../../src/featureFlags/flags/featureFlags'
import { getClassContainsSelector, getTestSelector } from '../utils'

const UNI_GOERLI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const WETH_GOERLI = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'

describe('swap widget integration tests', () => {
  const verifyInputToken = (inputText: string) => {
    cy.get(getClassContainsSelector('TokenButtonRow')).first().contains(inputText)
  }

  const verifyOutputToken = (outputText: string) => {
    cy.get(getClassContainsSelector('TokenButtonRow')).last().contains(outputText)
  }

  const selectOutputAndSwitch = (outputText: string) => {
    // open token selector...
    cy.contains('Select token').click()
    // select token...
    cy.contains(outputText).click({ force: true })

    cy.get('body')
      .then(($body) => {
        if ($body.find(getTestSelector('TokenSafetyWrapper')).length) {
          return 'I understand'
        }

        return 'You pay' // Just click on a random element as a no-op
      })
      .then((selector) => {
        cy.contains(selector).click()
      })

    // token selector should close...
    cy.contains('Search name or paste address').should('not.exist')

    cy.get(getClassContainsSelector('ReverseButton')).first().click()
  }

  describe('widget on swap page', () => {
    beforeEach(() => {
      cy.viewport(1200, 800)
    })

    it('should have the correct default input/output and token selection should work', () => {
      cy.visit('/swap', { featureFlags: [FeatureFlag.swapWidget] }).then(() => {
        cy.wait('@eth_blockNumber')
        verifyInputToken('ETH')
        verifyOutputToken('Select token')

        selectOutputAndSwitch('WETH')

        verifyInputToken('WETH')
        verifyOutputToken('ETH')
      })
    })

    it('should have the correct default input from URL params ', () => {
      cy.visit(`/swap?inputCurrency=${WETH_GOERLI}`, {
        featureFlags: [FeatureFlag.swapWidget],
      }).then(() => {
        cy.wait('@eth_blockNumber')
      })

      verifyInputToken('WETH')
      verifyOutputToken('Select token')

      selectOutputAndSwitch('Ether')

      verifyInputToken('ETH')
      verifyOutputToken('WETH')
    })

    it('should have the correct default output from URL params ', () => {
      cy.visit(`/swap?outputCurrency=${WETH_GOERLI}`, {
        featureFlags: [FeatureFlag.swapWidget],
      }).then(() => {
        cy.wait('@eth_blockNumber')
      })

      verifyInputToken('Select token')
      verifyOutputToken('WETH')

      cy.get(getClassContainsSelector('ReverseButton')).first().click()
      verifyInputToken('WETH')
      verifyOutputToken('Select token')

      selectOutputAndSwitch('Ether')

      verifyInputToken('ETH')
      verifyOutputToken('WETH')
    })
  })

  describe('widget on Token Detail Page', () => {
    beforeEach(() => {
      cy.viewport(1200, 800)
      cy.visit(`/tokens/ethereum/${UNI_GOERLI}`, { featureFlags: [FeatureFlag.swapWidget] }).then(() => {
        cy.wait('@eth_blockNumber')
      })
    })

    it('should have the expected output for a tokens detail page', () => {
      verifyOutputToken('UNI')
      cy.contains('Connect to Ethereum').should('exist')
    })
  })
})
