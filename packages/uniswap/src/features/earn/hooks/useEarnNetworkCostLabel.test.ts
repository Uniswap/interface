import { renderHook } from '@testing-library/react'
import { type ChainedQuoteResponse, FeeType, TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEarnNetworkCostLabel } from 'uniswap/src/features/earn/hooks/useEarnNetworkCostLabel'
import { NumberType } from 'utilities/src/format/types'

const mocks = vi.hoisted(() => ({
  convertGasFeeToDisplayValue: vi.fn(({ gasFee }: { gasFee: string | undefined }) =>
    gasFee ? `display-${gasFee}` : undefined,
  ),
  // Always-USD formatter — the bug this suite guards against is the quote-level branch using this.
  formatNumberOrString: vi.fn(({ value }: { value: number }) => `$${value.toFixed(2)}`),
  // Simulates a non-USD selected fiat currency (e.g. JPY): converts the USD input and
  // formats with the user's currency symbol.
  convertFiatAmountFormatted: vi.fn((value: number) => `¥${value.toFixed(2)}`),
  useUSDValueOfGasFee: vi.fn((): { isLoading: boolean; value: string | undefined } => ({
    isLoading: false,
    value: undefined,
  })),
}))

vi.mock('uniswap/src/features/gas/convertGasFeeToDisplayValue', () => ({
  convertGasFeeToDisplayValue: mocks.convertGasFeeToDisplayValue,
}))

vi.mock('uniswap/src/features/gas/hooks', () => ({
  useUSDValueOfGasFee: mocks.useUSDValueOfGasFee,
}))

vi.mock('uniswap/src/features/language/LocalizationContext', () => ({
  useLocalizationContext: () => ({
    formatNumberOrString: mocks.formatNumberOrString,
    convertFiatAmountFormatted: mocks.convertFiatAmountFormatted,
  }),
}))

const ACCOUNT = '0x0000000000000000000000000000000000000001' as Address
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Address
const VAULT = '0x0000000000000000000000000000000000000002' as Address
const AGGREGATE_GAS_FEE = '1000000000000000'
const STEP_GAS_FEE = '999'

type ChainedQuoteOverrides = Partial<ChainedQuoteResponse['quote']> & {
  gasFeeUsd?: string
}

function createQuote(overrides: ChainedQuoteOverrides = {}): ChainedQuoteResponse {
  const quote: ChainedQuoteResponse['quote'] = {
    input: { amount: '1000000', token: USDC },
    output: {
      amount: '1000000',
      token: VAULT,
      recipient: ACCOUNT,
    },
    swapper: ACCOUNT,
    tokenInChainId: TradingApi.ChainId._1,
    tokenOutChainId: TradingApi.ChainId._1,
    tradeType: TradingApi.TradeType.EXACT_INPUT,
    quoteId: 'quote-1',
    gasFee: AGGREGATE_GAS_FEE,
    gasFeeUSD: '1.23',
    gasFeeQuote: '1.23',
    gasUseEstimate: '21000',
    timeEstimateMs: 0,
    gasStrategies: [],
    steps: [],
    gasEstimates: [
      {
        type: FeeType.EIP1559,
        gasFee: STEP_GAS_FEE,
        gasLimit: '21000',
        maxFeePerGas: '1000',
        maxPriorityFeePerGas: '100',
        strategy: {
          limitInflationFactor: 1.5,
          displayLimitInflationFactor: 1.2,
          priceInflationFactor: 1,
          percentileThresholdFor1559Fee: 75,
        },
      },
    ],
    ...overrides,
  }

  return {
    routing: TradingApi.Routing.CHAINED,
    requestId: 'request-1',
    permitData: null,
    quote,
  }
}

