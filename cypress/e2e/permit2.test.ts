import { MaxUint160, MaxUint256 } from '@uniswap/permit2-sdk'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { Utils } from 'cypress-hardhat/lib/browser/utils'
import { BigNumber } from 'ethers/lib/ethers'

import { DAI, USDC_MAINNET } from '../../src/constants/tokens'

const THIRTY_DAYS_MS = 2592000000

// Shorthand util for approving DAI, permit2 spend, or both
const approve = async (hardhat: Utils, type: 'token' | 'permit2' | 'both'): Promise<void> => {
  const promises: Array<Promise<void>> = []

  if (type === 'token' || type === 'both') {
    promises.push(hardhat.approval.setTokenAllowanceForPermit2({ owner: hardhat.wallet.address, token: DAI }))
  }
  if (type === 'permit2' || type === 'both') {
    promises.push(
      hardhat.approval.setPermit2Allowance(
        {
          owner: hardhat.wallet.address,
          token: DAI,
          spender: UNIVERSAL_ROUTER_ADDRESS(1),
        },
        {
          amount: MaxUint160,
          expiration: Math.floor((Date.now() + THIRTY_DAYS_MS) / 1000),
        }
      )
    )
  }
  await Promise.all(promises)
}

// Shorthand util for asserting DAI approval on-chain
const expectTokenMaxApproval = (hardhat: Utils) => {
  // check token approval
  cy.then(() =>
    hardhat.approval.getTokenAllowanceForPermit2({
      owner: hardhat.wallet.address,
      token: DAI,
    })
  ).should('deep.equal', MaxUint256)
}

// Shorthand util for asserting permit2 approval for DAI spend on-chain
const expectPermit2MaxApproval = (hardhat: Utils, approvalTime: number) => {
  cy.then(() =>
    hardhat.approval.getPermit2Allowance({
      owner: hardhat.wallet.address,
      token: DAI,
      spender: UNIVERSAL_ROUTER_ADDRESS(1),
    })
  ).then((allowance) => {
    cy.then(() => MaxUint160.eq(allowance.amount)).should('eq', true)
    const expected = Math.floor((approvalTime + THIRTY_DAYS_MS) / 1000)

    // Asserts that the on-chain expiration is in 30 days, with a tolerance of 20 seconds
    cy.then(() => Math.abs(allowance.expiration - expected)).should('be.lessThan', 20)
  })
}

// Shorthand util setting up a DAI for USDC swap
const setSwapInputs = () => {
  cy.visit(`/swap/?inputCurrency=${DAI.address}&outputCurrency=${USDC_MAINNET.address}`, { ethereum: 'hardhat' })
  cy.get('#swap-currency-input .token-amount-input').clear().type(TEST_BALANCE_INCREMENT.toString())
}

// Shorthand util for initiating a swap and confirming it
const swap = () => {
  cy.get('#swap-button').should('not.have.attr', 'disabled')
  cy.get('#swap-button').click()
  cy.get('#confirm-swap-or-send').click()
  cy.get('[data-testid="dismiss-tx-confirmation"]').click()

  // There should be a successful Swap notification
  cy.contains('Swapped').should('exist')
}

const TEST_BALANCE_INCREMENT = 0.01

// TODO: Update tests to differentiate between permit2 vs token approval buttons once UI is updated to indicate approval step
describe('Permit2', () => {
  beforeEach(() => {
    cy.hardhat().then((hardhat) => hardhat.reset()) // TODO(cartcrom): remove once cypress-hardhat is updated
    cy.hardhat().then((hardhat) => hardhat.provider.send('evm_setAutomine', [true])) // TODO(cartcrom): remove once cypress-hardhat is updated

    setSwapInputs()
  })

  after(() => {
    // Returns automine to original state
    cy.hardhat().then((hardhat) => hardhat.reset()) // TODO(cartcrom): remove once cypress-hardhat is updated
  })

  it('does not prompt approval when user has already approved token and permit2', () => {
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'both')).then(() => {
        swap()
      })
    })
  })

  it('can swap DAI for USDC with approval', () => {
    cy.hardhat().then((hardhat) => {
      cy.get('[data-testid="swap-approve-button"]').click()
      const approvalTime = Date.now()
      cy.get('[data-testid="swap-approve-button"]').should('have.text', 'Approval pending')

      cy.contains('Approved').should('exist')

      swap()

      // chain state check
      expectTokenMaxApproval(hardhat)
      expectPermit2MaxApproval(hardhat, approvalTime)
    })
  })

  it('can swap DAI for USDC with an existing token approval and missing permit approval', () => {
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'token')).then(() => {
        const approvalTime = Date.now()
        cy.get('[data-testid="swap-approve-button"]').click()

        swap()

        // chain state check
        expectPermit2MaxApproval(hardhat, approvalTime)
      })
    })
  })

  it('can swap DAI for USDC with existing permit approval and missing token approval', () => {
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'permit2')).then(() => {
        cy.get('[data-testid="swap-approve-button"]').click()
        cy.get('[data-testid="swap-approve-button"]').should('have.text', 'Approval pending')

        swap()

        // chain state check
        expectTokenMaxApproval(hardhat)
      })
    })
  })

  it('prompts signature when existing permit approval is expired', () => {
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'token'))
        .then(() =>
          hardhat.approval.setPermit2Allowance(
            {
              owner: hardhat.wallet.address,
              token: DAI,
            },
            { amount: MaxUint160, expiration: Math.floor((Date.now() - 1) / 1000) }
          )
        )
        .then(() => {
          const approvalTime = Date.now()
          cy.get('[data-testid="swap-approve-button"]').click()

          swap()

          // chain state check
          expectPermit2MaxApproval(hardhat, approvalTime)
        })
    })
  })

  it('prompts signature when existing permit approval amount is too low', () => {
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'token'))
        .then(() =>
          hardhat.approval.setPermit2Allowance(
            {
              owner: hardhat.wallet.address,
              token: DAI,
            },
            { amount: 1, expiration: Math.floor((Date.now() + THIRTY_DAYS_MS) / 1000) }
          )
        )
        .then(() => {
          const approvalTime = Date.now()
          cy.get('[data-testid="swap-approve-button"]').click()

          swap()

          // chain state check
          expectPermit2MaxApproval(hardhat, approvalTime)
        })
    })
  })

  it('prompts token approval when existing approval amount is too low', () => {
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'permit2'))
        .then(() =>
          hardhat.approval.setTokenAllowanceForPermit2(
            {
              owner: hardhat.wallet.address,
              token: DAI,
            },
            BigNumber.from(1)
          )
        )
        .then(() => {
          cy.get('[data-testid="swap-approve-button"]').click()

          swap()

          // chain state check
          expectTokenMaxApproval(hardhat)
        })
    })
  })
})
