import { MaxUint160, MaxUint256 } from '@uniswap/permit2-sdk'
import { Currency, Token } from '@uniswap/sdk-core'

export const getTestSelector = (selectorId: string) => `[data-testid=${selectorId}]`

export const getTestSelectorStartsWith = (selectorId: string) => `[data-testid^=${selectorId}]`

/** Gets the balance of a token as a Chainable. */
export function getBalance(token: Currency) {
  return cy
    .hardhat()
    .then((hardhat) => hardhat.getBalance(hardhat.wallet, token))
    .then((balance) => Number(balance.toFixed(1)))
}

/** Asserts permit2 has a max approval for spend of the input token on-chain. */
export function expectTokenAllowanceForPermit2ToBeMax(inputToken: Token) {
  // check token approval
  cy.hardhat()
    .then(({ approval, wallet }) => approval.getTokenAllowanceForPermit2({ owner: wallet, token: inputToken }))
    .then((allowance) => {
      Cypress.log({ name: `Token allowance: ${allowance.toString()}` })
      cy.wrap(allowance).should('deep.equal', MaxUint256)
    })
}

/** Asserts the universal router has a max permit2 approval for spend of the input token on-chain. */
export function expectPermit2AllowanceForUniversalRouterToBeMax(inputToken: Token) {
  cy.hardhat()
    .then(({ approval, wallet }) => approval.getPermit2Allowance({ owner: wallet, token: inputToken }))
    .then((allowance) => {
      Cypress.log({ name: `Permit2 allowance: ${allowance.amount.toString()}` })
      cy.wrap(allowance.amount).should('deep.equal', MaxUint160)
      // Asserts that the on-chain expiration is in 30 days, within a tolerance of 40 seconds.
      const THIRTY_DAYS_SECONDS = 2_592_000
      const expected = Math.floor(Date.now() / 1000 + THIRTY_DAYS_SECONDS)
      cy.wrap(allowance.expiration).should('be.closeTo', expected, 40)
    })
}
