import { MaxUint160, MaxUint256 } from '@uniswap/permit2-sdk'

import { DAI, USDC_MAINNET } from '../../src/constants/tokens'
import { getTestSelector } from '../utils'

/** Initiates a swap. */
function initiateSwap() {
  // The swap button is re-rendered once enabled, so we must wait until the original button is not disabled to re-select the appropriate button.
  cy.get('#swap-button').should('not.be.disabled')
  // Completes the swap.
  cy.get('#swap-button').click()
  cy.contains('Confirm swap').click()
}

describe('Permit2', () => {
  // The same tokens are used for all permit2 tests.
  const INPUT_TOKEN = DAI
  const OUTPUT_TOKEN = USDC_MAINNET

  beforeEach(() => {
    // Sets up a swap between INPUT_TOKEN and OUTPUT_TOKEN.
    cy.visit(`/swap/?inputCurrency=${INPUT_TOKEN.address}&outputCurrency=${OUTPUT_TOKEN.address}`, {
      ethereum: 'hardhat',
    })
    cy.get('#swap-currency-input .token-amount-input').type('0.01')
  })

  /** Asserts permit2 has a max approval for spend of the input token on-chain. */
  function expectTokenAllowanceForPermit2ToBeMax() {
    // check token approval
    cy.hardhat()
      .then(({ approval, wallet }) => approval.getTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }))
      .should('deep.equal', MaxUint256)
  }

  /** Asserts the universal router has a max permit2 approval for spend of the input token on-chain. */
  function expectPermit2AllowanceForUniversalRouterToBeMax() {
    cy.hardhat()
      .then((hardhat) => hardhat.approval.getPermit2Allowance({ owner: hardhat.wallet, token: INPUT_TOKEN }))
      .then((allowance) => {
        cy.wrap(MaxUint160.eq(allowance.amount)).should('eq', true)
        // Asserts that the on-chain expiration is in 30 days, within a tolerance of 40 seconds.
        const THIRTY_DAYS_SECONDS = 2_592_000
        const expected = Math.floor(Date.now() / 1000 + THIRTY_DAYS_SECONDS)
        cy.wrap(allowance.expiration).should('be.closeTo', expected, 40)
      })
  }

  describe('approval process (with intermediate screens)', () => {
    // Turn off automine so that intermediate screens are available to assert on.
    beforeEach(() => cy.hardhat({ automine: false }))

    it('swaps after completing full permit2 approval process', () => {
      initiateSwap()

      // verify that the modal retains its state when the window loses focus
      cy.window().trigger('blur')

      // Verify token approval
      cy.contains('Enable spending DAI on Uniswap')
      cy.wait('@eth_sendRawTransaction')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.get(getTestSelector('popups')).contains('Approved')
      expectTokenAllowanceForPermit2ToBeMax()

      // Verify permit2 approval
      cy.contains('Allow DAI to be used for swapping')
      cy.wait('@eth_signTypedData_v4')
      cy.wait('@eth_sendRawTransaction')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.contains('Success')
      cy.get(getTestSelector('popups')).contains('Swapped')
      expectPermit2AllowanceForUniversalRouterToBeMax()
    })

    it('swaps with existing permit approval and missing token approval', () => {
      cy.hardhat().then(async (hardhat) => {
        await hardhat.approval.setPermit2Allowance({ owner: hardhat.wallet, token: INPUT_TOKEN })
        await hardhat.mine()
      })
      initiateSwap()

      // Verify token approval
      cy.contains('Enable spending DAI on Uniswap')
      cy.wait('@eth_sendRawTransaction')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.get(getTestSelector('popups')).contains('Approved')
      expectTokenAllowanceForPermit2ToBeMax()

      // Verify transaction
      cy.wait('@eth_sendRawTransaction')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.contains('Success')
      cy.get(getTestSelector('popups')).contains('Swapped')
    })
  })

  it('swaps when user has already approved token and permit2', () => {
    cy.hardhat().then(({ approval, wallet }) =>
      Promise.all([
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }),
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }),
      ])
    )
    initiateSwap()

    // Verify transaction
    cy.contains('Success')
    cy.get(getTestSelector('popups')).contains('Swapped')
  })

  it('swaps after handling user rejection of both approval and signature', () => {
    const USER_REJECTION = { code: 4001 }
    cy.hardhat().then((hardhat) => {
      // Reject token approval
      const tokenApprovalStub = cy.stub(hardhat.wallet, 'sendTransaction').log(false)
      tokenApprovalStub.rejects(USER_REJECTION) // rejects token approval
      initiateSwap()

      // Verify token approval rejection
      cy.wrap(tokenApprovalStub).should('be.calledOnce')
      cy.contains('Review swap')

      // Allow token approval
      cy.then(() => tokenApprovalStub.restore())

      // Reject permit2 approval
      const permitApprovalStub = cy.stub(hardhat.provider, 'send').log(false)
      permitApprovalStub.withArgs('eth_signTypedData_v4').rejects(USER_REJECTION) // rejects permit approval
      permitApprovalStub.callThrough() // allows non-eth_signTypedData_v4 send calls to return non-stubbed values
      cy.contains('Confirm swap').click()

      // Verify token approval
      cy.get(getTestSelector('popups')).contains('Approved')
      expectTokenAllowanceForPermit2ToBeMax()

      // Verify permit2 approval rejection
      cy.wrap(permitApprovalStub).should('be.calledWith', 'eth_signTypedData_v4')
      cy.contains('Review swap')

      // Allow permit2 approval
      cy.then(() => permitApprovalStub.restore())
      cy.contains('Confirm swap').click()

      // Verify permit2 approval
      cy.contains('Success')
      cy.get(getTestSelector('popups')).contains('Swapped')
      expectPermit2AllowanceForUniversalRouterToBeMax()
    })
  })

  it('prompts token approval when existing approval amount is too low', () => {
    cy.hardhat().then(({ approval, wallet }) =>
      Promise.all([
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }),
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }, 1),
      ])
    )
    initiateSwap()

    // Verify token approval
    cy.get(getTestSelector('popups')).contains('Approved')
    expectPermit2AllowanceForUniversalRouterToBeMax()
  })

  it('prompts signature when existing permit approval is expired', () => {
    const expiredAllowance = { expiration: Math.floor((Date.now() - 1) / 1000) }
    cy.hardhat().then(({ approval, wallet }) =>
      Promise.all([
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }),
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }, expiredAllowance),
      ])
    )
    initiateSwap()

    // Verify permit2 approval
    cy.wait('@eth_signTypedData_v4')
    cy.contains('Success')
    cy.get(getTestSelector('popups')).contains('Swapped')
    expectPermit2AllowanceForUniversalRouterToBeMax()
  })

  it('prompts signature when existing permit approval amount is too low', () => {
    const smallAllowance = { amount: 1 }
    cy.hardhat().then(({ approval, wallet }) =>
      Promise.all([
        approval.setTokenAllowanceForPermit2({ owner: wallet, token: INPUT_TOKEN }),
        approval.setPermit2Allowance({ owner: wallet, token: INPUT_TOKEN }, smallAllowance),
      ])
    )
    initiateSwap()

    // Verify permit2 approval
    cy.wait('@eth_signTypedData_v4')
    cy.contains('Success')
    cy.get(getTestSelector('popups')).contains('Swapped')
    expectPermit2AllowanceForUniversalRouterToBeMax()
  })
})
