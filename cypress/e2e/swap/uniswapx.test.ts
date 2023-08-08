import { ChainId, CurrencyAmount } from '@uniswap/sdk-core'

import { DAI, nativeOnChain, USDC_MAINNET } from '../../../src/constants/tokens'
import { getTestSelector } from '../../utils'

const QuoteEndpoint = 'https://api.uniswap.org/v2/quote'
const QuoteWhereUniswapXIsBetter = 'uniswapx/quote1.json'
const QuoteWithEthInput = 'uniswapx/quote2.json'

const OrderSubmissionEndpoint = 'https://api.uniswap.org/v2/order'
const OrderResponse = 'uniswapx/orderResponse.json'

const OrderStatusEndpoint =
  'https://api.uniswap.org/v2/orders?swapper=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&orderHashes=0xa9dd6f05ad6d6c79bee654c31ede4d0d2392862711be0f3bc4a9124af24a6a19'
const OpenStatusResponse = 'uniswapx/openStatusResponse.json'
const FilledStatusResponse = 'uniswapx/filledStatusResponse.json'
const ExpiredStatusResponse = 'uniswapx/expiredStatusResponse.json'
const TransactionReceipt = 'uniswapx/fillTransactionReceipt.json'

const InsufficientFundsStatusResponse = 'uniswapx/insufficientFundsStatusResponse.json'

/** Simulates the user opening swap settings and toggling UniswapX.  */
function toggleUniswapXInSwapSettings() {
  cy.get(getTestSelector('open-settings-dialog-button')).click()
  cy.get(getTestSelector('toggle-uniswap-x-button')).click()
  cy.get(getTestSelector('open-settings-dialog-button')).click()
}

/** Stubs the provider to return a tx receipt corresponding to the mock filled uniswapx order's txHash */
function stubSwapTxReceipt() {
  cy.hardhat().then((hardhat) => {
    cy.fixture(TransactionReceipt).then((mockTxReceipt) => {
      const getTransactionReceiptStub = cy.stub(hardhat.provider, 'getTransactionReceipt').log(false)
      getTransactionReceiptStub.withArgs(mockTxReceipt.transactionHash).resolves(mockTxReceipt)
      getTransactionReceiptStub.callThrough()
    })
  })
}

describe('UniswapX Toggle', () => {
  beforeEach(() => {
    cy.intercept(QuoteEndpoint, { fixture: QuoteWhereUniswapXIsBetter })
    cy.visit(`/swap/?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`)
  })

  it('only displays uniswapx ui when setting is on', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')

    // UniswapX ui should not be visible
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('not.exist')

    toggleUniswapXInSwapSettings()

    // UniswapX ui should not be visible
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('exist')
  })

  it('prompts opt-in if UniswapX is better', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')

    // UniswapX should not display in gas estimate row before opt-in
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('not.exist')

    // Hide banner that partially covers UniswapX mustache
    cy.get(getTestSelector('uniswap-wallet-banner')).click()

    // UniswapX mustache should be visible
    cy.contains('Try it now').click()

    // Opt-in dialog should now be hidden
    cy.contains('Try it now').should('not.be.visible')

    // UniswapX should display in gas estimate row
    cy.get(getTestSelector('gas-estimate-uniswapx-icon')).should('exist')

    // Opt-in dialog should not reappear if user manually toggles UniswapX off
    toggleUniswapXInSwapSettings()
    cy.contains('Try it now').should('not.be.visible')
  })
})

describe('UniswapX Orders', () => {
  beforeEach(() => {
    cy.intercept(QuoteEndpoint, { fixture: QuoteWhereUniswapXIsBetter })
    cy.intercept(OrderSubmissionEndpoint, { fixture: OrderResponse })
    cy.intercept(OrderStatusEndpoint, { fixture: OpenStatusResponse })

    stubSwapTxReceipt()

    cy.hardhat().then(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(USDC_MAINNET, 3e8))
    })
    cy.visit(`/swap/?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`)
  })

  it('can swap using uniswapX', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    toggleUniswapXInSwapSettings()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.wait('@eth_signTypedData_v4')
    cy.contains('Swap submitted')
    cy.contains('Learn more about swapping with UniswapX')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: FilledStatusResponse })

    // Verify swap success
    cy.contains('Swapped')
  })

  it('renders proper view if uniswapx order expires', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    toggleUniswapXInSwapSettings()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()

    // Return expired order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: ExpiredStatusResponse })

    // Verify swap failure message
    cy.contains('Swap expired')
  })

  it('renders proper view if uniswapx order has insufficient funds', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('300')
    toggleUniswapXInSwapSettings()

    // Submit uniswapx order signature
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()

    // Return insufficient_funds order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: InsufficientFundsStatusResponse })

    // Verify swap failure message
    cy.contains('Insufficient funds')
  })
})

describe('UniswapX Eth Input', () => {
  beforeEach(() => {
    cy.intercept(QuoteEndpoint, { fixture: QuoteWithEthInput })
    cy.intercept(OrderSubmissionEndpoint, { fixture: OrderResponse })
    cy.intercept(OrderStatusEndpoint, { fixture: OpenStatusResponse })

    // Turn off automine so that intermediate screens are available to assert on.
    cy.hardhat({ automine: false }).then(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(nativeOnChain(ChainId.MAINNET), 2e18))
    })

    stubSwapTxReceipt()

    cy.visit(`/swap/?inputCurrency=ETH&outputCurrency=${DAI.address}`)
  })

  it('can swap using uniswapX with ETH as input', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('1')
    toggleUniswapXInSwapSettings()

    // Prompt ETH wrap to use for order
    cy.get('#swap-button').click()
    cy.contains('Confirm swap').click()
    cy.contains('Wrap ETH')

    // Wrap ETH
    cy.wait('@eth_sendRawTransaction')
    cy.contains('Pending...')
    cy.hardhat().then((hardhat) => hardhat.mine())
    cy.contains('Wrapped')

    // Verify signed order submission
    cy.wait('@eth_signTypedData_v4')
    cy.contains('Swap submitted')
    cy.contains('Learn more about swapping with UniswapX')

    // Return filled order status from uniswapx api
    cy.intercept(OrderStatusEndpoint, { fixture: FilledStatusResponse })

    // Verify swap success
    cy.contains('Swapped')
  })

  it('switches swap input to WETH after wrap', () => {
    // Setup a swap
    cy.get('#swap-currency-input .token-amount-input').type('1')
    toggleUniswapXInSwapSettings()

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
    cy.intercept(OrderStatusEndpoint, { fixture: FilledStatusResponse })

    // Verify swap success
    cy.contains('Swapped')
  })
})
