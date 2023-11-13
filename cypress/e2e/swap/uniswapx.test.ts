import { ChainId, CurrencyAmount } from '@uniswap/sdk-core'
import { FeatureFlag } from 'featureFlags'

import { DAI, nativeOnChain, USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

const QuoteEndpoint = 'https://api.uniswap.org/v2/quote'
const QuoteWhereUniswapXIsBetter = 'uniswapx/quote1.json'
const QuoteWithEthInput = 'uniswapx/quote2.json'

const OrderSubmissionEndpoint = 'https://api.uniswap.org/v2/order'

const OrderStatusEndpoint =
  'https://api.uniswap.org/v2/orders?swapper=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&orderHashes=0xa9dd6f05ad6d6c79bee654c31ede4d0d2392862711be0f3bc4a9124af24a6a19'

/** Stubs the provider to return a tx receipt corresponding to the mock filled uniswapx order's txHash */
function stubSwapTxReceipt() {
  cy.hardhat().then((hardhat) => {
    cy.fixture('uniswapx/fillTransactionReceipt.json').then((mockTxReceipt) => {
      const getTransactionReceiptStub = cy.stub(hardhat.provider, 'getTransactionReceipt').log(false)
      getTransactionReceiptStub.withArgs(mockTxReceipt.transactionHash).resolves(mockTxReceipt)
      getTransactionReceiptStub.callThrough()
    })
  })
}

describe('UniswapX Toggle', () => {
  beforeEach(() => {
    cy.intercept(QuoteEndpoint, { fixture: QuoteWhereUniswapXIsBetter })
    cy.visit(`/swap/?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`, {
      featureFlags: [{ name: FeatureFlag.uniswapXDefaultEnabled, value: false }],
    })
  })

  it('only displays uniswapx ui when setting is on', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')

    // UniswapX UI should not be visible
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('not.exist')

    // Opt-in to UniswapX
    cy.contains('Try it now').click()

    // UniswapX UI should be visible
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('exist')
  })

  it('prompts opt-in if UniswapX is better', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')

    // UniswapX should not display in gas estimate row before opt-in
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('not.exist')

    // UniswapX mustache should be visible
    cy.contains('Try it now').click()

    // Opt-in dialog should now be hidden
    cy.contains('Try it now').should('not.be.visible')

    // UniswapX should display in gas estimate row
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('exist')

    // Opt-in dialog should not reappear if user manually toggles UniswapX off
    cy.get(getTestSelector('open-settings-dialog-button')).click()
    cy.get(getTestSelector('toggle-uniswap-x-button')).click()
    cy.get(getTestSelector('open-settings-dialog-button')).click()
    cy.contains('Try it now').should('not.be.visible')
  })
})

describe('UniswapX Orders', () => {
  beforeEach(() => {
    cy.intercept(QuoteEndpoint, { fixture: QuoteWhereUniswapXIsBetter })
    cy.intercept(OrderSubmissionEndpoint, { fixture: 'uniswapx/orderResponse.json' })
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/openStatusResponse.json' })

    stubSwapTxReceipt()

    cy.hardhat().then((hardhat) => hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(USDC_MAINNET, 3e8)))
    cy.visit(`/swap/?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`, {
      featureFlags: [{ name: FeatureFlag.uniswapXDefaultEnabled, value: false }],
    })
  })

  it('can swap exact-in trades using uniswapX', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    cy.contains('Try it now').click()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.wait('@eth_signTypedData_v4')
    cy.contains('Swap submitted')
    cy.contains('Learn more about swapping with UniswapX')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/filledStatusResponse.json' })

    // Verify swap success
    cy.contains('Swapped')
  })

  it('can swap exact-out trades using uniswapX', () => {
    // Setup a swap
    cy.get('#swap-currency-output .token-amount-input').type('300')
    cy.contains('Try it now').click()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.wait('@eth_signTypedData_v4')
    cy.contains('Swap submitted')
    cy.contains('Learn more about swapping with UniswapX')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/filledStatusResponse.json' })

    // Verify swap success
    cy.contains('Swapped')
  })

  it('renders proper view if uniswapx order expires', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    cy.contains('Try it now').click()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()

    // Return expired order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/expiredStatusResponse.json' })

    // Verify swap failure message
    cy.contains('Swap expired')
  })

  it('renders proper view if uniswapx order has insufficient funds', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    cy.contains('Try it now').click()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()

    // Return insufficient_funds order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/insufficientFundsStatusResponse.json' })

    // Verify swap failure message
    cy.contains('Insufficient funds')
  })
})

