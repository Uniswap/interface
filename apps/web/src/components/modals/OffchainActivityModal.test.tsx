import '~/test-utils/tokens/mocks'
import 'utilities/src/logger/mocks'
import { WETH9 } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { getFeatureFlag, useFeatureFlag } from '@universe/gating'
import { DAI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import i18n from 'uniswap/src/i18n'
import { currencyId } from 'uniswap/src/utils/currencyId'
import type { Mock } from 'vitest'
import { getOrderTitle, showCancelPreCheckRefusalPopup } from '~/components/modals/OffchainActivityCancelFlow'
import { OrderContent } from '~/components/modals/OffchainActivityModal'
import { popupRegistry } from '~/state/popups/registry'
import { render } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => {
  return {
    ...(await importOriginal<typeof import('@universe/gating')>()),
    useFeatureFlag: vi.fn(),
    getFeatureFlag: vi.fn(),
  }
})

vi.mock('uniswap/src/features/language/localizedDayjs', () => ({
  useFormattedDateTime: vi.fn(() => 'Mock Date'),
  useLocalizedDayjs: vi.fn(() => (timestamp: number) => timestamp), // Returns timestamp as-is since useFormattedDateTime is mocked
  FORMAT_DATE_TIME_SHORT: 'lll',
  FORMAT_DATE_TIME_MEDIUM: 'LLL',
}))

