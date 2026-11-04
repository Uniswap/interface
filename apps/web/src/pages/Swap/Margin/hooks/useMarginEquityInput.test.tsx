import { act, renderHook } from '@testing-library/react'
import { type Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { MarginFormStoreContextProvider } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/MarginFormStoreContextProvider'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import { MarginDirection, type MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MARGIN_CHAIN_ID, type MarginMarket, type MarginTokenInfo, USDC, WETH } from '~/constants/margin'
import {
  getMarketDefaultPaymentToken,
  getPaymentCurrency,
  isPaymentTokenDifferentFromCollateral,
} from '~/features/margin/utils/marginCurrencies'
import { useMarginEquityInput } from '~/pages/Swap/Margin/hooks/useMarginEquityInput'

const WBTC: MarginTokenInfo = { address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', symbol: 'WBTC', decimals: 8 }

const ETH_MARKET: MarginMarket = {
  key: 'weth-usdc-MORPHO',
  asset: 'ETH',
  name: 'Ethereum',
  displaySymbol: 'ETH',
  collateral: WETH,
  debt: USDC,
  venue: 'MORPHO',
  direction: MarginDirection.LONG,
  lltvWad: '860000000000000000',
  shouldUseNativeEquity: true,
}
const WBTC_MARKET: MarginMarket = {
  ...ETH_MARKET,
  key: 'wbtc-usdc-MORPHO',
  asset: 'BTC',
  name: 'Bitcoin',
  displaySymbol: 'WBTC',
  collateral: WBTC,
  shouldUseNativeEquity: false,
}

const USDC_PAY: MarginPaymentToken = { ...USDC, isNative: false, chainId: MARGIN_CHAIN_ID }
const WBTC_PAY: MarginPaymentToken = { ...WBTC, isNative: false, chainId: MARGIN_CHAIN_ID }
const ETH_PAY = getMarketDefaultPaymentToken(ETH_MARKET)
// A bridge-source pay token: the price service quotes it in Base's USDC, not mainnet's.
const BASE_USDC_PAY: MarginPaymentToken = {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  symbol: 'USDC',
  decimals: 6,
  isNative: false,
  chainId: UniverseChainId.Base,
}

const idOf = (token: MarginPaymentToken): string => currencyId(getPaymentCurrency(token))

const { servicePrices, rawBalances } = vi.hoisted(() => ({
  // currencyId → the price service's whole-dollar USD figure.
  servicePrices: new Map<string, number>(),
  // currencyId → raw wallet balance.
  rawBalances: new Map<string, string>(),
}))

// The shape useUSDCPrice returns: a Price of the currency in its own chain's primary stablecoin.
vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', async () => {
  const { currencyId: toId } = await import('uniswap/src/utils/currencyId')
  const { getPrimaryStablecoin } = await import('uniswap/src/features/chains/utils')
  return {
    useUSDCPrice: (currency?: Currency) => {
      const usd = currency ? servicePrices.get(toId(currency)) : undefined
      if (!currency || usd === undefined) {
        return { price: undefined, isLoading: false }
      }
      const stablecoin = getPrimaryStablecoin(currency.chainId)
      const price = new Price(
        currency,
        stablecoin,
        (10n ** BigInt(currency.decimals)).toString(),
        (BigInt(usd) * 10n ** BigInt(stablecoin.decimals)).toString(),
      )
      return { price, isLoading: false }
    },
  }
})

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))

function setUsdPrices(prices: [MarginPaymentToken, number][]): void {
  for (const [token, usd] of prices) {
    servicePrices.set(idOf(token), usd)
  }
}

