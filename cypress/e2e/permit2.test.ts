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
  cy.get('[data-cy="confirmation-close-icon"]').click()

  // Verifies that there is a successful swap notification.
  cy.contains('Swapped').should('exist')
}

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
    cy.get('#swap-currency-input .token-amount-input').click().type(TEST_BALANCE_INCREMENT.toString())
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
        // Asserts that the on-chain expiration is in 30 days, within a tolerance of 20 seconds.
        const expected = Math.floor((approvalTime + 2_592_000_000) / 1000)
        cy.wrap(allowance.expiration).should('be.closeTo', expected, 20)
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
    cy.get('#swap-button').should('not.have.attr', 'disabled')
    cy.get('#swap-button').click()
    cy.get(getTestSelector('confirm-swap-button')).click()
    cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Approve permit')
    cy.contains('Approved').should('exist')

    cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Approve DAI')
    cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Confirm Swap')

    const approvalTime = Date.now()
    // There should be a successful Approved notification.

    cy.contains('Swapped').should('exist')

    expectTokenAllowanceForPermit2ToBeMax()
    expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
  })

  it('swaps after handling user rejection of approvals and signatures', () => {
    const USER_REJECTION = { code: 4001 }
    cy.hardhat()
      .then(({ approval, wallet }) => {
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }, 0)
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }, { amount: 0 })
      })
      .then((hardhat) => {
        const tokenApprovalStub = cy.stub(hardhat.wallet, 'sendTransaction')
        tokenApprovalStub.rejects(USER_REJECTION) // reject token approval
        const permitApprovalStub = cy.stub(hardhat.provider, 'send')
        permitApprovalStub.withArgs('eth_signTypedData_v4').rejects(USER_REJECTION) // reject permit approval
        permitApprovalStub.callThrough() // allows non-eth_signTypedData_v4 send calls to return non-stubbed values

        // Start the approve and swap flow.
        cy.get('#swap-button').should('not.have.attr', 'disabled')
        cy.get('#swap-button').click()
        // Clicking the confirm button should trigger a token approval that will be rejected by the user (tokenApprovalStub).
        cy.get(getTestSelector('confirm-swap-button')).click()

        // The swap component should prompt approval again.
        cy.get(getTestSelector('PendingModalContent-title'))
          .should('have.text', `Permit approval failed`)
          .then(() => {
            tokenApprovalStub.restore() // allow token approval
            // The user is now allowing approval, but the permit2 signature will be rejected by the user (permitApprovalStub).
            cy.get(getTestSelector('ConfirmSwapModal-retry'))
              .click()
              .then(() => {
                cy.get(getTestSelector('PendingModalContent-title')).should('have.text', `Token approval failed`)
                permitApprovalStub.restore() // allow permit approval
                cy.get(getTestSelector('ConfirmSwapModal-retry')).click()

                // The swap should now be able to proceed, as the permit2 signature will be accepted by the user.
                const approvalTime = Date.now()
                cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Approve permit')

                // There should be a successful Approved notification.
                cy.contains('Approved').should('exist')

                cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Approve DAI')
                cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Confirm Swap')
                cy.contains('Swapped').should('exist')

                expectTokenAllowanceForPermit2ToBeMax()
                expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
              })
          })
      })
  })

  it('swaps with existing token approval and missing permit approval', () => {
    cy.hardhat()
      .then(({ approval, wallet }) => approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }))
      .then(() => {
        cy.get('#swap-button').should('not.have.attr', 'disabled')
        cy.get('#swap-button').click()
        cy.get(getTestSelector('confirm-swap-button')).click()
        const approvalTime = Date.now()
        cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Approve DAI')

        cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Confirm Swap')
        cy.contains('Swapped').should('exist')

        expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
      })
  })

  it('swaps with existing permit approval and missing token approval', () => {
    cy.hardhat()
      .then(({ approval, wallet }) => approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }))
      .then(() => {
        cy.get('#swap-button').should('not.have.attr', 'disabled')
        cy.get('#swap-button').click()
        cy.get(getTestSelector('confirm-swap-button')).click()
        const approvalTime = Date.now()
        cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Approve permit')

        cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Confirm Swap')
        cy.contains('Swapped').should('exist')

        expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
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
        cy.get('#swap-button').should('not.have.attr', 'disabled')
        cy.get('#swap-button').click()
        cy.get(getTestSelector('confirm-swap-button')).click()
        const approvalTime = Date.now()
        cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Approve DAI')

        cy.get(getTestSelector('PendingModalContent-title')).should('have.text', 'Confirm Swap')
        cy.contains('Swapped').should('exist')

        expectPermit2AllowanceForUniversalRouterToBeMax(approvalTime)
      })
  })

  xit('prompts signature when existing permit approval amount is too low', () => {
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

  xit('prompts token approval when existing approval amount is too low', () => {
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
