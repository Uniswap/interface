import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { USDC_MAINNET, USDT } from 'uniswap/src/constants/tokens'
import { AssetType } from 'uniswap/src/entities/assets'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getEarnSwapUpsellOutputCurrencyId } from 'uniswap/src/features/earn/swapUpsell'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  type BridgeTransactionInfo,
  type ExactInputSwapTransactionInfo,
  type PlanTransactionInfo,
  type SendTokenTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import {
  EARN_SWAP_UPSELL_POPUP_DELAY_MS,
  EARN_SWAP_UPSELL_POPUP_NO_AUTO_DISMISS_MS,
  getEarnSwapUpsellPopupKey,
  maybeAddEarnSwapUpsellPopup,
  resetEarnSwapUpsellPopupTrackingForTests,
} from '~/state/popups/earnSwapUpsell'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

vi.mock('~/state/popups/registry', () => ({
  popupRegistry: {
    addPopup: vi.fn(),
    hasPopup: vi.fn(() => false),
    onPopupRemoved: vi.fn(),
  },
}))

const MAINNET_ETH_CURRENCY_ID = buildNativeCurrencyId(UniverseChainId.Mainnet)
const MAINNET_USDC_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, USDC_MAINNET.address)
const MAINNET_USDT_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, USDT.address)
const MAINNET_DAI_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0x6B175474E89094C44Da98b954EedeAC495271d0F')
const INPUT_CURRENCY_ID = buildCurrencyId(UniverseChainId.Mainnet, '0x6B175474E89094C44Da98b954EedeAC495271d0F')

describe('earnSwapUpsell', () => {
  it.each([MAINNET_ETH_CURRENCY_ID, MAINNET_USDC_CURRENCY_ID, MAINNET_USDT_CURRENCY_ID])(
    'returns the canonical output currency id for successful swaps to %s',
    (outputCurrencyId) => {
      expect(
        getEarnSwapUpsellOutputCurrencyId({
          status: TransactionStatus.Success,
          typeInfo: createSwapTypeInfo({ outputCurrencyId }),
        }),
      ).toBe(outputCurrencyId)
    },
  )

  it.each([MAINNET_ETH_CURRENCY_ID, MAINNET_USDC_CURRENCY_ID, MAINNET_USDT_CURRENCY_ID])(
    'returns the canonical output currency id for successful bridge and non-Earn plan transactions to %s',
    (outputCurrencyId) => {
      expect(
        getEarnSwapUpsellOutputCurrencyId({
          status: TransactionStatus.Success,
          typeInfo: createBridgeTypeInfo({ outputCurrencyId }),
        }),
      ).toBe(outputCurrencyId)

      expect(
        getEarnSwapUpsellOutputCurrencyId({
          status: TransactionStatus.Success,
          typeInfo: createPlanTypeInfo({ outputCurrencyId }),
        }),
      ).toBe(outputCurrencyId)
    },
  )

  it('returns the canonical allowlist id for address case variants', () => {
    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Success,
        typeInfo: createSwapTypeInfo({
          outputCurrencyId: buildCurrencyId(UniverseChainId.Mainnet, '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'),
        }),
      }),
    ).toBe(MAINNET_USDC_CURRENCY_ID)
  })

  it('skips successful Earn plan transactions', () => {
    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Success,
        typeInfo: createPlanTypeInfo({
          earnAction: TradingApi.EarnAction.DEPOSIT,
        }),
      }),
    ).toBeUndefined()

    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Success,
        typeInfo: createPlanTypeInfo({
          earnAction: TradingApi.EarnAction.WITHDRAW,
        }),
      }),
    ).toBeUndefined()
  })

  it('skips opaque plan transactions that cannot be safely classified as non-Earn', () => {
    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Success,
        typeInfo: createPlanTypeInfo({
          stepDetails: [createUnknownStepDetails()],
        }),
      }),
    ).toBeUndefined()
  })

  it('skips unfinished, failed, unsupported, and malformed transactions', () => {
    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Pending,
        typeInfo: createSwapTypeInfo(),
      }),
    ).toBeUndefined()

    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Failed,
        typeInfo: createSwapTypeInfo(),
      }),
    ).toBeUndefined()

    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Success,
        typeInfo: createSendTypeInfo(),
      }),
    ).toBeUndefined()

    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Success,
        typeInfo: createSwapTypeInfo({
          outputCurrencyId: MAINNET_DAI_CURRENCY_ID,
        }),
      }),
    ).toBeUndefined()

    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Success,
        typeInfo: createSwapTypeInfo({
          outputCurrencyId: '0xnot-a-currency-id',
        }),
      }),
    ).toBeUndefined()
  })

  it('skips individual swap steps that belong to a plan', () => {
    expect(
      getEarnSwapUpsellOutputCurrencyId({
        status: TransactionStatus.Success,
        typeInfo: createSwapTypeInfo({ planId: 'plan-1' }),
      }),
    ).toBeUndefined()
  })

  it('builds a stable popup key scoped by transaction and output currency', () => {
    expect(
      getEarnSwapUpsellPopupKey({
        transactionId: 'tx-1',
        outputCurrencyId: MAINNET_USDC_CURRENCY_ID,
      }),
    ).toBe(`earn-swap-upsell-tx-1-${MAINNET_USDC_CURRENCY_ID}`)
  })
})