// Mirrors what useDerivedMarginInfo hands the hook: the stored pay token (or the market default), its
// currency, and its wallet balance.
function useHarness(market: MarginMarket) {
  const { storedPaymentToken, marginAmount } = useMarginFormStore((s) => ({
    storedPaymentToken: s.paymentToken,
    marginAmount: s.marginAmount,
  }))
  const { setMarginFormState } = useMarginFormStoreActions()
  const paymentToken = storedPaymentToken ?? getMarketDefaultPaymentToken(market)
  const paymentCurrency = getPaymentCurrency(paymentToken)
  const raw = rawBalances.get(currencyId(paymentCurrency))
  const input = useMarginEquityInput({
    derivedMarginInfo: {
      market,
      paymentToken,
      paymentCurrency,
      balance: raw === undefined ? undefined : CurrencyAmount.fromRawAmount(paymentCurrency, raw),
      isPaymentDifferentFromCollateral: isPaymentTokenDifferentFromCollateral({ token: paymentToken, market }),
    },
  })
  return { input, marginAmount, setMarginFormState }
}

function renderInput({
  market = ETH_MARKET,
  paymentToken,
}: { market?: MarginMarket; paymentToken?: MarginPaymentToken } = {}) {
  const wrapper = ({ children }: PropsWithChildren) => (
    <MarginFormStoreContextProvider initialState={{ paymentToken }}>{children}</MarginFormStoreContextProvider>
  )
  return renderHook(() => useHarness(market), { wrapper })
}

