import { renderHook } from '@testing-library/react'
import { Percent } from '@uniswap/sdk-core'
import { mocked } from 'test-utils/mocked'
import { Currency } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DEFAULT_LOCAL_CURRENCY, FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
import { Locale } from 'uniswap/src/features/language/constants'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { NumberType, useFormatter } from 'utils/formatNumbers'

jest.mock('uniswap/src/features/language/hooks')
jest.mock('uniswap/src/features/fiatCurrency/hooks')

describe('formatNumber', () => {
  it('formats token reference numbers correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567000000000, type: NumberType.TokenNonTx })).toBe('>999T')
    expect(formatNumber({ input: 1002345, type: NumberType.TokenNonTx })).toBe('1.00M')
    expect(formatNumber({ input: 1234, type: NumberType.TokenNonTx })).toBe('1,234.00')
    expect(formatNumber({ input: 0.00909, type: NumberType.TokenNonTx })).toBe('0.009')
    expect(formatNumber({ input: 0.09001, type: NumberType.TokenNonTx })).toBe('0.090')
    expect(formatNumber({ input: 0.00099, type: NumberType.TokenNonTx })).toBe('<0.001')
    expect(formatNumber({ input: 0, type: NumberType.TokenNonTx })).toBe('0')
  })

  it('formats token reference numbers correctly with Dutch locale', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.DutchNetherlands)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567000000000, type: NumberType.TokenNonTx })).toBe('>999\xa0bln.')
    expect(formatNumber({ input: 1002345, type: NumberType.TokenNonTx })).toBe('1,00\xa0mln.')
    expect(formatNumber({ input: 1234, type: NumberType.TokenNonTx })).toBe('1.234,00')
    expect(formatNumber({ input: 0.00909, type: NumberType.TokenNonTx })).toBe('0,009')
    expect(formatNumber({ input: 0.09001, type: NumberType.TokenNonTx })).toBe('0,090')
    expect(formatNumber({ input: 0.00099, type: NumberType.TokenNonTx })).toBe('<0,001')
    expect(formatNumber({ input: 0, type: NumberType.TokenNonTx })).toBe('0')
  })

  it('formats token transaction numbers correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.8901, type: NumberType.TokenTx })).toBe('1,234,567.89')
    expect(formatNumber({ input: 765432.1, type: NumberType.TokenTx })).toBe('765,432.10')

    expect(formatNumber({ input: 7654.321, type: NumberType.TokenTx })).toBe('7,654.32')
    expect(formatNumber({ input: 765.4321, type: NumberType.TokenTx })).toBe('765.432')
    expect(formatNumber({ input: 76.54321, type: NumberType.TokenTx })).toBe('76.5432')
    expect(formatNumber({ input: 7.654321, type: NumberType.TokenTx })).toBe('7.65432')
    expect(formatNumber({ input: 7.60000054321, type: NumberType.TokenTx })).toBe('7.60')
    expect(formatNumber({ input: 7.6, type: NumberType.TokenTx })).toBe('7.60')
    expect(formatNumber({ input: 7, type: NumberType.TokenTx })).toBe('7.00')

    expect(formatNumber({ input: 0.987654321, type: NumberType.TokenTx })).toBe('0.98765')
    expect(formatNumber({ input: 0.9, type: NumberType.TokenTx })).toBe('0.90')
    expect(formatNumber({ input: 0.901000123, type: NumberType.TokenTx })).toBe('0.901')
    expect(formatNumber({ input: 0.000000001, type: NumberType.TokenTx })).toBe('<0.00001')
    expect(formatNumber({ input: 0, type: NumberType.TokenTx })).toBe('0')
  })

  it('formats token transaction numbers correctly with russian locale', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.RussianRussia)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.8901, type: NumberType.TokenTx })).toBe('1\xa0234\xa0567,89')
    expect(formatNumber({ input: 765432.1, type: NumberType.TokenTx })).toBe('765\xa0432,10')

    expect(formatNumber({ input: 7654.321, type: NumberType.TokenTx })).toBe('7\xa0654,32')
    expect(formatNumber({ input: 765.4321, type: NumberType.TokenTx })).toBe('765,432')
    expect(formatNumber({ input: 76.54321, type: NumberType.TokenTx })).toBe('76,5432')
    expect(formatNumber({ input: 7.654321, type: NumberType.TokenTx })).toBe('7,65432')
    expect(formatNumber({ input: 7.60000054321, type: NumberType.TokenTx })).toBe('7,60')
    expect(formatNumber({ input: 7.6, type: NumberType.TokenTx })).toBe('7,60')
    expect(formatNumber({ input: 7, type: NumberType.TokenTx })).toBe('7,00')

    expect(formatNumber({ input: 0.987654321, type: NumberType.TokenTx })).toBe('0,98765')
    expect(formatNumber({ input: 0.9, type: NumberType.TokenTx })).toBe('0,90')
    expect(formatNumber({ input: 0.901000123, type: NumberType.TokenTx })).toBe('0,901')
    expect(formatNumber({ input: 0.000000001, type: NumberType.TokenTx })).toBe('<0,00001')
    expect(formatNumber({ input: 0, type: NumberType.TokenTx })).toBe('0')
  })

  it('formats fiat estimates on token details pages correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.891, type: NumberType.FiatTokenDetails })).toBe('$1.23M')
    expect(formatNumber({ input: 1234.5678, type: NumberType.FiatTokenDetails })).toBe('$1,234.57')
    expect(formatNumber({ input: 1.048942, type: NumberType.FiatTokenDetails })).toBe('$1.049')

    expect(formatNumber({ input: 0.001231, type: NumberType.FiatTokenDetails })).toBe('$0.00123')
    expect(formatNumber({ input: 0.00001231, type: NumberType.FiatTokenDetails })).toBe('$0.0000123')

    expect(formatNumber({ input: 0.0000001234, type: NumberType.FiatTokenDetails })).toBe('$0.000000123')
    expect(formatNumber({ input: 0.000000009876, type: NumberType.FiatTokenDetails })).toBe('<$0.00000001')
  })

  it('formats fiat estimates on token details pages correctly with french locale and euro currency', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.FrenchFrance)
    mocked(useAppFiatCurrency).mockReturnValue(FiatCurrency.Euro)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.891, type: NumberType.FiatTokenDetails })).toBe('1,23\xa0M\xa0€')
    expect(formatNumber({ input: 1234.5678, type: NumberType.FiatTokenDetails })).toBe('1\u202f234,57\xa0€')
    expect(formatNumber({ input: 1.048942, type: NumberType.FiatTokenDetails })).toBe('1,049\xa0€')

    expect(formatNumber({ input: 0.001231, type: NumberType.FiatTokenDetails })).toBe('0,00123\xa0€')
    expect(formatNumber({ input: 0.00001231, type: NumberType.FiatTokenDetails })).toBe('0,0000123\xa0€')

    expect(formatNumber({ input: 0.0000001234, type: NumberType.FiatTokenDetails })).toBe('0,000000123\xa0€')
    expect(formatNumber({ input: 0.000000009876, type: NumberType.FiatTokenDetails })).toBe('<0,00000001\xa0€')
  })

  it('formats fiat estimates for tokens correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.891, type: NumberType.FiatTokenPrice })).toBe('$1.23M')
    expect(formatNumber({ input: 1234.5678, type: NumberType.FiatTokenPrice })).toBe('$1,234.57')

    expect(formatNumber({ input: 0.010235, type: NumberType.FiatTokenPrice })).toBe('$0.0102')
    expect(formatNumber({ input: 0.001231, type: NumberType.FiatTokenPrice })).toBe('$0.00123')
    expect(formatNumber({ input: 0.00001231, type: NumberType.FiatTokenPrice })).toBe('$0.0000123')

    expect(formatNumber({ input: 0.0000001234, type: NumberType.FiatTokenPrice })).toBe('$0.000000123')
    expect(formatNumber({ input: 0.000000009876, type: NumberType.FiatTokenPrice })).toBe('<$0.00000001')
    expect(formatNumber({ input: 10000000000000000000000000000000, type: NumberType.FiatTokenPrice })).toBe(
      '$1.000000E31',
    )
  })

  it('formats fiat estimates for tokens correctly with spanish locale and yen currency', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.SpanishSpain)
    mocked(useAppFiatCurrency).mockReturnValue(FiatCurrency.JapaneseYen)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.891, type: NumberType.FiatTokenPrice })).toBe('1,23\xa0M¥')
    expect(formatNumber({ input: 1234.5678, type: NumberType.FiatTokenPrice })).toBe('1234,57\xa0¥')
    expect(formatNumber({ input: 12345.678, type: NumberType.FiatTokenPrice })).toBe('12.345,68\xa0¥')

    expect(formatNumber({ input: 0.010235, type: NumberType.FiatTokenPrice })).toBe('0,0102\xa0¥')
    expect(formatNumber({ input: 0.001231, type: NumberType.FiatTokenPrice })).toBe('0,00123\xa0¥')
    expect(formatNumber({ input: 0.00001231, type: NumberType.FiatTokenPrice })).toBe('0,0000123\xa0¥')

    expect(formatNumber({ input: 0.0000001234, type: NumberType.FiatTokenPrice })).toBe('0,000000123\xa0¥')
    expect(formatNumber({ input: 0.000000009876, type: NumberType.FiatTokenPrice })).toBe('<0,00000001\xa0¥')
    expect(formatNumber({ input: 10000000000000000000000000000000, type: NumberType.FiatTokenPrice })).toBe(
      '1,000000E31\xa0¥',
    )
  })

  it('formats fiat estimates for token stats correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234576, type: NumberType.FiatTokenStats })).toBe('$1.2M')
    expect(formatNumber({ input: 234567, type: NumberType.FiatTokenStats })).toBe('$234.6K')
    expect(formatNumber({ input: 123.456, type: NumberType.FiatTokenStats })).toBe('$123.46')
    expect(formatNumber({ input: 1.23, type: NumberType.FiatTokenStats })).toBe('$1.23')
    expect(formatNumber({ input: 0.123, type: NumberType.FiatTokenStats })).toBe('$0.12')
    expect(formatNumber({ input: 0.00123, type: NumberType.FiatTokenStats })).toBe('<$0.01')
    expect(formatNumber({ input: 0, type: NumberType.FiatTokenStats })).toBe('-')
  })

  it('formats fiat estimates for token stats correctly with japenese locale and cad currency', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.JapaneseJapan)
    mocked(useAppFiatCurrency).mockReturnValue(FiatCurrency.CanadianDollar)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234576, type: NumberType.FiatTokenStats })).toBe('CA$123.5万')
    expect(formatNumber({ input: 234567, type: NumberType.FiatTokenStats })).toBe('CA$23.5万')
    expect(formatNumber({ input: 123.456, type: NumberType.FiatTokenStats })).toBe('CA$123.46')
    expect(formatNumber({ input: 1.23, type: NumberType.FiatTokenStats })).toBe('CA$1.23')
    expect(formatNumber({ input: 0.123, type: NumberType.FiatTokenStats })).toBe('CA$0.12')
    expect(formatNumber({ input: 0.00123, type: NumberType.FiatTokenStats })).toBe('<CA$0.01')
    expect(formatNumber({ input: 0, type: NumberType.FiatTokenStats })).toBe('-')
  })

  it('formats gas USD prices correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.891, type: NumberType.FiatGasPrice })).toBe('$1.23M')
    expect(formatNumber({ input: 18.448, type: NumberType.FiatGasPrice })).toBe('$18.45')
    expect(formatNumber({ input: 0.0099, type: NumberType.FiatGasPrice })).toBe('<$0.01')
    expect(formatNumber({ input: 0, type: NumberType.FiatGasPrice })).toBe('$0')
  })

  it('formats gas prices correctly with portugese locale and thai baht currency', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.PortugueseBrazil)
    mocked(useAppFiatCurrency).mockReturnValue(FiatCurrency.ThaiBaht)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.891, type: NumberType.FiatGasPrice })).toBe('฿\xa01,23\xa0mi')
    expect(formatNumber({ input: 18.448, type: NumberType.FiatGasPrice })).toBe('฿\xa018,45')
    expect(formatNumber({ input: 0.0099, type: NumberType.FiatGasPrice })).toBe('<฿\xa00,01')
    expect(formatNumber({ input: 0, type: NumberType.FiatGasPrice })).toBe('฿\xa00')
  })

  it('formats USD token quantities prices correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.891, type: NumberType.FiatTokenQuantity })).toBe('$1.23M')
    expect(formatNumber({ input: 18.448, type: NumberType.FiatTokenQuantity })).toBe('$18.45')
    expect(formatNumber({ input: 0.0099, type: NumberType.FiatTokenQuantity })).toBe('<$0.01')
    expect(formatNumber({ input: 0, type: NumberType.FiatTokenQuantity })).toBe('$0.00')
  })

  it('formats token quantities prices correctly with nigerian naira currency', () => {
    mocked(useAppFiatCurrency).mockReturnValue(FiatCurrency.NigerianNaira)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.891, type: NumberType.FiatTokenQuantity })).toBe('₦1.23M')
    expect(formatNumber({ input: 18.448, type: NumberType.FiatTokenQuantity })).toBe('₦18.45')
    expect(formatNumber({ input: 0.0099, type: NumberType.FiatTokenQuantity })).toBe('<₦0.01')
    expect(formatNumber({ input: 0, type: NumberType.FiatTokenQuantity })).toBe('₦0.00')
  })

  it('formats Swap text input/output numbers correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.8901, type: NumberType.SwapTradeAmount })).toBe('1234570')
    expect(formatNumber({ input: 765432.1, type: NumberType.SwapTradeAmount })).toBe('765432')

    expect(formatNumber({ input: 7654.321, type: NumberType.SwapTradeAmount })).toBe('7654.32')
    expect(formatNumber({ input: 765.4321, type: NumberType.SwapTradeAmount })).toBe('765.432')
    expect(formatNumber({ input: 76.54321, type: NumberType.SwapTradeAmount })).toBe('76.5432')
    expect(formatNumber({ input: 7.654321, type: NumberType.SwapTradeAmount })).toBe('7.65432')
    expect(formatNumber({ input: 7.60000054321, type: NumberType.SwapTradeAmount })).toBe('7.60')
    expect(formatNumber({ input: 7.6, type: NumberType.SwapTradeAmount })).toBe('7.60')
    expect(formatNumber({ input: 7, type: NumberType.SwapTradeAmount })).toBe('7.00')

    expect(formatNumber({ input: 0.987654321, type: NumberType.SwapTradeAmount })).toBe('0.98765')
    expect(formatNumber({ input: 0.9, type: NumberType.SwapTradeAmount })).toBe('0.90')
    expect(formatNumber({ input: 0.901000123, type: NumberType.SwapTradeAmount })).toBe('0.901')
    expect(formatNumber({ input: 0.000000001, type: NumberType.SwapTradeAmount })).toBe('0.000000001')
    expect(formatNumber({ input: 0, type: NumberType.SwapTradeAmount })).toBe('0')
  })

  it('formats Swap text input/output numbers correctly with Korean locale', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.KoreanKorea)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567.8901, type: NumberType.SwapTradeAmount })).toBe('1234570')
    expect(formatNumber({ input: 765432.1, type: NumberType.SwapTradeAmount })).toBe('765432')

    expect(formatNumber({ input: 7654.321, type: NumberType.SwapTradeAmount })).toBe('7654.32')
    expect(formatNumber({ input: 765.4321, type: NumberType.SwapTradeAmount })).toBe('765.432')
    expect(formatNumber({ input: 76.54321, type: NumberType.SwapTradeAmount })).toBe('76.5432')
    expect(formatNumber({ input: 7.654321, type: NumberType.SwapTradeAmount })).toBe('7.65432')
    expect(formatNumber({ input: 7.60000054321, type: NumberType.SwapTradeAmount })).toBe('7.60')
    expect(formatNumber({ input: 7.6, type: NumberType.SwapTradeAmount })).toBe('7.60')
    expect(formatNumber({ input: 7, type: NumberType.SwapTradeAmount })).toBe('7.00')

    expect(formatNumber({ input: 0.987654321, type: NumberType.SwapTradeAmount })).toBe('0.98765')
    expect(formatNumber({ input: 0.9, type: NumberType.SwapTradeAmount })).toBe('0.90')
    expect(formatNumber({ input: 0.901000123, type: NumberType.SwapTradeAmount })).toBe('0.901')
    expect(formatNumber({ input: 0.000000001, type: NumberType.SwapTradeAmount })).toBe('0.000000001')
    expect(formatNumber({ input: 0, type: NumberType.SwapTradeAmount })).toBe('0')
  })

  it('formats NFT numbers correctly', () => {
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567000000000, type: NumberType.NFTTokenFloorPrice })).toBe('>999T')
    expect(formatNumber({ input: 1002345, type: NumberType.NFTTokenFloorPrice })).toBe('1M')
    expect(formatNumber({ input: 1234, type: NumberType.NFTTokenFloorPrice })).toBe('1.23K')
    expect(formatNumber({ input: 12.34467, type: NumberType.NFTTokenFloorPrice })).toBe('12.34')
    expect(formatNumber({ input: 12.1, type: NumberType.NFTTokenFloorPrice })).toBe('12.1')
    expect(formatNumber({ input: 0.00909, type: NumberType.NFTTokenFloorPrice })).toBe('0.009')
    expect(formatNumber({ input: 0.09001, type: NumberType.NFTTokenFloorPrice })).toBe('0.09')
    expect(formatNumber({ input: 0.00099, type: NumberType.NFTTokenFloorPrice })).toBe('<0.001')
    expect(formatNumber({ input: 0, type: NumberType.NFTTokenFloorPrice })).toBe('0')

    expect(formatNumber({ input: 12.1, type: NumberType.NFTTokenFloorPriceTrailingZeros })).toBe('12.10')
    expect(formatNumber({ input: 0.09001, type: NumberType.NFTTokenFloorPriceTrailingZeros })).toBe('0.090')

    expect(formatNumber({ input: 0.987654321, type: NumberType.NFTCollectionStats })).toBe('1')
    expect(formatNumber({ input: 0.9, type: NumberType.NFTCollectionStats })).toBe('1')
    expect(formatNumber({ input: 76543.21, type: NumberType.NFTCollectionStats })).toBe('76.5K')
    expect(formatNumber({ input: 7.60000054321, type: NumberType.NFTCollectionStats })).toBe('8')
    expect(formatNumber({ input: 1234567890, type: NumberType.NFTCollectionStats })).toBe('1.2B')
    expect(formatNumber({ input: 1234567000000000, type: NumberType.NFTCollectionStats })).toBe('1234.6T')
  })

  it('formats NFT numbers correctly with brazilian portuguese locale and brazilian real currency', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.PortugueseBrazil)
    mocked(useAppFiatCurrency).mockReturnValue(FiatCurrency.BrazilianReal)
    const { formatNumber } = renderHook(() => useFormatter()).result.current

    expect(formatNumber({ input: 1234567000000000, type: NumberType.NFTTokenFloorPrice })).toBe('>999\xa0tri')
    expect(formatNumber({ input: 1002345, type: NumberType.NFTTokenFloorPrice })).toBe('1\xa0mi')
    expect(formatNumber({ input: 1234, type: NumberType.NFTTokenFloorPrice })).toBe('1,23\xa0mil')
    expect(formatNumber({ input: 12.34467, type: NumberType.NFTTokenFloorPrice })).toBe('12,34')
    expect(formatNumber({ input: 12.1, type: NumberType.NFTTokenFloorPrice })).toBe('12,1')
    expect(formatNumber({ input: 0.00909, type: NumberType.NFTTokenFloorPrice })).toBe('0,009')
    expect(formatNumber({ input: 0.09001, type: NumberType.NFTTokenFloorPrice })).toBe('0,09')
    expect(formatNumber({ input: 0.00099, type: NumberType.NFTTokenFloorPrice })).toBe('<0,001')
    expect(formatNumber({ input: 0, type: NumberType.NFTTokenFloorPrice })).toBe('0')

    expect(formatNumber({ input: 12.1, type: NumberType.NFTTokenFloorPriceTrailingZeros })).toBe('12,10')
    expect(formatNumber({ input: 0.09001, type: NumberType.NFTTokenFloorPriceTrailingZeros })).toBe('0,090')

    expect(formatNumber({ input: 0.987654321, type: NumberType.NFTCollectionStats })).toBe('1')
    expect(formatNumber({ input: 0.9, type: NumberType.NFTCollectionStats })).toBe('1')
    expect(formatNumber({ input: 76543.21, type: NumberType.NFTCollectionStats })).toBe('76,5\xa0mil')
    expect(formatNumber({ input: 7.60000054321, type: NumberType.NFTCollectionStats })).toBe('8')
    expect(formatNumber({ input: 1234567890, type: NumberType.NFTCollectionStats })).toBe('1,2\xa0bi')
    expect(formatNumber({ input: 1234567000000000, type: NumberType.NFTCollectionStats })).toBe('1234,6\xa0tri')
  })
})

