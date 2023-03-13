import { FeatureFlag } from '../../src/featureFlags/flags/featureFlags'

const UNI_GOERLI = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

describe('swap widget integration tests', () => {
  const verifyInputToken = (inputText: string) => {
    cy.get('*[class*="TokenButtonRow"]').first().contains(inputText)
  }

  const verifyOutputToken = (outputText: string) => {
    cy.get('*[class*="TokenButtonRow"]').last().contains(outputText)
  }

  const selectOutputAndSwitch = (outputText = 'UNI') => {
    // open token selector...
    cy.contains('Select token').click()
    // select token...
    cy.contains(outputText).click()

    // dismiss warning if it appears...
    cy.get('body').click(400, 400)

    // token selector should close...
    cy.contains('Search name or paste address').should('not.exist')

    cy.get('*[class*="ReverseButton"]').first().click()
  }

  describe('widget on swap page', () => {
    it('should have the correct default input/output and token selection should work', () => {
      cy.visit('/swap', { featureFlags: [FeatureFlag.swapWidget] })

      verifyInputToken('ETH')
      verifyOutputToken('Select token')

      selectOutputAndSwitch('UNI')

      verifyInputToken('UNI')
      verifyOutputToken('ETH')
    })

    it('should have the correct default input from URL params ', () => {
      cy.visit(`/swap?inputCurrency=${UNI_GOERLI}`, {
        featureFlags: [FeatureFlag.swapWidget],
      })

      verifyInputToken('UNI')
      verifyOutputToken('Select token')

      selectOutputAndSwitch('WETH')

      verifyInputToken('WETH')
      verifyOutputToken('UNI')
    })

    it('should have the correct default output from URL params ', () => {
      cy.visit(`/swap?outputCurrency=${UNI_GOERLI}`, {
        featureFlags: [FeatureFlag.swapWidget],
      })

      verifyInputToken('Select token')
      verifyOutputToken('UNI')

      cy.get('*[class*="ReverseButton"]').first().click()
      verifyInputToken('UNI')
      verifyOutputToken('Select token')

      selectOutputAndSwitch('WETH')

      verifyInputToken('WETH')
      verifyOutputToken('UNI')
    })
  })

  describe('widget on Token Detail Page', () => {
    beforeEach(() => {
      cy.viewport(1200, 800)
    })

    it('should have the expected output for a tokens detail page', () => {
      cy.visit(`/tokens/ethereum/${UNI_GOERLI}`, { featureFlags: [FeatureFlag.swapWidget] })
      verifyOutputToken('UNI')
      cy.contains('Connect to Ethereum').should('exist')
    })
  })
})
