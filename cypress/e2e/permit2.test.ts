import { MaxUint160, MaxUint256 } from '@uniswap/permit2-sdk'

import { DAI, USDC_MAINNET } from '../../src/constants/tokens'
import { getTestSelector } from '../utils'

const APPROVE_BUTTON = '[data-testid="swap-approve-button"]'

/** Initiates a swap and confirms its success. */
function swaps() {
  // The swap-button can be temporarily disabled following approval, & Cypress will retry clicking the disabled version.
  // This ensures that we don't click until the button is enabled.
  cy.get('#swap-button').should('not.have.attr', 'disabled')

  // Completes the swap.
  cy.get('#swap-button').click()
  cy.get('#confirm-swap-or-send').click()
  cy.get(getTestSelector('dismiss-tx-confirmation')).click()

  // Verifies that there is a successful swap notification.
  cy.contains('Swapped').should('exist')
}

// TODO(WEB-3299): Update tests to differentiate between permit2 vs token approval button text once UI is updated to indicate approval step.
describe('Permit2', () => {
  // The same tokens & swap-amount combination is used for all permit2 tests.
  const INPUT_TOKEN = DAI
  const OUTPUT_TOKEN = USDC_MAINNET
  const TEST_BALANCE_INCREMENT = 0.01

  beforeEach(() => {
    // Sets up a swap between INPUT_TOKEN and OUTPUT_TOKEN.
    cy.visit(`/swap/?inputCurrency=${INPUT_TOKEN.address}&outputCurrency=${OUTPUT_TOKEN.address}`, {
      ethereum: 'hardhat',
    })
    cy.get('#swap-currency-input .token-amount-input').clear().type(TEST_BALANCE_INCREMENT.toString())
  })

  /** Asserts permit2 has a max approval for spend of the input token on-chain. */
  function expectTokenAllowanceForPermit2ToBeMax() {
    // check token approval
    return cy
      .hardhat()
      .then(({ approval, wallet }) => approval.getTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }))
      .should('deep.equal', MaxUint256)
  }

  /** Asserts the universal router has a max permit2 approval for spend of the input token on-chain. */
  function expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime: number) {
    return cy
      .hardhat()
      .then((hardhat) => hardhat.approval.getPermit2Allowance({ owner: hardhat.wallet, token: INPUT_TOKEN }))
      .then((allowance) => {
        cy.wrap(MaxUint160.eq(allowance.amount)).should('eq', true)
        // Asserts that the on-chain expiration is in 30 days, within a tolerance of 40 seconds.
        const expected = Math.floor((approvalTime + 2_592_000_000) / 1000)
        cy.wrap(allowance.expiration).should('be.closeTo', expected, 40)
      })
  }

  it('swaps when user has already approved token and permit2', () => {
    cy.hardhat()
      .then(({ approval, wallet }) => {
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN })
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN })
      })
      .then(swaps)
  })

  it('swaps after completing full permit2 approval process', () => {
    cy.get(APPROVE_BUTTON)
      .click()
      .then(() => {
        const approvalTime = Date.now()
        cy.get(APPROVE_BUTTON).should('have.text', 'Approval pending')

        // There should be a successful Approved notification.
        cy.contains('Approved').should('exist')

        swaps()

        expectTokenAllowanceForPermit2ToBeMax()
        expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
      })
  })

  it('swaps after handling user rejection of approvals and signatures', () => {
    const USER_REJECTION = { code: 4001 }
    cy.hardhat().then((hardhat) => {
      const tokenApprovalStub = cy.stub(hardhat.wallet, 'sendTransaction')
      tokenApprovalStub.rejects(USER_REJECTION) // reject token approval

      const permitApprovalStub = cy.stub(hardhat.provider, 'send')
      permitApprovalStub.withArgs('eth_signTypedData_v4').rejects(USER_REJECTION) // reject permit approval
      permitApprovalStub.callThrough() // allows non-eth_signTypedData_v4 send calls to return non-stubbed values

      // Clicking the approve button should trigger a token approval that will be rejected by the user (tokenApprovalStub).
      cy.get(APPROVE_BUTTON).click()

      // The swap component should prompt approval again.
      cy.get(APPROVE_BUTTON)
        .should('have.text', `Approve use of ${INPUT_TOKEN.symbol}`)
        .then(() => {
          tokenApprovalStub.restore() // allow token approval

          // The user is now allowing approval, but the permit2 signature will be rejected by the user (permitApprovalStub).
          cy.get(APPROVE_BUTTON).click()
          cy.get(APPROVE_BUTTON)
            .should('have.text', `Approve use of ${INPUT_TOKEN.symbol}`)
            .then(() => {
              permitApprovalStub.restore() // allow permit approval

              // The swap should now be able to proceed, as the permit2 signature will be accepted by the user.
              cy.get(APPROVE_BUTTON)
                .click()
                .then(() => {
                  const approvalTime = Date.now()
                  cy.get(APPROVE_BUTTON).should('have.text', 'Approval pending')

                  // There should be a successful Approved notification.
                  cy.contains('Approved').should('exist')

                  swaps()

                  expectTokenAllowanceForPermit2ToBeMax()
                  expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
                })
            })
        })
    })
  })

  it('swaps with existing token approval and missing permit approval', () => {
    cy.hardhat()
      .then(({ approval, wallet }) => approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }))
      .then(() => {
        cy.get(APPROVE_BUTTON)
          .click()
          .then(() => {
            const approvalTime = Date.now()

            swaps()

            expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
          })
      })
  })

  it('swaps with existing permit approval and missing token approval', () => {
    cy.hardhat()
      .then(({ approval, wallet }) => approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }))
      .then(() => {
        cy.get(APPROVE_BUTTON).click()
        cy.get(APPROVE_BUTTON).should('have.text', 'Approval pending')

        // There should be a successful Approved notification.
        cy.contains('Approved').should('exist')

        swaps()

        expectTokenAllowanceForPermit2ToBeMax()
      })
  })

  it('prompts signature when existing permit approval is expired', () => {
    const expiredAllowance = { expiration: Math.floor((Date.now() - 1) / 1000) }

    cy.hardhat()
      .then(({ approval, wallet }) => {
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN })
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }, expiredAllowance)
      })
      .then(() => {
        cy.get(APPROVE_BUTTON)
          .click()
          .then(() => {
            const approvalTime = Date.now()

            swaps()

            expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
          })
      })
  })

  it('prompts signature when existing permit approval amount is too low', () => {
    const smallAllowance = { amount: 1 }

    cy.hardhat()
      .then(({ approval, wallet }) => {
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN })
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }, smallAllowance)
      })
      .then(() => {
        cy.get(APPROVE_BUTTON)
          .click()
          .then(() => {
            const approvalTime = Date.now()

            swaps()

            expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
          })
      })
  })

  it('prompts token approval when existing approval amount is too low', () => {
    cy.hardhat()
      .then(({ approval, wallet }) => {
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN })
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }, 1)
      })
      .then(() => {
        cy.get(APPROVE_BUTTON).click()

        // There should be a successful Approved notification.
        cy.contains('Approved').should('exist')

        swaps()

        expectTokenAllowanceForPermit2ToBeMax()
      })
  })
})