describe(useEarnNetworkCostLabel, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useUSDValueOfGasFee.mockReturnValue({ isLoading: false, value: undefined })
  })

  it('converts the quote-level gasFeeUSD to the selected fiat currency instead of formatting raw USD', () => {
    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({ gasFeeUSD: '1.23' }),
      }),
    )

    expect(result.current).toBe('¥1.23')
    expect(mocks.convertFiatAmountFormatted).toHaveBeenCalledWith(1.23, NumberType.FiatStandard)
    expect(mocks.formatNumberOrString).not.toHaveBeenCalled()
  })

  it('reads lowercase gasFeeUsd from live REST responses', () => {
    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Base,
        isLoading: false,
        quote: createQuote({
          gasFeeUSD: undefined,
          gasFeeUsd: '3.632063379535792',
          tokenInChainId: TradingApi.ChainId._8453,
          tokenOutChainId: TradingApi.ChainId._1,
        }),
      }),
    )

    expect(result.current).toBe('¥3.63')
    expect(mocks.convertFiatAmountFormatted).toHaveBeenCalledWith(3.632063379535792, NumberType.FiatStandard)
    expect(mocks.useUSDValueOfGasFee).toHaveBeenCalledWith(undefined, undefined)
  })

  it('prefers the quote-level gasFeeUSD over the locally-converted fallback', () => {
    mocks.useUSDValueOfGasFee.mockReturnValue({ isLoading: false, value: '9.99' })

    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({ gasFeeUSD: '1.23' }),
      }),
    )

    expect(result.current).toBe('¥1.23')
    // Local conversion is disabled when the quote already carries a USD value.
    expect(mocks.useUSDValueOfGasFee).toHaveBeenCalledWith(undefined, undefined)
  })

  it('falls back to local conversion when gasFeeUSD is not a finite number', () => {
    mocks.useUSDValueOfGasFee.mockReturnValue({ isLoading: false, value: '2.5' })

    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({ gasFeeUSD: 'not-a-number' }),
      }),
    )

    expect(result.current).toBe('¥2.50')
  })

  it('converts the aggregate quote-level gasFee (not the first per-step estimate) when gasFeeUSD is missing', () => {
    renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({ gasFeeUSD: undefined }),
      }),
    )

    expect(mocks.convertGasFeeToDisplayValue).toHaveBeenCalledWith({
      gasFee: AGGREGATE_GAS_FEE,
      gasStrategy: expect.objectContaining({ displayLimitInflationFactor: 1 }),
    })
    expect(mocks.convertGasFeeToDisplayValue).not.toHaveBeenCalledWith(
      expect.objectContaining({ gasFee: STEP_GAS_FEE }),
    )
    expect(mocks.useUSDValueOfGasFee).toHaveBeenCalledWith(UniverseChainId.Mainnet, `display-${AGGREGATE_GAS_FEE}`)
  })

  it('does not convert the native fee for a cross-chain quote without gasFeeUSD', () => {
    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({
          gasFeeUSD: undefined,
          tokenOutChainId: TradingApi.ChainId._8453,
        }),
      }),
    )

    expect(result.current).toBe('—')
    expect(mocks.useUSDValueOfGasFee).toHaveBeenCalledWith(undefined, undefined)
  })

  it('does not use per-step gas estimates when aggregate quote-level gasFee is missing', () => {
    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({ gasFee: undefined, gasFeeUSD: undefined }),
      }),
    )

    expect(result.current).toBe('—')
    expect(mocks.convertGasFeeToDisplayValue).not.toHaveBeenCalled()
  })

  it('shows the loader (not a native-token amount) while converting a same-chain fee without gasFeeUSD', () => {
    mocks.useUSDValueOfGasFee.mockReturnValue({ isLoading: true, value: undefined })

    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({ gasFeeUSD: undefined }),
      }),
    )

    expect(result.current).toBeUndefined()
  })

  it('converts the locally-computed USD value to the selected fiat currency for same-chain quotes without gasFeeUSD', () => {
    mocks.useUSDValueOfGasFee.mockReturnValue({ isLoading: false, value: '2.5' })

    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({ gasFeeUSD: undefined }),
      }),
    )

    expect(result.current).toBe('¥2.50')
    expect(mocks.convertFiatAmountFormatted).toHaveBeenCalledWith(2.5, NumberType.FiatStandard)
  })

  it('never falls back to a native-token amount when no USD value resolves', () => {
    mocks.useUSDValueOfGasFee.mockReturnValue({ isLoading: false, value: undefined })

    const { result } = renderHook(() =>
      useEarnNetworkCostLabel({
        chainId: UniverseChainId.Mainnet,
        isLoading: false,
        quote: createQuote({ gasFeeUSD: undefined }),
      }),
    )

    expect(result.current).toBe('—')
  })
})
