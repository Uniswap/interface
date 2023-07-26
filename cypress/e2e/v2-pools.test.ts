import { switchChain } from '../utils'

describe('v2 supported network checks', () => {
  beforeEach(() => {
    cy.visit('/pool/v2', { ethereum: 'hardhat' })
  })

  it('should be supported on eth mainnet', () => {
    cy.contains('Add V2 Liquidity').click()
    cy.contains('Select a token')
  })

  it('should be unsupported on arbitrum', () => {
    switchChain('Arbitrum')
    cy.contains('Add V2 Liquidity').should('not.exist')
  })
})
