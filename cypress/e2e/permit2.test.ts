import { MaxUint160, MaxUint256 } from '@uniswap/permit2-sdk'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { Utils } from 'cypress-hardhat/lib/browser/utils'
import { BigNumber } from 'ethers/lib/ethers'

import { DAI, USDC_MAINNET } from '../../src/constants/tokens'

const THIRTY_DAYS_MS = 2592000000

const TEST_BALANCE_INCREMENT = 0.01

let UNIVERSAL_ROUTER: string
let owner: string

// Shorthand util for approving DAI, permit2 spend, or both
const approve = async (hardhat: Utils, type: 'token' | 'permit2' | 'both'): Promise<void> => {
  const promises: Array<Promise<void>> = []

  if (type === 'token' || type === 'both') {
    promises.push(hardhat.approval.setTokenAllowanceForPermit2({ owner, token: DAI }))
  }
  if (type === 'permit2' || type === 'both') {
    const expiration = Math.floor((Date.now() + THIRTY_DAYS_MS) / 1000)
    promises.push(
      hardhat.approval.setPermit2Allowance(
        { owner, token: DAI, spender: UNIVERSAL_ROUTER },
        { amount: MaxUint160, expiration }
      )
    )
  }
  await Promise.all(promises)
}

// Shorthand util for asserting DAI approval on-chain
const expectTokenMaxApproval = (hardhat: Utils) => {
  // check token approval
  cy.then(() => hardhat.approval.getTokenAllowanceForPermit2({ owner, token: DAI })).should('deep.equal', MaxUint256)
}

// Shorthand util for asserting permit2 approval for DAI spend on-chain
const expectPermit2MaxApproval = (hardhat: Utils, approvalTime: number) => {
  cy.then(() => hardhat.approval.getPermit2Allowance({ owner, token: DAI, spender: UNIVERSAL_ROUTER })).then(
    (allowance) => {
      cy.then(() => MaxUint160.eq(allowance.amount)).should('eq', true)
      const expected = Math.floor((approvalTime + THIRTY_DAYS_MS) / 1000)

      // Asserts that the on-chain expiration is in 30 days, with a tolerance of 20 seconds
      cy.then(() => Math.abs(allowance.expiration - expected)).should('be.lessThan', 20)
    }
  )
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

// TODO: Update tests to differentiate between permit2 vs token approval button text once UI is updated to indicate approval step
describe('Permit2', () => {
  before(() => {
    cy.hardhat().then((hardhat) => {
      UNIVERSAL_ROUTER = UNIVERSAL_ROUTER_ADDRESS(hardhat.network.chainId)
      owner = hardhat.wallet.address
    })
  })

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
      cy.get('[data-testid="swap-approve-button"]').should('have.text', 'Approval pending')

      const approvalTime = Date.now()

      // There should be a successful Approved notification
      cy.contains('Approved').should('exist')

      swap()

      // chain state check
      expectTokenMaxApproval(hardhat)
      expectPermit2MaxApproval(hardhat, approvalTime)
    })
  })

  it('can swap after handling user rejection of approvals and signatures', () => {
    const USER_REJECTION = { code: 4001 }
    cy.hardhat().then((hardhat) => {
      const tokenApprovalStub = cy.stub(hardhat.wallet, 'sendTransaction')
      tokenApprovalStub.rejects(USER_REJECTION) // reject token approval

      cy.get('[data-testid="swap-approve-button"]').click()
      cy.get('[data-testid="swap-approve-button"]')
        .should('have.text', 'Approve use of DAI')
        .then(() => {
          const permitApprovalStub = cy.stub(hardhat.provider, 'send')
          permitApprovalStub.withArgs('eth_signTypedData_v4').rejects(USER_REJECTION) // reject permit approval

          tokenApprovalStub.restore() // allow token approval

          cy.get('[data-testid="swap-approve-button"]').click()
          cy.get('[data-testid="swap-approve-button"]')
            .should('have.text', 'Approve use of DAI')
            .then(() => {
              permitApprovalStub.restore() // allow permit approval

              cy.get('[data-testid="swap-approve-button"]').click()
              const approvalTime = Date.now()
              cy.get('[data-testid="swap-approve-button"]').should('have.text', 'Approval pending')

              // There should be a successful Approved notification
              cy.contains('Approved').should('exist')

              swap()

              // chain state check
              expectTokenMaxApproval(hardhat)
              expectPermit2MaxApproval(hardhat, approvalTime)
            })
        })
    })
  })

  it('can swap DAI for USDC with an existing token approval and missing permit approval', () => {
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'token')).then(() => {
        const approvalTime = Date.now()
        cy.get('[data-testid="swap-approve-button"]').click()

        // There should be a successful Approved notification
        cy.contains('Approved').should('exist')

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

        // There should be a successful Approved notification
        cy.contains('Approved').should('exist')

        swap()

        // chain state check
        expectTokenMaxApproval(hardhat)
      })
    })
  })

  it('prompts signature when existing permit approval is expired', () => {
    const expiredAllowance = { amount: MaxUint160, expiration: Math.floor((Date.now() - 1) / 1000) }
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'token'))
        .then(() => hardhat.approval.setPermit2Allowance({ owner, token: DAI }, expiredAllowance))
        .then(() => {
          const approvalTime = Date.now()
          cy.get('[data-testid="swap-approve-button"]').click()

          // There should be a successful Approved notification
          cy.contains('Approved').should('exist')

          swap()

          // chain state check
          expectPermit2MaxApproval(hardhat, approvalTime)
        })
    })
  })

  it('prompts signature when existing permit approval amount is too low', () => {
    const smallAllowance = { amount: 1, expiration: Math.floor((Date.now() + THIRTY_DAYS_MS) / 1000) }
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'token'))
        .then(() => hardhat.approval.setPermit2Allowance({ owner, token: DAI }, smallAllowance))
        .then(() => {
          const approvalTime = Date.now()
          cy.get('[data-testid="swap-approve-button"]').click()

          // There should be a successful Approved notification
          cy.contains('Approved').should('exist')

          swap()

          // chain state check
          expectPermit2MaxApproval(hardhat, approvalTime)
        })
    })
  })

  it('prompts token approval when existing approval amount is too low', () => {
    cy.hardhat().then((hardhat) => {
      cy.then(() => approve(hardhat, 'permit2'))
        .then(() => hardhat.approval.setTokenAllowanceForPermit2({ owner, token: DAI }, BigNumber.from(1)))
        .then(() => {
          cy.get('[data-testid="swap-approve-button"]').click()

          // There should be a successful Approved notification
          cy.contains('Approved').should('exist')

          swap()

          // chain state check
          expectTokenMaxApproval(hardhat)
        })
    })
  })
})
