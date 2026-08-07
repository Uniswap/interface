import { Token } from '@uniswap/sdk-core'
import { FetchError, TradingApi } from '@universe/api'
import i18next from 'i18next'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSwapWarningFromError } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getSwapWarningFromError'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'

const { mockLoggerWarn } = vi.hoisted(() => ({
  mockLoggerWarn: vi.fn(),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

const ANY_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

const createCurrencyInfo = (symbol: string, chainId = UniverseChainId.Mainnet): CurrencyInfo =>
  ({
    currency: new Token(chainId, ANY_ADDRESS, 18, symbol),
    currencyId: `${chainId}-${ANY_ADDRESS}`,
    logoUrl: null,
    safetyInfo: undefined,
  }) as unknown as CurrencyInfo

const createDerivedSwapInfo = (input: CurrencyInfo | undefined, output: CurrencyInfo | undefined): DerivedSwapInfo =>
  ({
    currencies: {
      [CurrencyField.INPUT]: input,
      [CurrencyField.OUTPUT]: output,
    },
  }) as unknown as DerivedSwapInfo

const makeFetchError = ({ status, data }: { status: number; data?: { errorCode?: string } }): FetchError =>
  new FetchError({ response: new Response(null, { status }), data: data ?? {} })

const make429Error = (): FetchError => makeFetchError({ status: 429 })

describe('getSwapWarningFromError', () => {
  const t = i18next.t.bind(i18next)
  const sameChainInfo = createDerivedSwapInfo(createCurrencyInfo('FOO'), createCurrencyInfo('BAR'))
  const bridgeInfo = createDerivedSwapInfo(
    createCurrencyInfo('FOO', UniverseChainId.Mainnet),
    createCurrencyInfo('BAR', UniverseChainId.ArbitrumOne),
  )

  beforeEach(() => {
    mockLoggerWarn.mockClear()
  })

  it('returns RateLimit warning for a rate-limited FetchError', () => {
    const result = getSwapWarningFromError({ error: make429Error(), t, derivedSwapInfo: sameChainInfo })

    expect(result.type).toBe(WarningLabel.RateLimit)
    expect(result.severity).toBe(WarningSeverity.Medium)
    expect(result.action).toBe(WarningAction.DisableReview)
  })

  it('returns EnterLargerAmount warning for QUOTE_AMOUNT_TOO_LOW_ERROR', () => {
    const error = makeFetchError({
      status: 404,
      data: { errorCode: TradingApi.Err404.errorCode.QUOTE_AMOUNT_TOO_LOW_ERROR },
    })

    const result = getSwapWarningFromError({ error, t, derivedSwapInfo: sameChainInfo })

    expect(result.type).toBe(WarningLabel.EnterLargerAmount)
    expect(result.action).toBe(WarningAction.DisableReview)
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })

  it('returns NoRoutesError warning for RESOURCE_NOT_FOUND on a same-chain swap', () => {
    const error = makeFetchError({
      status: 404,
      data: { errorCode: TradingApi.Err404.errorCode.RESOURCE_NOT_FOUND },
    })

    const result = getSwapWarningFromError({ error, t, derivedSwapInfo: sameChainInfo })

    expect(result.type).toBe(WarningLabel.NoRoutesError)
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })

  it('returns NoQuotesFound warning for RESOURCE_NOT_FOUND on a bridge swap', () => {
    const error = makeFetchError({
      status: 404,
      data: { errorCode: TradingApi.Err404.errorCode.RESOURCE_NOT_FOUND },
    })

    const result = getSwapWarningFromError({ error, t, derivedSwapInfo: bridgeInfo })

    expect(result.type).toBe(WarningLabel.NoQuotesFound)
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })

  it('returns SwapRouterError fallback for a FetchError with no errorCode (e.g. 403 anomaly)', () => {
    const error = makeFetchError({ status: 403 })

    const result = getSwapWarningFromError({ error, t, derivedSwapInfo: sameChainInfo })

    expect(result.type).toBe(WarningLabel.SwapRouterError)
    // No telemetry here: the unmapped-errorCode log only fires when an errorCode IS present.
    // The 403-anomaly telemetry lives in useSwapWarnings, not in this mapper.
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })

  it('returns SwapRouterError + telemetry for an unmapped errorCode', () => {
    const error = makeFetchError({ status: 500, data: { errorCode: 'SOMETHING_UNEXPECTED' } })

    const result = getSwapWarningFromError({ error, t, derivedSwapInfo: sameChainInfo })

    expect(result.type).toBe(WarningLabel.SwapRouterError)
    expect(mockLoggerWarn).toHaveBeenCalledTimes(1)
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      'TradingApi',
      'getSwapWarningFromError',
      'Unmapped errorCode in trading-api response',
      expect.objectContaining({ errorCode: 'SOMETHING_UNEXPECTED' }),
    )
  })

  it('returns SwapRouterError fallback for a non-FetchError', () => {
    const result = getSwapWarningFromError({ error: new Error('boom'), t, derivedSwapInfo: sameChainInfo })

    expect(result.type).toBe(WarningLabel.SwapRouterError)
    expect(mockLoggerWarn).not.toHaveBeenCalled()
  })
})