describe('formatUSDPrice', () => {
  it('format fiat price correctly', () => {
    const { formatFiatPrice } = renderHook(() => useFormatter()).result.current

    expect(formatFiatPrice({ price: 0.000000009876 })).toBe('<$0.00000001')
    expect(formatFiatPrice({ price: 0.00001231 })).toBe('$0.0000123')
    expect(formatFiatPrice({ price: 0.001231 })).toBe('$0.00123')
    expect(formatFiatPrice({ price: 0.0 })).toBe('$0.00')
    expect(formatFiatPrice({ price: 0 })).toBe('$0.00')
    expect(formatFiatPrice({ price: 1.048942 })).toBe('$1.05')
    expect(formatFiatPrice({ price: 0.10235 })).toBe('$0.102')
    expect(formatFiatPrice({ price: 1_234.5678 })).toBe('$1,234.57')
    expect(formatFiatPrice({ price: 1_234_567.891 })).toBe('$1.23M')
    expect(formatFiatPrice({ price: 1_000_000_000_000 })).toBe('$1.00T')
    expect(formatFiatPrice({ price: 1_000_000_000_000_000 })).toBe('$1000.00T')
  })

  it('format fiat price correctly in euros with french locale', () => {
    mocked(useAppFiatCurrency).mockReturnValue(FiatCurrency.Euro)
    mocked(useCurrentLocale).mockReturnValue(Locale.FrenchFrance)
    const { formatFiatPrice } = renderHook(() => useFormatter()).result.current

    expect(formatFiatPrice({ price: 0.000000009876 })).toBe('<0,00000001\xa0€')
    expect(formatFiatPrice({ price: 0.00001231 })).toBe('0,0000123\xa0€')
    expect(formatFiatPrice({ price: 0.001231 })).toBe('0,00123\xa0€')
    expect(formatFiatPrice({ price: 0.0 })).toBe('0,00\xa0€')
    expect(formatFiatPrice({ price: 0 })).toBe('0,00\xa0€')
    expect(formatFiatPrice({ price: 1.048942 })).toBe('1,05\xa0€')
    expect(formatFiatPrice({ price: 0.10235 })).toBe('0,102\xa0€')
    expect(formatFiatPrice({ price: 1_234.5678 })).toBe('1\u202f234,57\xa0€')
    expect(formatFiatPrice({ price: 1_234_567.891 })).toBe('1,23\xa0M\xa0€')
    expect(formatFiatPrice({ price: 1_000_000_000_000 })).toBe('1,00\xa0Bn\xa0€')
    expect(formatFiatPrice({ price: 1_000_000_000_000_000 })).toBe('1000,00\xa0Bn\xa0€')
  })
})

