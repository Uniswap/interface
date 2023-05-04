import { MaxUint160, MaxUint256 } from '@uniswap/permit2-sdk'

import { DAI, USDC_MAINNET } from '../../src/constants/tokens'

const APPROVE_BUTTON = '[data-testid="swap-approve-button"]'

// The same tokens & swap-amount combination is used for all permit2 tests
const INPUT_TOKEN = DAI
const OUTPUT_TOKEN = USDC_MAINNET
const TEST_BALANCE_INCREMENT = 0.01

const setupSwap = () => {
  // Use input/output in search params for faster test setup
  cy.visit(`/swap/?inputCurrency=${INPUT_TOKEN.address}&outputCurrency=${OUTPUT_TOKEN.address}`, {
    ethereum: 'hardhat',
  })
  cy.get('#swap-currency-input .token-amount-input').clear().type(TEST_BALANCE_INCREMENT.toString())
}

// Shorthand util for initiating a swap and confirming it
const swap = () => {
  // Ensures that enabled after approval before clicking
  cy.get('#swap-button').should('not.have.attr', 'disabled')

  // Completes the swap
  cy.get('#swap-button').click()
  cy.get('#confirm-swap-or-send').click()
  cy.get('[data-testid="dismiss-tx-confirmation"]').click()

  // There should be a successful Swap notification
  cy.contains('Swapped').should('exist')
}

// TODO: Update tests to differentiate between permit2 vs token approval button text once UI is updated to indicate approval step
describe('Permit2', () => {
  let owner: string
  before(() => cy.hardhat().then((hardhat) => (owner = hardhat.wallet.address)))

  beforeEach(setupSwap)

  // Shorthand util for approving the input token, permit2 spend, or both
  const setApproval = (type: 'token' | 'permit2' | 'both') => {
    return cy.hardhat().then(async (hardhat) => {
      const promises: Array<Promise<void>> = []
      if (type === 'token' || type === 'both') {
        promises.push(hardhat.approval.setTokenAllowanceForPermit2({ owner, token: INPUT_TOKEN }))
      }
      if (type === 'permit2' || type === 'both') {
        promises.push(hardhat.approval.setPermit2Allowance({ owner, token: INPUT_TOKEN }))
      }

      await Promise.all(promises)
      return hardhat
    })
  }

  // Shorthand util for asserting input token approval on-chain
  const expectTokenMaxApproval = () => {
    // check token approval
    return cy
      .hardhat()
      .then((hardhat) => hardhat.approval.getTokenAllowanceForPermit2({ owner, token: INPUT_TOKEN }))
      .should('deep.equal', MaxUint256)
  }

  // Shorthand util for asserting permit2 approval for spend of the input token on-chain
  const expectPermit2MaxApproval = (approvalTime: number) => {
    return cy
      .hardhat()
      .then((hardhat) => hardhat.approval.getPermit2Allowance({ owner, token: INPUT_TOKEN }))
      .then((allowance) => {
        cy.then(() => MaxUint160.eq(allowance.amount)).should('eq', true)
        const expected = Math.floor((approvalTime + 2_592_000_000) / 1000)

        // Asserts that the on-chain expiration is in 30 days, within a tolerance of 20 seconds
        cy.then(() => Math.abs(allowance.expiration - expected)).should('be.lessThan', 20)
      })
  }

  it('does not prompt approval when user has already approved token and permit2', () => {
    setApproval('both').then(swap)
  })

  it('can swap after completing full permit2 approval process', () => {
    cy.get(APPROVE_BUTTON).click()
    cy.get(APPROVE_BUTTON).should('have.text', 'Approval pending')

    const approvalTime = Date.now()

    // There should be a successful Approved notification
    cy.contains('Approved').should('exist')

    swap()

    // chain state check
    expectTokenMaxApproval()
    expectPermit2MaxApproval(approvalTime)
  })

  it('can swap after handling user rejection of approvals and signatures', () => {
    const USER_REJECTION = { code: 4001 }
    cy.hardhat().then((hardhat) => {
      const tokenApprovalStub = cy.stub(hardhat.wallet, 'sendTransaction')
      tokenApprovalStub.rejects(USER_REJECTION) // reject token approval

      cy.get(APPROVE_BUTTON).click()
      cy.get(APPROVE_BUTTON)
        .should('have.text', `Approve use of ${INPUT_TOKEN.symbol}`)
        .then(() => {
          const permitApprovalStub = cy.stub(hardhat.provider, 'send')
          permitApprovalStub.withArgs('eth_signTypedData_v4').rejects(USER_REJECTION) // reject permit approval

          tokenApprovalStub.restore() // allow token approval

          cy.get(APPROVE_BUTTON).click()
          cy.get(APPROVE_BUTTON)
            .should('have.text', `Approve use of ${INPUT_TOKEN.symbol}`)
            .then(() => {
              permitApprovalStub.restore() // allow permit approval

              cy.get(APPROVE_BUTTON).click()
              const approvalTime = Date.now()
              cy.get(APPROVE_BUTTON).should('have.text', 'Approval pending')

              // There should be a successful Approved notification
              cy.contains('Approved').should('exist')

              swap()

              // chain state check
              expectTokenMaxApproval()
              expectPermit2MaxApproval(approvalTime)
            })
        })
    })
  })

  it('can swap with existing token approval and missing permit approval', () => {
    setApproval('token').then(() => {
      const approvalTime = Date.now()
      cy.get(APPROVE_BUTTON).click()

      swap()

      // chain state check
      expectPermit2MaxApproval(approvalTime)
    })
  })

  it('can swap with existing permit approval and missing token approval', () => {
    setApproval('permit2').then(() => {
      cy.get(APPROVE_BUTTON).click()
      cy.get(APPROVE_BUTTON).should('have.text', 'Approval pending')

      // There should be a successful Approved notification
      cy.contains('Approved').should('exist')

      swap()

      // chain state check
      expectTokenMaxApproval()
    })
  })

  it('prompts signature when existing permit approval is expired', () => {
    const expiredAllowance = { expiration: Math.floor((Date.now() - 1) / 1000) }

    setApproval('token')
      .then((hardhat) => hardhat.approval.setPermit2Allowance({ owner, token: INPUT_TOKEN }, expiredAllowance))
      .then(() => {
        const approvalTime = Date.now()
        cy.get(APPROVE_BUTTON).click()

        swap()

        // chain state check
        expectPermit2MaxApproval(approvalTime)
      })
  })

  it('prompts signature when existing permit approval amount is too low', () => {
    const smallAllowance = { amount: 1 }

    setApproval('token')
      .then((hardhat) => hardhat.approval.setPermit2Allowance({ owner, token: INPUT_TOKEN }, smallAllowance))
      .then(() => {
        const approvalTime = Date.now()
        cy.get(APPROVE_BUTTON).click()

        swap()

        // chain state check
        expectPermit2MaxApproval(approvalTime)
      })
  })

  it('prompts token approval when existing approval amount is too low', () => {
    setApproval('permit2')
      .then((hardhat) => hardhat.approval.setTokenAllowanceForPermit2({ owner, token: INPUT_TOKEN }, 1))
      .then(() => {
        cy.get(APPROVE_BUTTON).click()

        // There should be a successful Approved notification
        cy.contains('Approved').should('exist')

        swap()

        // chain state check
        expectTokenMaxApproval()
      })
  })
})