describe('useMarginEquityInput', () => {
  afterEach(() => {
    servicePrices.clear()
    rawBalances.clear()
  })

  it('passes the typed amount straight through when paying with the collateral', () => {
    const { result } = renderInput()

    act(() => result.current.input.onSetExactAmount('1.5'))

    expect(result.current.marginAmount).toBe('1.5')
    expect(result.current.input.value).toBe('1.5')
    expect(result.current.input.equityCurrencyInfo.currency.isNative).toBe(true)
  })

  it('reads in the collateral and writes the pay-token equivalent when paying with another token', () => {
    setUsdPrices([
      [ETH_PAY, 4000],
      [USDC_PAY, 1],
    ])
    const { result } = renderInput({ paymentToken: USDC_PAY })

    act(() => result.current.input.onSetExactAmount('1.5'))

    expect(result.current.input.value).toBe('1.5')
    expect(result.current.input.currencyAmount?.currency.isNative).toBe(true)
    expect(result.current.marginAmount).toBe('6000')
  })

  it('truncates the pay-token amount to its decimals rather than rounding it up', () => {
    setUsdPrices([
      [ETH_PAY, 4000],
      [WBTC_PAY, 100000],
    ])
    const { result } = renderInput({ paymentToken: WBTC_PAY })

    // 0.1234567 ETH × 4000 / 100000 = 0.004938268 WBTC: 8 places keep 0.00493826, never 0.00493827.
    act(() => result.current.input.onSetExactAmount('0.1234567'))

    expect(result.current.marginAmount).toBe('0.00493826')
  })

  it('takes presets and Max in exact pay units, so Max never exceeds the balance', () => {
    setUsdPrices([
      [ETH_PAY, 3000],
      [USDC_PAY, 1],
    ])
    rawBalances.set(idOf(USDC_PAY), '10000123456') // 10000.123456 USDC
    const { result } = renderInput({ paymentToken: USDC_PAY })

    // 10000.123456 / 3000 = 3.333374485333…: floored to ETH's 18 places, never rounded up past the balance.
    expect(result.current.input.balance?.toExact()).toBe('3.333374485333333333')

    act(() => result.current.input.onSetPresetValue('ignored', 25))
    expect(result.current.marginAmount).toBe('2500.030864')
    expect(result.current.input.value).toBe('0.833343621333333333')

    act(() => result.current.input.onSetPresetValue('ignored', 'max'))
    expect(result.current.marginAmount).toBe('10000.123456')
    expect(result.current.input.value).toBe('3.333374485333333333')
    const { currencyAmount, balance } = result.current.input
    expect(currencyAmount && balance && currencyAmount.greaterThan(balance)).toBe(false)
  })

  it('takes Max off the gas-reserved native balance, restated without a second reserve', () => {
    // Paying with ETH on the WBTC market.
    setUsdPrices([
      [WBTC_PAY, 100000],
      [ETH_PAY, 4000],
    ])
    rawBalances.set(idOf(ETH_PAY), (10n ** 18n).toString()) // 1 ETH, 0.01 of it reserved for gas
    const { result } = renderInput({ market: WBTC_MARKET, paymentToken: ETH_PAY })

    expect(result.current.input.balance?.toExact()).toBe('0.0396') // 0.99 ETH × 4000 / 100000

    act(() => result.current.input.onSetPresetValue('ignored', 'max'))
    expect(result.current.marginAmount).toBe('0.99')
    expect(result.current.input.value).toBe('0.0396')
  })

  it('keeps the typed collateral across a Pay with switch and re-prices it into the new token', () => {
    setUsdPrices([
      [ETH_PAY, 4000],
      [USDC_PAY, 1],
      [WBTC_PAY, 100000],
    ])
    const { result } = renderInput({ paymentToken: USDC_PAY })
    act(() => result.current.input.onSetExactAmount('1'))
    expect(result.current.marginAmount).toBe('4000')

    act(() => result.current.input.selectPaymentToken(WBTC_PAY))

    expect(result.current.input.value).toBe('1')
    expect(result.current.marginAmount).toBe('0.04')

    // Back to the collateral: a pass-through again, carrying the same amount.
    act(() => result.current.input.selectPaymentToken(undefined))
    expect(result.current.marginAmount).toBe('1')
    expect(result.current.input.value).toBe('1')
  })

  it('writes nothing while a price is missing, then prices the held amount once both arrive', () => {
    const { result, rerender } = renderInput({ paymentToken: USDC_PAY })

    act(() => result.current.input.onSetExactAmount('1'))

    expect(result.current.marginAmount).toBe('')
    expect(result.current.input.value).toBe('1')
    expect(result.current.input.balance).toBeUndefined()

    setUsdPrices([
      [ETH_PAY, 4000],
      [USDC_PAY, 1],
    ])
    rerender()
    expect(result.current.marginAmount).toBe('4000')

    // A later tick re-prices nothing: the stored amount, and so the quote key, holds.
    setUsdPrices([[ETH_PAY, 4100]])
    rerender()
    expect(result.current.marginAmount).toBe('4000')
    expect(result.current.input.value).toBe('1')
  })

  it('clears a preset amount when a new figure is typed while a price is missing', () => {
    rawBalances.set(idOf(USDC_PAY), '10000000000') // 10000 USDC
    const { result, rerender } = renderInput({ paymentToken: USDC_PAY })
    act(() => result.current.input.onSetPresetValue('ignored', 25))
    expect(result.current.marginAmount).toBe('2500')

    act(() => result.current.input.onSetExactAmount('1'))

    // The preset's pay amount must not be quoted under the newly typed collateral figure.
    expect(result.current.marginAmount).toBe('')
    expect(result.current.input.value).toBe('1')

    setUsdPrices([
      [ETH_PAY, 4000],
      [USDC_PAY, 1],
    ])
    rerender()
    expect(result.current.marginAmount).toBe('4000')
  })

  it('drops the typed figure when marginAmount is reset from outside', () => {
    setUsdPrices([
      [ETH_PAY, 4000],
      [USDC_PAY, 1],
    ])
    const { result } = renderInput({ paymentToken: USDC_PAY })
    act(() => result.current.input.onSetExactAmount('1'))

    // What a finished plan does.
    act(() => result.current.setMarginFormState({ activePlanId: undefined, marginAmount: '' }))

    expect(result.current.input.value).toBe('')
  })

  // Each price quotes in its own chain's stablecoin; bridged at par rather than throwing on the mismatch.
  it('restates a bridge-source pay token priced in its own chain stablecoin', () => {
    setUsdPrices([
      [ETH_PAY, 4000],
      [BASE_USDC_PAY, 1],
    ])
    rawBalances.set(idOf(BASE_USDC_PAY), '8000000000') // 8000 USDC on Base
    const { result } = renderInput({ paymentToken: BASE_USDC_PAY })

    expect(result.current.input.balance?.toExact()).toBe('2')
    act(() => result.current.input.onSetExactAmount('1.5'))
    expect(result.current.marginAmount).toBe('6000')
  })
})
