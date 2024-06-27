import { NumberType } from 'utilities/src/format/types'
import { formatNumber } from './localeBased'

it('formats token reference numbers correctly', () => {
  expect(
    formatNumber({ input: 1234567000000000, type: NumberType.TokenNonTx, locale: 'en-US' })
  ).toBe('>999T')
  expect(formatNumber({ input: 1002345, type: NumberType.TokenNonTx, locale: 'en-US' })).toBe(
    '1.00M'
  )
  expect(formatNumber({ input: 1234, type: NumberType.TokenNonTx, locale: 'en-US' })).toBe(
    '1,234.00'
  )
  expect(formatNumber({ input: 0.00909, type: NumberType.TokenNonTx, locale: 'en-US' })).toBe(
    '0.009'
  )
  expect(formatNumber({ input: 0.09001, type: NumberType.TokenNonTx, locale: 'en-US' })).toBe(
    '0.090'
  )
  expect(formatNumber({ input: 0.00099, type: NumberType.TokenNonTx, locale: 'en-US' })).toBe(
    '<0.001'
  )
  expect(formatNumber({ input: 0, type: NumberType.TokenNonTx, locale: 'en-US' })).toBe('0')
})

it('formats token transaction numbers correctly', () => {
  expect(formatNumber({ input: 1234567.8901, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '1,234,567.89'
  )
  expect(formatNumber({ input: 765432.1, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '765,432.10'
  )

  expect(formatNumber({ input: 7654.321, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '7,654.32'
  )
  expect(formatNumber({ input: 765.4321, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '765.432'
  )
  expect(formatNumber({ input: 76.54321, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '76.5432'
  )
  expect(formatNumber({ input: 7.654321, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '7.65432'
  )
  expect(formatNumber({ input: 7.60000054321, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '7.60'
  )
  expect(formatNumber({ input: 7.6, type: NumberType.TokenTx, locale: 'en-US' })).toBe('7.60')
  expect(formatNumber({ input: 7, type: NumberType.TokenTx, locale: 'en-US' })).toBe('7.00')

  expect(formatNumber({ input: 0.987654321, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '0.98765'
  )
  expect(formatNumber({ input: 0.9, type: NumberType.TokenTx, locale: 'en-US' })).toBe('0.90')
  expect(formatNumber({ input: 0.901000123, type: NumberType.TokenTx, locale: 'en-US' })).toBe(
    '0.901'
  )
  expect(formatNumber({ input: 1e-9, type: NumberType.TokenTx, locale: 'en-US' })).toBe('<0.00001')
  expect(formatNumber({ input: 0, type: NumberType.TokenTx, locale: 'en-US' })).toBe('0')
})

it('formats fiat estimates on token details pages correctly', () => {
  expect(
    formatNumber({ input: 1234567.891, type: NumberType.FiatTokenDetails, locale: 'en-US' })
  ).toBe('$1.23M')
  expect(
    formatNumber({ input: 1234.5678, type: NumberType.FiatTokenDetails, locale: 'en-US' })
  ).toBe('$1,234.57')
  expect(
    formatNumber({ input: 1.048942, type: NumberType.FiatTokenDetails, locale: 'en-US' })
  ).toBe('$1.049')

  expect(
    formatNumber({ input: 0.001231, type: NumberType.FiatTokenDetails, locale: 'en-US' })
  ).toBe('$0.00123')
  expect(
    formatNumber({ input: 0.00001231, type: NumberType.FiatTokenDetails, locale: 'en-US' })
  ).toBe('$0.0000123')

  expect(
    formatNumber({ input: 1.234e-7, type: NumberType.FiatTokenDetails, locale: 'en-US' })
  ).toBe('$0.000000123')
  expect(
    formatNumber({ input: 9.876e-9, type: NumberType.FiatTokenDetails, locale: 'en-US' })
  ).toBe('<$0.00000001')
})

it('formats fiat estimates for tokens correctly', () => {
  expect(
    formatNumber({ input: 1234567.891, type: NumberType.FiatTokenPrice, locale: 'en-US' })
  ).toBe('$1.23M')
  expect(formatNumber({ input: 1234.5678, type: NumberType.FiatTokenPrice, locale: 'en-US' })).toBe(
    '$1,234.57'
  )

  expect(formatNumber({ input: 0.010235, type: NumberType.FiatTokenPrice, locale: 'en-US' })).toBe(
    '$0.0102'
  )
  expect(formatNumber({ input: 0.001231, type: NumberType.FiatTokenPrice, locale: 'en-US' })).toBe(
    '$0.00123'
  )
  expect(
    formatNumber({ input: 0.00001231, type: NumberType.FiatTokenPrice, locale: 'en-US' })
  ).toBe('$0.0000123')

  expect(formatNumber({ input: 1.234e-7, type: NumberType.FiatTokenPrice, locale: 'en-US' })).toBe(
    '$0.000000123'
  )
  expect(formatNumber({ input: 9.876e-9, type: NumberType.FiatTokenPrice, locale: 'en-US' })).toBe(
    '<$0.00000001'
  )
})

it('formats fiat estimates for token stats correctly', () => {
  expect(formatNumber({ input: 1234576, type: NumberType.FiatTokenStats, locale: 'en-US' })).toBe(
    '$1.2M'
  )
  expect(formatNumber({ input: 234567, type: NumberType.FiatTokenStats, locale: 'en-US' })).toBe(
    '$234.6K'
  )
  expect(formatNumber({ input: 123.456, type: NumberType.FiatTokenStats, locale: 'en-US' })).toBe(
    '$123.46'
  )
  expect(formatNumber({ input: 1.23, type: NumberType.FiatTokenStats, locale: 'en-US' })).toBe(
    '$1.23'
  )
  expect(formatNumber({ input: 0.123, type: NumberType.FiatTokenStats, locale: 'en-US' })).toBe(
    '$0.12'
  )
  expect(formatNumber({ input: 0.00123, type: NumberType.FiatTokenStats, locale: 'en-US' })).toBe(
    '<$0.01'
  )
  expect(formatNumber({ input: 0, type: NumberType.FiatTokenStats, locale: 'en-US' })).toBe('-')
})

it('formats gas USD prices correctly', () => {
  expect(formatNumber({ input: 1234567.891, type: NumberType.FiatGasPrice, locale: 'en-US' })).toBe(
    '$1.23M'
  )
  expect(formatNumber({ input: 18.448, type: NumberType.FiatGasPrice, locale: 'en-US' })).toBe(
    '$18.45'
  )
  expect(formatNumber({ input: 0.0099, type: NumberType.FiatGasPrice, locale: 'en-US' })).toBe(
    '<$0.01'
  )
})

it('formats USD token quantities prices correctly', () => {
  expect(
    formatNumber({ input: 1234567.891, type: NumberType.FiatTokenQuantity, locale: 'en-US' })
  ).toBe('$1.23M')
  expect(formatNumber({ input: 18.448, type: NumberType.FiatTokenQuantity, locale: 'en-US' })).toBe(
    '$18.45'
  )
  expect(formatNumber({ input: 0.0099, type: NumberType.FiatTokenQuantity, locale: 'en-US' })).toBe(
    '<$0.01'
  )
  expect(formatNumber({ input: 0, type: NumberType.FiatTokenQuantity, locale: 'en-US' })).toBe(
    '$0.00'
  )
})

it('formats Swap text input/output numbers correctly', () => {
  expect(
    formatNumber({ input: 1234567.8901, type: NumberType.SwapTradeAmount, locale: 'en-US' })
  ).toBe('1234570')
  expect(formatNumber({ input: 765432.1, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe(
    '765432'
  )

  expect(formatNumber({ input: 7654.321, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe(
    '7654.32'
  )
  expect(formatNumber({ input: 765.4321, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe(
    '765.432'
  )
  expect(formatNumber({ input: 76.54321, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe(
    '76.5432'
  )
  expect(formatNumber({ input: 7.654321, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe(
    '7.65432'
  )
  expect(
    formatNumber({ input: 7.60000054321, type: NumberType.SwapTradeAmount, locale: 'en-US' })
  ).toBe('7.60')
  expect(formatNumber({ input: 7.6, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe(
    '7.60'
  )
  expect(formatNumber({ input: 7, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe('7.00')

  expect(
    formatNumber({ input: 0.987654321, type: NumberType.SwapTradeAmount, locale: 'en-US' })
  ).toBe('0.98765')
  expect(formatNumber({ input: 0.9, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe(
    '0.90'
  )
  expect(
    formatNumber({ input: 0.901000123, type: NumberType.SwapTradeAmount, locale: 'en-US' })
  ).toBe('0.901')
  expect(formatNumber({ input: 1e-9, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe(
    '0.000000001'
  )
  expect(formatNumber({ input: 0, type: NumberType.SwapTradeAmount, locale: 'en-US' })).toBe('0')
})

it('formats Swap prices correctly', () => {
  expect(formatNumber({ input: 1234567.8901, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '1234570'
  )
  expect(formatNumber({ input: 765432.1, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '765432'
  )

  expect(formatNumber({ input: 7654.321, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '7654.32'
  )
  expect(formatNumber({ input: 765.4321, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '765.432'
  )
  expect(formatNumber({ input: 76.54321, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '76.5432'
  )
  expect(formatNumber({ input: 7.654321, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '7.65432'
  )
  expect(formatNumber({ input: 7.60000054321, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '7.60'
  )
  expect(formatNumber({ input: 7.6, type: NumberType.SwapPrice, locale: 'en-US' })).toBe('7.60')
  expect(formatNumber({ input: 7, type: NumberType.SwapPrice, locale: 'en-US' })).toBe('7.00')

  expect(formatNumber({ input: 0.987654321, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '0.98765'
  )
  expect(formatNumber({ input: 0.9, type: NumberType.SwapPrice, locale: 'en-US' })).toBe('0.90')
  expect(formatNumber({ input: 0.901000123, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '0.901'
  )
  expect(formatNumber({ input: 1e-9, type: NumberType.SwapPrice, locale: 'en-US' })).toBe(
    '<0.00001'
  )
  expect(formatNumber({ input: 0, type: NumberType.SwapPrice, locale: 'en-US' })).toBe('0')
})

it('formats NFT numbers correctly', () => {
  expect(
    formatNumber({ input: 1234567000000000, type: NumberType.NFTTokenFloorPrice, locale: 'en-US' })
  ).toBe('>999T')
  expect(
    formatNumber({ input: 1002345, type: NumberType.NFTTokenFloorPrice, locale: 'en-US' })
  ).toBe('1.00M')
  expect(formatNumber({ input: 1234, type: NumberType.NFTTokenFloorPrice, locale: 'en-US' })).toBe(
    '1.23K'
  )
  expect(
    formatNumber({ input: 12.34467, type: NumberType.NFTTokenFloorPrice, locale: 'en-US' })
  ).toBe('12.34')
  expect(
    formatNumber({ input: 0.00909, type: NumberType.NFTTokenFloorPrice, locale: 'en-US' })
  ).toBe('0.009')
  expect(
    formatNumber({ input: 0.09001, type: NumberType.NFTTokenFloorPrice, locale: 'en-US' })
  ).toBe('0.090')
  expect(
    formatNumber({ input: 0.00099, type: NumberType.NFTTokenFloorPrice, locale: 'en-US' })
  ).toBe('<0.001')
  expect(formatNumber({ input: 0, type: NumberType.NFTTokenFloorPrice, locale: 'en-US' })).toBe('0')

  expect(
    formatNumber({ input: 1234576, type: NumberType.NFTCollectionStats, locale: 'en-US' })
  ).toBe('1.2M')
  expect(
    formatNumber({ input: 234567, type: NumberType.NFTCollectionStats, locale: 'en-US' })
  ).toBe('234.6K')
  expect(formatNumber({ input: 999, type: NumberType.NFTCollectionStats, locale: 'en-US' })).toBe(
    '999'
  )
  expect(formatNumber({ input: 0, type: NumberType.NFTCollectionStats, locale: 'en-US' })).toBe('0')
})
