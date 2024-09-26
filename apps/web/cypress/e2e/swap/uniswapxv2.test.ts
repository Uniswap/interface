import { CurrencyAmount } from '@uniswap/sdk-core'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { getTestSelector, setupHardhat } from '../../utils'
import { stubNonPriceQuoteWith, stubSwapTxReceipt } from '../../utils/uniswapx-swap'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'

const QuoteWhereUniswapXIsBetter = 'uniswapx-v2/quote1.json'
const QuoteWithEthInput = 'uniswapx-v2/quote2.json'

const Xv2OrderSubmissionEndpoint = 'https://interface.gateway.uniswap.org/v2/rfq'
const OrderStatusEndpoint =
  'https://interface.gateway.uniswap.org/v2/orders?swapper=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266&orderHashes=0xa9dd6f05ad6d6c79bee654c31ede4d0d2392862711be0f3bc4a9124af24a6a19&orderType=Dutch_V1_V2'

describe('UniswapX v2', () => {
  beforeEach(() => {
    stubSwapTxReceipt()
  })

  describe('ETH Input', () => {
    // Turn off automine so that intermediate screens are available to assert on.
    before(() => cy.hardhat({ automine: false }))
    after(() => cy.hardhat({ automine: true }))

    setupHardhat(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(nativeOnChain(UniverseChainId.Mainnet), 2e18))
      await hardhat.mine()
    })

    beforeEach(() => {
      stubNonPriceQuoteWith(QuoteWithEthInput)
      cy.intercept(Xv2OrderSubmissionEndpoint, { fixture: 'uniswapx/orderResponse.json' })
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/openStatusResponse.json' })
      cy.visit(`/swap/?inputCurrency=ETH&outputCurrency=${DAI.address}`, {
        featureFlags: [{ flag: FeatureFlags.UniswapXv2, value: true }],
      })
    })

    it('can swap using uniswapX with ETH as input', () => {
      cy.get('#swap-currency-input .token-amount-input').type('1')
      cy.wait('@quote')

      // Prompt ETH wrap to use for order
      cy.get('#swap-button').click()
      cy.contains('Approve and swap').click()
      cy.contains('Wrap ETH')

      // Wrap ETH
      cy.wait('@eth_sendRawTransaction')
      cy.contains('Wrapping ETH...')
      cy.hardhat().then((hardhat) => hardhat.mine())
      cy.contains('Wrap ETH')

      // Approve WETH spend
      cy.wait('@eth_sendRawTransaction')
      cy.hardhat().then((hardhat) => hardhat.mine())

      // Verify signed order submission
      cy.wait('@eth_signTypedData_v4')
      cy.contains('Swap pending')

      // Verify fill
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/filledStatusResponse.json' }).as('orderStatusFilled')
      cy.wait('@orderStatusFilled')
      cy.contains('Swap success!')
    })

    it('keeps ETH as the input currency before wrap completes', () => {
      cy.get('#swap-currency-input .token-amount-input').type('1')
      cy.wait('@quote')

      // Prompt ETH wrap and confirm
      cy.get('#swap-button').click()
      cy.contains('Approve and swap').click()
      cy.wait('@eth_sendRawTransaction')

      // Close review modal before wrap is confirmed on chain
      cy.get(getTestSelector('confirmation-close-icon')).click()

      // Confirm ETH is still the input token before wrap succeeds
      cy.contains('ETH')
    })

    it('switches swap input to WETH after wrap', () => {
      cy.get('#swap-currency-input .token-amount-input').type('1')
      cy.wait('@quote')

      // Prompt ETH wrap and confirm
      cy.get('#swap-button').click()
      cy.contains('Approve and swap').click()
      cy.wait('@eth_sendRawTransaction')
      cy.hardhat().then((hardhat) => hardhat.mine())

      // Confirm wrap is successful and WETH is now input token
      cy.contains('Wrap ETH')
      cy.contains('WETH')

      // Approve WETH spend
      cy.wait('@eth_sendRawTransaction')
      cy.hardhat().then((hardhat) => hardhat.mine())

      // Submit uniswapx order signature
      cy.wait('@eth_signTypedData_v4')
      cy.contains('Swap pending...')

      // Verify fill
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/filledStatusResponse.json' }).as('orderStatusFilled')
      cy.wait('@orderStatusFilled')
      cy.contains('Swap success!')

      // Close modal
      cy.get(getTestSelector('confirmation-close-icon')).click()
      // The input currency should now be WETH
      cy.contains('WETH')
    })
  })

  describe('Orders', () => {
    function submitUniswapXOrder() {
      cy.wait('@quote')

      // Submit uniswapx order signature
      cy.get('#swap-button').click()
      cy.contains('Confirm swap').click()
      cy.wait('@eth_signTypedData_v4')
      cy.contains('Swap submitted')
      cy.contains('Learn more about swapping with UniswapX')
    }

    setupHardhat(async (hardhat) => {
      await hardhat.fund(hardhat.wallet, CurrencyAmount.fromRawAmount(USDC_MAINNET, 3e8))
      await hardhat.approval.setPermit2Allowance({ owner: hardhat.wallet, token: USDC_MAINNET })
      await hardhat.approval.setTokenAllowanceForPermit2({ owner: hardhat.wallet, token: USDC_MAINNET })
    })

    beforeEach(() => {
      stubNonPriceQuoteWith(QuoteWhereUniswapXIsBetter)
      cy.intercept(Xv2OrderSubmissionEndpoint, { fixture: 'uniswapx/orderResponse.json' })
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/openStatusResponse.json' }).as('orderStatusOpen')
      cy.visit(`/swap/?inputCurrency=${USDC_MAINNET.address}&outputCurrency=${DAI.address}`, {
        featureFlags: [{ flag: FeatureFlags.UniswapXv2, value: true }],
      })
    })

    it('can swap exact-in trades using uniswapX', () => {
      cy.get('#swap-currency-input .token-amount-input').type('300')
      submitUniswapXOrder()

      // Verify fill
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/filledStatusResponse.json' }).as('orderStatusFilled')
      cy.wait('@orderStatusFilled')
      cy.contains('Swap success!')
    })

    it('can swap exact-out trades using uniswapX', () => {
      cy.get('#swap-currency-output .token-amount-input').type('300')
      submitUniswapXOrder()

      // Verify fill
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/filledStatusResponse.json' }).as('orderStatusFilled')
      cy.wait('@orderStatusFilled')
      cy.contains('Swap success!')
    })

    it('renders proper view if uniswapx order expires', () => {
      cy.get('#swap-currency-input .token-amount-input').type('300')
      submitUniswapXOrder()

      // Verify expiration
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/expiredStatusResponse.json' }).as('orderStatusExpired')
      cy.wait('@orderStatusExpired')
      cy.contains('Order expired')
    })

    it('renders proper view if uniswapx order has insufficient funds', () => {
      cy.get('#swap-currency-input .token-amount-input').type('300')
      submitUniswapXOrder()

      // Verify insufficient funds
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/insufficientFundsStatusResponse.json' }).as(
        'orderStatusInsufficient'
      )
      cy.wait('@orderStatusInsufficient')
      cy.contains('Insufficient balance')
    })

    it('cancels a pending uniswapx order', () => {
      cy.get('#swap-currency-input .token-amount-input').type('300')
      submitUniswapXOrder()
      cy.get(getTestSelector('confirmation-close-icon')).click()

      // Open mini portfolio and navigate to activity history
      cy.get(getTestSelector('web3-status-connected')).click()
      cy.intercept(/graphql/, { fixture: 'mini-portfolio/empty_activity.json' })
      cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()

      // Open pending order modal
      cy.contains('Swapping').click()
      cy.get(getTestSelector('offchain-activity-modal')).contains('Transaction details')

      // Cancel order
      cy.get(getTestSelector('offchain-activity-modal')).contains('Cancel').click()
      cy.contains('Proceed').click()

      // Verify cancellation
      cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/cancelledStatusResponse.json' }).as(
        'orderStatusCancelled'
      )
      cy.wait('@orderStatusCancelled')
      cy.contains('Swap cancelled')
    })

    describe('activity history', () => {
      it('can view UniswapX order status progress in activity', () => {
        cy.get('#swap-currency-input .token-amount-input').type('300')
        submitUniswapXOrder()
        cy.get(getTestSelector('confirmation-close-icon')).click()

        // Open mini portfolio and navigate to activity history
        cy.get(getTestSelector('web3-status-connected')).click()
        cy.intercept(/graphql/, { fixture: 'mini-portfolio/empty_activity.json' })
        cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()

        // Open pending order modal
        cy.contains('Swapping').click()
        cy.get(getTestSelector('offchain-activity-modal')).contains('Transaction details')
        cy.get(getTestSelector('offchain-activity-modal')).contains('Order pending')

        // Verify fill
        cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/filledStatusResponse.json' }).as('orderStatusFilled')
        cy.wait('@orderStatusFilled')
        cy.get(getTestSelector('offchain-activity-modal')).contains('Order executed')
        cy.get(getTestSelector('offchain-activity-modal')).contains('Transaction ID')
      })

      it('can view UniswapX order status progress in activity upon expiry', () => {
        cy.get('#swap-currency-input .token-amount-input').type('300')
        submitUniswapXOrder()
        cy.get(getTestSelector('confirmation-close-icon')).click()

        // Open mini portfolio and navigate to activity history
        cy.get(getTestSelector('web3-status-connected')).click()
        cy.intercept(/graphql/, { fixture: 'mini-portfolio/empty_activity.json' })
        cy.get(getTestSelector('mini-portfolio-navbar')).contains('Activity').click()

        // Open pending order modal
        cy.contains('Swapping').click()
        cy.get(getTestSelector('offchain-activity-modal')).contains('Transaction details')
        cy.get(getTestSelector('offchain-activity-modal')).contains('Order pending')

        // Verify fill
        cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/expiredStatusResponse.json' }).as(
          'orderStatusExpired'
        )
        cy.wait('@orderStatusExpired')
        cy.get(getTestSelector('offchain-activity-modal')).contains('Order expired')
      })

      it('deduplicates remote vs local uniswapx orders', () => {
        cy.get('#swap-currency-input .token-amount-input').type('300')
        submitUniswapXOrder()
        cy.get(getTestSelector('confirmation-close-icon')).click()

        // Verify fill
        cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/filledStatusResponse.json' }).as('orderStatusFilled')
        cy.wait('@orderStatusFilled')
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

        // Ensure gql and local order have been deduped, such that there is one swap activity listed
        cy.get(getTestSelector('activity-content')).contains('Swapped').should('have.length', 1)
      })

      it('balances should refetch after uniswapx swap is filled', () => {
        cy.interceptGraphqlOperation('PortfolioBalances', 'portfolio_balances.json').as('PortfolioBalances')
        // Expect balances to fetch upon opening mini portfolio
        cy.get('#swap-currency-input .token-amount-input').type('300')
        submitUniswapXOrder()
        cy.get(getTestSelector('confirmation-close-icon')).click()

        // Expect balances to refetch after filling
        cy.wait('@orderStatusOpen')
        cy.get(getTestSelector('web3-status-connected')).click()
        cy.wait('@PortfolioBalances')

        cy.intercept(OrderStatusEndpoint, { fixture: 'uniswapx-v2/filledStatusResponse.json' }).as('orderStatusFilled')
        cy.wait('@orderStatusFilled')
        cy.wait('@PortfolioBalances')
      })
    })
  })
})