describe('UniswapX Eth Input', () => {
  beforeEach(() => {
    cy.intercept(QuoteEndpoint, { fixture: QuoteWithEthInput })
    cy.intercept(OrderSubmissionEndpoint, { fixture: 'uniswapx/orderResponse.json' })
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/openStatusResponse.json' })

    // Turn off automine so that intermediate screens are available to assert on.
    cy.hardhat({ automine: false }).then(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(nativeOnChain(ChainId.MAINNET), 2e18))
      await hardhat.mine()
    })

    stubSwapTxReceipt()

    cy.visit(`/swap/?inputCurrency=ETH&outputCurrency=${DAI.address}`, {
      featureFlags: [{ name: FeatureFlag.uniswapXDefaultEnabled, value: false }],
    })
  })

  it('can swap using uniswapX with ETH as input', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('1')
    cy.contains('Try it now').click()

    // Prompt ETH wrap to use for order
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.contains('Wrap ETH')

    // Wrap ETH
    cy.wait('@eth_sendRawTransaction')
    cy.contains('Pending...')
    cy.hardhat().then((hardhat) => hardhat.mine())
    cy.contains('Wrapped')

    // Approve WETH spend
    cy.wait('@eth_sendRawTransaction')
    cy.hardhat().then((hardhat) => hardhat.mine())

    // Verify signed order submission
    cy.wait('@eth_signTypedData_v4')
    cy.contains('Swap submitted')
    cy.contains('Learn more about swapping with UniswapX')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/filledStatusResponse.json' })

    // Verify swap success
    cy.contains('Swapped')
  })

  it('switches swap input to WETH after wrap', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('1')
    cy.contains('Try it now').click()

    // Prompt ETH wrap and confirm
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.wait('@eth_sendRawTransaction')

    // Close review modal before wrap is confirmed on chain
    cy.get(getTestSelector('confirmation-close-icon')).click()
    cy.hardhat().then((hardhat) => hardhat.mine())

    // Confirm wrap is successful and WETH is now input token
    cy.contains('Wrapped')
    cy.contains('WETH')

    // Reopen review modal and continue swap
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()

    // Approve WETH spend
    cy.wait('@eth_sendRawTransaction')
    cy.hardhat().then((hardhat) => hardhat.mine())

    // Submit uniswapx order signature
    cy.wait('@eth_signTypedData_v4')
    cy.contains('Swap submitted')
    cy.contains('Learn more about swapping with UniswapX')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/filledStatusResponse.json' })

    // Verify swap success
    cy.contains('Swapped')
  })
})

describe('UniswapX activity history', () => {
  beforeEach(() => {
    cy.intercept(QuoteEndpoint, { fixture: QuoteWhereUniswapXIsBetter })
    cy.intercept(OrderSubmissionEndpoint, { fixture: 'uniswapx/orderResponse.json' })
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/openStatusResponse.json' })

    stubSwapTxReceipt()

    cy.hardhat().then(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(USDC_MAINNET, 3e8))
    })
    cy.visit(`/swap/?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`, {
      featureFlags: [{ name: FeatureFlag.uniswapXDefaultEnabled, value: false }],
    })
  })

  it('can view UniswapX order status progress in activity', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    cy.contains('Try it now').click()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.wait('@eth_signTypedData_v4')
    cy.get(getTestSelector('confirmation-close-icon')).click()

    // Open mini portfolio and navigate to activity history
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.intercept(/graphql/, { fixture: 'mini-portfolio/empty_activity.json' })
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()

    // Open pending order modal
    cy.contains('Swapping').click()
    cy.get(getTestSelector('offchain-activity-modal')).contains('Swapping')
    cy.get(getTestSelector('offchain-activity-modal')).contains('Learn more about swapping with UniswapX')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/filledStatusResponse.json' })

    cy.get(getTestSelector('offchain-activity-modal')).contains('Swapped')
    cy.get(getTestSelector('offchain-activity-modal')).contains('View on Explorer')
  })

  it('can view UniswapX order status progress in activity upon expiry', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    cy.contains('Try it now').click()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.wait('@eth_signTypedData_v4')
    cy.get(getTestSelector('confirmation-close-icon')).click()

    // Open mini portfolio and navigate to activity history
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.intercept(/graphql/, { fixture: 'mini-portfolio/empty_activity.json' })
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()

    // Open pending order modal
    cy.contains('Swapping').click()
    cy.get(getTestSelector('offchain-activity-modal')).contains('Swapping')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/expiredStatusResponse.json' })

    cy.get(getTestSelector('offchain-activity-modal')).contains('Swap expired')
    cy.get(getTestSelector('offchain-activity-modal')).contains('learn more')
  })

  it('deduplicates remote vs local uniswapx orders', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    cy.contains('Try it now').click()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.wait('@eth_signTypedData_v4')
    cy.get(getTestSelector('confirmation-close-icon')).click()

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/filledStatusResponse.json' })

    cy.contains('Swapped')

    // Open mini portfolio
    cy.get(getTestSelector('web3-status-connected')).click()

    cy.fixture('mini-portfolio/uniswapx_activity.json').then((uniswapXActivity) => {
      // Replace fixture's timestamp with current time
      uniswapXActivity.data.portfolios[0].assetActivities[0].timestamp = Date.now() / 1000
      cy.intercept(/graphql/, uniswapXActivity)
    })

    // Open activity history
    cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()

    // Ensure gql and local order have been deduped, such that there is only one swap activity listed
    cy.get(getTestSelector('activity-content')).contains('Swapped').should('have.length', 1)
  })

  it('balances should refetch after uniswapx swap', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    cy.contains('Try it now').click()

    const gqlSpy = cy.spy().as('gqlSpy')
    cy.intercept(/graphql/, (req) => {
      // Spy on request frequency
      req.on('response', gqlSpy)
      // Reply with a fixture to speed up test
      req.reply({
        fixture: 'mini-portfolio/tokens.json',
      })
    })

    // Expect balances to fetch upon opening mini portfolio
    cy.get(getTestSelector('web3-status-connected')).click()
    cy.get('@gqlSpy').should('have.been.calledOnce')

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()

    // Expect balances to refetch after approval
    cy.get('@gqlSpy').should('have.been.calledTwice')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx/filledStatusResponse.json' })

    // Expect balances to refetch after swap
    cy.get('@gqlSpy').should('have.been.calledThrice')
  })
})
