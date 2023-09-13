import { ChainId } from '@uniswap/sdk-core'

import { UNI } from '../../src/constants/tokens'

const UNI_MAINNET = UNI[ChainId.MAINNET]

describe('Remove Liquidity', () => {
  it('loads the token pair', () => {
    // V2
    cy.visit(`/remove/v2/ETH/${UNI_MAINNET.address}`)
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'ETH')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'UNI')

    // V3
    cy.visit(`/remove/1`)
    cy.get('#remove-liquidity-tokena-symbol').should('contain.text', 'UNI')
    cy.get('#remove-liquidity-tokenb-symbol').should('contain.text', 'ETH')
  })
})
