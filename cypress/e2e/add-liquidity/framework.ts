import { Token } from '@uniswap/sdk-core'
import { ethers } from 'ethers'

import { getTestSelector } from '../../utils'
import { NONFUNGIBLE_POSITION_MANAGER_ABI, NONFUNGIBLE_POSITION_MANAGER_CONTRACT_ADDRESS } from './constants'

export function selectsPair(token0: Token, token1: Token) {
  cy.get('.open-currency-select-button').eq(0).click()
  cy.get('#token-search-input').type(token0.symbol || '')
  cy.get('[class*="token-item-"]').eq(0).should('contain', token0.symbol).click()
  cy.get('.open-currency-select-button').eq(1).click()
  cy.get('#token-search-input').type(token1.symbol || '')
  cy.get('[class*="token-item-"]').eq(0).should('contain', token1.symbol).click()
}

export function depositsToken(isToken0: boolean, amount: number) {
  cy.get(`#add-liquidity-input-token${isToken0 ? 'a' : 'b'} .token-amount-input`)
    .type(amount.toString())
    .should('have.value', amount.toString())
}

export function approvesToken(token: Token) {
  cy.contains('Approve ' + token.symbol)
    .should('be.enabled')
    .click()
  cy.contains('Approving')
  cy.hardhat().then(({ approval, wallet }) => {
    Promise.all([
      approval.setTokenAllowanceForPermit2({ owner: wallet, token }),
      approval.setPermit2Allowance({ owner: wallet, token }),
    ])
  })
  cy.contains('Approving').should('not.exist')
  cy.get(getTestSelector('popups')).contains('Approved')
  cy.get(getTestSelector('popups')).contains('UNI')
  // // Make sure approval is mined before proceeding
  // cy.hardhat().then((hardhat) => hardhat.mine())
}

export function clicksPreview() {
  cy.contains('Preview').should('be.visible').should('be.enabled').click({ force: true })
}

export function clicksAdd() {
  cy.contains('button', 'Add').click()
  cy.get(getTestSelector('web3-status-connected')).should('contain', '1 Pending')
}

export function closesModal() {
  cy.contains('Close').click()
}
