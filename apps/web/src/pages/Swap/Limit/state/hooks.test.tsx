import { renderHook } from '@testing-library/react'
import { type Currency, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { LimitsExpiry } from 'uniswap/src/types/limits'
import { currencyId } from 'uniswap/src/utils/currencyId'
import type { CurrencyState } from '~/features/Swap/state/types'
import { useDerivedLimitInfo } from '~/pages/Swap/Limit/state/hooks'
import type { LimitState } from '~/pages/Swap/Limit/state/types'

const mocks = vi.hoisted(() => ({
  currencyState: { inputCurrency: undefined, outputCurrency: undefined } as CurrencyState,
}))

vi.mock('~/features/Swap/state/useSwapContext', () => ({
  useSwapAndLimitContext: () => ({
    currencyState: mocks.currencyState,
    setCurrencyState: vi.fn(),
    currentTab: 'limit',
    setCurrentTab: vi.fn(),
  }),
}))
vi.mock('~/hooks/useAccount', () => ({
  useAccount: () => ({ address: '0x0000000000000000000000000000000000000abc' }),
}))
vi.mock('~/lib/hooks/useCurrencyBalance', () => ({
  useCurrencyBalances: () => [undefined, undefined],
}))
vi.mock('uniswap/src/features/transactions/swap/hooks/useTrade', () => ({
  useTrade: () => ({ trade: undefined }),
}))
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCPrice: () => ({ price: undefined, isLoading: false, isStaleRefreshing: false }),
}))
vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: () => false,
}))
vi.mock('~/state/routing/gas', () => ({
  getWrapInfo: vi.fn(async () => ({ needsWrap: false })),
}))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: vi.fn(),
}))

const mockedUseCurrencyInfo = vi.mocked(useCurrencyInfo)

const TOKEN_ADDRESS = '0x0000000000000000000000000000000000000001'
// What the token selector hands over for a mainnet deployment built from a v2 multichain token: the
// parent's 6 decimals, where the deployment itself has 2 (the IDRT shape). Single-chain GetToken returns 2.
const MULTICHAIN_TOKEN = new Token(UniverseChainId.Mainnet, TOKEN_ADDRESS, 6, 'IDRT', 'Rupiah Token')
const GET_TOKEN_TOKEN = new Token(UniverseChainId.Mainnet, TOKEN_ADDRESS, 2, 'IDRT', 'Rupiah Token')

function mockResolvedCurrencies(resolved: Currency[]): void {
  mockedUseCurrencyInfo.mockImplementation((id) => {
    const currency = resolved.find((c) => currencyId(c) === id)
    return currency ? ({ currency } as CurrencyInfo) : undefined
  })
}

// Sell 100 IDRT at a user-typed price of 0.5 USDC per IDRT.
const limitState: LimitState = {
  inputAmount: '100',
  outputAmount: '',
  limitPrice: '0.5',
  limitPriceEdited: true,
  limitPriceInverted: false,
  expiry: LimitsExpiry.Week,
  isInputAmountFixed: true,
}

describe('useDerivedLimitInfo currency resolution', () => {
  beforeEach(() => {
    mockedUseCurrencyInfo.mockReset()
    mocks.currencyState = { inputCurrency: MULTICHAIN_TOKEN, outputCurrency: USDC_MAINNET }
  })

  it('parses amounts and the limit price with the per-chain decimals, not the decimals the selector handed over', () => {
    mockResolvedCurrencies([GET_TOKEN_TOKEN, USDC_MAINNET])

    const { result } = renderHook(() => useDerivedLimitInfo(limitState))

    expect(mockedUseCurrencyInfo).toHaveBeenCalledWith(`1-${TOKEN_ADDRESS}`)
    expect(result.current.currencies[CurrencyField.INPUT]?.decimals).toBe(2)
    expect(result.current.currencies[CurrencyField.OUTPUT]).toBe(USDC_MAINNET)

    // 100 IDRT is 10_000 raw units. The selector's 6 decimals would have made it 100_000_000, i.e. 1,000,000 IDRT.
    const parsedInput = result.current.parsedAmounts[CurrencyField.INPUT]
    expect(parsedInput?.quotient.toString()).toBe('10000')
    expect(parsedInput?.currency.decimals).toBe(2)

    expect(result.current.parsedLimitPrice?.baseCurrency.decimals).toBe(2)
    expect(result.current.parsedLimitPrice?.toSignificant(6)).toBe('0.5')
    // 100 IDRT * 0.5 USDC = 50 USDC
    expect(result.current.parsedAmounts[CurrencyField.OUTPUT]?.quotient.toString()).toBe('50000000')
  })

  it('withholds a leg, and everything derived from it, while its per-chain currency is still resolving', () => {
    mockResolvedCurrencies([USDC_MAINNET])

    const { result } = renderHook(() => useDerivedLimitInfo(limitState))

    expect(result.current.currencies[CurrencyField.INPUT]).toBeUndefined()
    expect(result.current.currencies[CurrencyField.OUTPUT]).toBe(USDC_MAINNET)
    expect(result.current.parsedAmounts[CurrencyField.INPUT]).toBeUndefined()
    expect(result.current.parsedAmounts[CurrencyField.OUTPUT]).toBeUndefined()
    expect(result.current.parsedLimitPrice).toBeUndefined()
    expect(result.current.limitOrderTrade).toBeUndefined()
  })

  it('never falls back to the selector currency when GetToken does not know the token', () => {
    mockResolvedCurrencies([])

    const { result } = renderHook(() => useDerivedLimitInfo(limitState))

    expect(result.current.currencies).toEqual({ [CurrencyField.INPUT]: undefined, [CurrencyField.OUTPUT]: undefined })
    expect(result.current.parsedAmounts[CurrencyField.INPUT]).toBeUndefined()
  })
})