describe('maybeAddEarnSwapUpsellPopup', () => {
  const expectedUpsellPopupArgs = [
    {
      type: PopupType.EarnSwapUpsell,
      outputCurrencyId: MAINNET_USDC_CURRENCY_ID,
      swapAmountUsd: 123,
      transactionId: 'tx-1',
    },
    getEarnSwapUpsellPopupKey({
      outputCurrencyId: MAINNET_USDC_CURRENCY_ID,
      transactionId: 'tx-1',
    }),
    EARN_SWAP_UPSELL_POPUP_NO_AUTO_DISMISS_MS,
  ] as const

  beforeEach(() => {
    resetEarnSwapUpsellPopupTrackingForTests()
    vi.mocked(popupRegistry.addPopup).mockClear()
    vi.mocked(popupRegistry.hasPopup).mockClear().mockReturnValue(false)
    vi.mocked(popupRegistry.onPopupRemoved).mockClear()
  })

  it('registers the upsell popup for an eligible finalized swap', () => {
    maybeAddEarnSwapUpsellPopup({
      status: TransactionStatus.Success,
      typeInfo: createSwapTypeInfo(),
      transactionId: 'tx-1',
    })

    expect(popupRegistry.addPopup).toHaveBeenCalledWith(...expectedUpsellPopupArgs)
  })

  it('does not register the upsell popup when Earn is disabled', () => {
    maybeAddEarnSwapUpsellPopup({
      isEarnEnabled: false,
      status: TransactionStatus.Success,
      typeInfo: createSwapTypeInfo(),
      transactionId: 'tx-1',
    })

    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })

  it('registers the upsell popup immediately when the swap confirmation popup is not visible', () => {
    maybeAddEarnSwapUpsellPopup({
      status: TransactionStatus.Success,
      typeInfo: createSwapTypeInfo(),
      transactionId: 'tx-1',
      swapPopupKey: '0xhash',
    })

    expect(popupRegistry.onPopupRemoved).not.toHaveBeenCalledWith('0xhash', expect.any(Function))
    expect(popupRegistry.onPopupRemoved).toHaveBeenCalledWith(expectedUpsellPopupArgs[1], expect.any(Function))
    expect(popupRegistry.addPopup).toHaveBeenCalledWith(...expectedUpsellPopupArgs)
  })

  it('allows the same upsell popup key to register again after it is removed', () => {
    maybeAddEarnSwapUpsellPopup({
      status: TransactionStatus.Success,
      typeInfo: createSwapTypeInfo(),
      transactionId: 'tx-1',
    })

    const [, onRemoved] = vi.mocked(popupRegistry.onPopupRemoved).mock.calls[0]!
    onRemoved()

    maybeAddEarnSwapUpsellPopup({
      status: TransactionStatus.Success,
      typeInfo: createSwapTypeInfo(),
      transactionId: 'tx-1',
    })

    expect(popupRegistry.addPopup).toHaveBeenCalledTimes(2)
  })

  it('defers the upsell popup until the swap confirmation popup disappears plus a delay', () => {
    vi.useFakeTimers()
    try {
      vi.mocked(popupRegistry.hasPopup).mockReturnValue(true)

      maybeAddEarnSwapUpsellPopup({
        status: TransactionStatus.Success,
        typeInfo: createSwapTypeInfo(),
        transactionId: 'tx-1',
        swapPopupKey: '0xhash',
      })

      expect(popupRegistry.addPopup).not.toHaveBeenCalled()
      expect(popupRegistry.onPopupRemoved).toHaveBeenCalledWith('0xhash', expect.any(Function))

      // Simulate the swap confirmation popup being dismissed or auto-closing
      const [, onRemoved] = vi.mocked(popupRegistry.onPopupRemoved).mock.calls[0]!
      onRemoved()

      expect(popupRegistry.addPopup).not.toHaveBeenCalled()

      vi.advanceTimersByTime(EARN_SWAP_UPSELL_POPUP_DELAY_MS)

      expect(popupRegistry.addPopup).toHaveBeenCalledWith(...expectedUpsellPopupArgs)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not register duplicate deferred upsell popups for the same transaction', () => {
    vi.useFakeTimers()
    try {
      vi.mocked(popupRegistry.hasPopup).mockReturnValue(true)

      maybeAddEarnSwapUpsellPopup({
        status: TransactionStatus.Success,
        typeInfo: createSwapTypeInfo(),
        transactionId: 'tx-1',
        swapPopupKey: '0xhash',
      })
      maybeAddEarnSwapUpsellPopup({
        status: TransactionStatus.Success,
        typeInfo: createSwapTypeInfo(),
        transactionId: 'tx-1',
        swapPopupKey: '0xhash',
      })

      expect(popupRegistry.addPopup).not.toHaveBeenCalled()
      expect(popupRegistry.onPopupRemoved).toHaveBeenCalledTimes(1)

      const [, onRemoved] = vi.mocked(popupRegistry.onPopupRemoved).mock.calls[0]!
      onRemoved()
      vi.advanceTimersByTime(EARN_SWAP_UPSELL_POPUP_DELAY_MS)
    } finally {
      vi.useRealTimers()
    }
  })

  it('is a no-op for an ineligible transaction', () => {
    maybeAddEarnSwapUpsellPopup({
      status: TransactionStatus.Failed,
      typeInfo: createSwapTypeInfo(),
      transactionId: 'tx-1',
    })

    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })
})

function createSwapTypeInfo(overrides: Partial<ExactInputSwapTransactionInfo> = {}): ExactInputSwapTransactionInfo {
  return {
    type: TransactionType.Swap,
    tradeType: TradeType.EXACT_INPUT,
    transactedUSDValue: 123,
    inputCurrencyId: INPUT_CURRENCY_ID,
    outputCurrencyId: MAINNET_USDC_CURRENCY_ID,
    inputCurrencyAmountRaw: '100',
    expectedOutputCurrencyAmountRaw: '100',
    minimumOutputCurrencyAmountRaw: '99',
    ...overrides,
  }
}

function createBridgeTypeInfo(overrides: Partial<BridgeTransactionInfo> = {}): BridgeTransactionInfo {
  return {
    type: TransactionType.Bridge,
    inputCurrencyId: INPUT_CURRENCY_ID,
    inputCurrencyAmountRaw: '100',
    outputCurrencyId: MAINNET_USDC_CURRENCY_ID,
    outputCurrencyAmountRaw: '100',
    ...overrides,
  }
}

function createPlanTypeInfo(overrides: Partial<PlanTransactionInfo> = {}): PlanTransactionInfo {
  return {
    type: TransactionType.Plan,
    planId: 'plan-1',
    planStatus: undefined,
    stepDetails: [],
    tokenOutChainId: UniverseChainId.Mainnet,
    inputCurrencyId: INPUT_CURRENCY_ID,
    outputCurrencyId: MAINNET_USDC_CURRENCY_ID,
    inputCurrencyAmountRaw: '100',
    outputCurrencyAmountRaw: '100',
    tradeType: TradeType.EXACT_INPUT,
    ...overrides,
  }
}

function createUnknownStepDetails(): PlanTransactionInfo['stepDetails'][number] {
  return {
    routing: TradingApi.Routing.CHAINED,
    id: 'plan-1-step-1',
    chainId: UniverseChainId.Mainnet,
    status: TransactionStatus.Success,
    addedTime: 1,
    from: '0x0000000000000000000000000000000000000001',
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
    typeInfo: {
      type: TransactionType.Unknown,
    },
  } as PlanTransactionInfo['stepDetails'][number]
}

function createSendTypeInfo(): SendTokenTransactionInfo {
  return {
    type: TransactionType.Send,
    assetType: AssetType.Currency,
    recipient: '0xrecipient',
    tokenAddress: '0xtoken',
  }
}