describe('formatPercent', () => {
  it('should correctly format undefined', () => {
    const { formatPercent } = renderHook(() => useFormatter()).result.current

    expect(formatPercent(undefined)).toBe('-')
  })

  it('correctly formats a percent with no trailing digits', () => {
    const { formatPercent } = renderHook(() => useFormatter()).result.current

    expect(formatPercent(new Percent(1, 100000))).toBe('0.001%')
    expect(formatPercent(new Percent(1, 1000))).toBe('0.1%')
    expect(formatPercent(new Percent(1, 100))).toBe('1%')
    expect(formatPercent(new Percent(1, 10))).toBe('10%')
    expect(formatPercent(new Percent(1, 1))).toBe('100%')
  })

  it('correctly formats a percent with french locale', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.FrenchFrance)
    const { formatPercent } = renderHook(() => useFormatter()).result.current

    expect(formatPercent(new Percent(1, 100000))).toBe('0,001%')
    expect(formatPercent(new Percent(1, 1000))).toBe('0,1%')
    expect(formatPercent(new Percent(1, 100))).toBe('1%')
    expect(formatPercent(new Percent(1, 10))).toBe('10%')
    expect(formatPercent(new Percent(1, 1))).toBe('100%')
  })
})

describe('formatDelta', () => {
  it.each([[null], [undefined], [Infinity], [NaN]])('should correctly format %p', (value) => {
    const { formatDelta } = renderHook(() => useFormatter()).result.current

    expect(formatDelta(value)).toBe('-')
  })

  it('correctly formats a percent with 2 decimal places', () => {
    const { formatDelta } = renderHook(() => useFormatter()).result.current

    expect(formatDelta(0)).toBe('0.00%')
    expect(formatDelta(0.1)).toBe('0.10%')
    expect(formatDelta(1)).toBe('1.00%')
    expect(formatDelta(10)).toBe('10.00%')
    expect(formatDelta(100)).toBe('100.00%')
  })

  it('correctly formats a percent with 2 decimal places in french locale', () => {
    mocked(useCurrentLocale).mockReturnValue(Locale.FrenchFrance)
    const { formatDelta } = renderHook(() => useFormatter()).result.current

    expect(formatDelta(0)).toBe('0,00%')
    expect(formatDelta(0.1)).toBe('0,10%')
    expect(formatDelta(1)).toBe('1,00%')
    expect(formatDelta(10)).toBe('10,00%')
    expect(formatDelta(100)).toBe('100,00%')
  })
})

describe('formatToFiatAmount', () => {
  it('should return default values when undefined', () => {
    const { convertToFiatAmount } = renderHook(() => useFormatter()).result.current

    expect(convertToFiatAmount(1)).toStrictEqual({ amount: 1.0, currency: DEFAULT_LOCAL_CURRENCY })
  })

  it('should return input amount for same currency', () => {
    mocked(useAppFiatCurrency).mockReturnValue(FiatCurrency.UnitedStatesDollar)
    const { convertToFiatAmount } = renderHook(() => useFormatter()).result.current

    expect(convertToFiatAmount(12)).toStrictEqual({ amount: 12.0, currency: Currency.Usd })
  })
})