describe('OrderContent', () => {
  beforeEach(() => {
    ;(useFeatureFlag as Mock).mockReturnValue(false)
    ;(getFeatureFlag as Mock).mockReturnValue(false)
  })

  it('should render without error, filled order', () => {
    const order: UniswapXOrderDetails = {
      hash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
      orderHash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
      from: '0xSenderAddress',
      id: 'tx123',
      chainId: UniverseChainId.Mainnet,
      routing: TradingApi.Routing.DUTCH_V2,
      status: TransactionStatus.Success,
      addedTime: 1701715079,
      transactionOriginType: TransactionOriginType.Internal,
      typeInfo: {
        isUniswapXOrder: true,
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: currencyId(DAI),
        outputCurrencyId: currencyId(WETH9[UniverseChainId.Mainnet]),
        inputCurrencyAmountRaw: '252074033564766400000',
        expectedOutputCurrencyAmountRaw: '106841079134757921',
        minimumOutputCurrencyAmountRaw: '106841079134757921',
        settledOutputCurrencyAmountRaw: '106841079134757921',
      },
    }
    const { container } = render(<OrderContent order={order} />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Order executed')
  })

  it('should render without error, open order', () => {
    const order: UniswapXOrderDetails = {
      chainId: 1,
      routing: TradingApi.Routing.DUTCH_V2,
      status: TransactionStatus.Pending,
      encodedOrder: '0xencodedOrder',
      expiry: 1701715179,
      addedTime: 1701715079,
      orderHash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
      hash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
      from: '0xSenderAddress',
      id: 'tx123',
      transactionOriginType: TransactionOriginType.Internal,
      typeInfo: {
        isUniswapXOrder: true,
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: currencyId(DAI),
        outputCurrencyId: currencyId(WETH9[UniverseChainId.Mainnet]),
        inputCurrencyAmountRaw: '252074033564766400000',
        expectedOutputCurrencyAmountRaw: '106841079134757921',
        minimumOutputCurrencyAmountRaw: '106841079134757921',
        settledOutputCurrencyAmountRaw: '106841079134757921',
      },
    }
    const { container } = render(<OrderContent order={order} />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Order pending')
    expect(container).toHaveTextContent('Cancel order')
  })

  it('should render without error, limit order', () => {
    const order: UniswapXOrderDetails = {
      chainId: UniverseChainId.Mainnet,
      routing: TradingApi.Routing.DUTCH_LIMIT,
      status: TransactionStatus.Pending,
      encodedOrder: '0xencodedOrder',
      expiry: 1701715179,
      addedTime: 1701715079,
      orderHash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
      hash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
      from: '0xSenderAddress',
      id: 'tx123',
      transactionOriginType: TransactionOriginType.Internal,
      typeInfo: {
        isUniswapXOrder: true,
        type: TransactionType.Swap,
        tradeType: 0,
        inputCurrencyId: currencyId(DAI),
        outputCurrencyId: currencyId(WETH9[UniverseChainId.Mainnet]),
        inputCurrencyAmountRaw: '252074033564766400000',
        expectedOutputCurrencyAmountRaw: '106841079134757921',
        minimumOutputCurrencyAmountRaw: '106841079134757921',
        settledOutputCurrencyAmountRaw: '106841079134757921',
      },
    }
    const { container } = render(<OrderContent order={order} />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent('Limit pending')
    expect(container).toHaveTextContent('Cancel limit')
  })
})

function createCancellingLimitOrder(overrides?: Partial<UniswapXOrderDetails>): UniswapXOrderDetails {
  return {
    chainId: UniverseChainId.Mainnet,
    routing: TradingApi.Routing.DUTCH_LIMIT,
    status: TransactionStatus.Cancelling,
    encodedOrder: '0xencodedOrder',
    expiry: Math.floor(Date.now() / 1000) + 3600,
    addedTime: 1701715079,
    orderHash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
    hash: '0xad7a8f73f28fd0cc16459111899dd1632164ae139fcf5281a1bced56e1ff6564',
    from: '0xSenderAddress',
    id: 'tx123',
    transactionOriginType: TransactionOriginType.Internal,
    typeInfo: {
      isUniswapXOrder: true,
      type: TransactionType.Swap,
      tradeType: 0,
      inputCurrencyId: currencyId(DAI),
      outputCurrencyId: currencyId(WETH9[UniverseChainId.Mainnet]),
      inputCurrencyAmountRaw: '252074033564766400000',
      expectedOutputCurrencyAmountRaw: '106841079134757921',
      minimumOutputCurrencyAmountRaw: '106841079134757921',
      settledOutputCurrencyAmountRaw: '106841079134757921',
    },
    ...overrides,
  }
}

describe('OrderContent cancel-flow states (flag on)', () => {
  beforeEach(() => {
    ;(useFeatureFlag as Mock).mockReturnValue(true)
    ;(getFeatureFlag as Mock).mockReturnValue(true)
  })

  it('renders the timed-out alert with the double-gas line and Revert CTA', () => {
    const order = createCancellingLimitOrder({
      cancelTxHash: '0xcanceltx',
      cancelBroadcastTimeMs: Date.now() - 300_000,
      cancelTimeoutAtMs: Date.now() - 60_000,
    })
    const { container } = render(<OrderContent order={order} onRevert={() => {}} />)
    expect(container).toMatchSnapshot()
    expect(container).toHaveTextContent(
      'This cancellation is taking longer than expected and is likely to fail. To try again, revert this attempt.',
    )
    expect(container).toHaveTextContent(
      'If your original cancellation goes through after all, this transaction will still be submitted and will cost gas.',
    )
    expect(container).toHaveTextContent('Revert cancellation')
  })

  it('includes the may-not-have-been-submitted line for orphan (no-hash) records', () => {
    const order = createCancellingLimitOrder({
      cancelInitiatedTimeMs: Date.now() - 600_000,
      cancelTimeoutAtMs: Date.now() - 60_000,
    })
    const { container } = render(<OrderContent order={order} onRevert={() => {}} />)
    expect(container).toHaveTextContent('Your earlier cancellation attempt may not have been submitted.')
  })

  it('renders the finalizing state once the cancel tx has mined', () => {
    const order = createCancellingLimitOrder({
      cancelTxHash: '0xcanceltx',
      cancelTxMined: true,
    })
    const { container } = render(<OrderContent order={order} />)
    expect(container).toHaveTextContent('Cancellation confirmed, finalizing…')
    // Never optimistically final: no timed-out alert, no cancelled state
    expect(container).not.toHaveTextContent('Revert cancellation')
  })
})

describe('getOrderTitle', () => {
  beforeEach(() => {
    ;(getFeatureFlag as Mock).mockReturnValue(false)
  })

  // Tripwire: never an empty title for any reachable status, on either routing
  it.each(Object.values(TransactionStatus))('returns a non-empty title for status %s', (status) => {
    for (const routing of [TradingApi.Routing.DUTCH_LIMIT, TradingApi.Routing.DUTCH_V2] as const) {
      const order = createCancellingLimitOrder({ status, routing })
      expect(getOrderTitle({ order, t: i18n.t })).toBeTruthy()
    }
  })
})

describe('showCancelPreCheckRefusalPopup', () => {
  let addPopupSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    addPopupSpy = vi.spyOn(popupRegistry, 'addPopup').mockImplementation(() => undefined)
  })

  afterEach(() => {
    addPopupSpy.mockRestore()
  })

  it('surfaces the already-filled refusal instead of silently closing the dialog', () => {
    showCancelPreCheckRefusalPopup({
      preCheck: { kind: 'not-cancellable', orderStatus: TradingApi.OrderStatus.FILLED },
      orderId: 'order-1',
    })
    expect(addPopupSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: i18n.t('limits.cancel.alreadyFilled') }),
      'cancel-precheck-filled-order-1',
    )
  })

  it('reports a late success when the order is already CANCELLED', () => {
    showCancelPreCheckRefusalPopup({
      preCheck: { kind: 'not-cancellable', orderStatus: TradingApi.OrderStatus.CANCELLED },
      orderId: 'order-1',
    })
    expect(addPopupSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: i18n.t('limits.cancel.lateSuccess') }),
      'cancel-precheck-cancelled-order-1',
    )
  })

  it('explains an expired order and gives a neutral retry message when nothing could be built', () => {
    showCancelPreCheckRefusalPopup({
      preCheck: { kind: 'not-cancellable', orderStatus: TradingApi.OrderStatus.EXPIRED },
      orderId: 'order-1',
    })
    expect(addPopupSpy).toHaveBeenCalledWith(
      expect.objectContaining({ message: i18n.t('limits.cancel.expired') }),
      'cancel-precheck-expired-order-1',
    )

    showCancelPreCheckRefusalPopup({ preCheck: { kind: 'unavailable' }, orderId: 'order-1' })
    expect(addPopupSpy).toHaveBeenCalledWith(
      expect.objectContaining({ error: i18n.t('limits.cancel.broadcastFailed') }),
      'cancel-precheck-unavailable-order-1',
    )
  })

  it('stays silent for terminal ERROR (the pollers converge the row)', () => {
    showCancelPreCheckRefusalPopup({
      preCheck: { kind: 'not-cancellable', orderStatus: TradingApi.OrderStatus.ERROR },
      orderId: 'order-1',
    })
    expect(addPopupSpy).not.toHaveBeenCalled()
  })
})
