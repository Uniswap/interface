import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { convertTempoGasFeeForDisplay, hasSufficientFundsIncludingTempoGas } from 'uniswap/src/features/gas/tempo'

const PATH_USD = new Token(UniverseChainId.Tempo, '0x20c0000000000000000000000000000000000000', 6, 'pathUSD', 'pathUSD')

function pathUsdBalance(raw: string): CurrencyAmount<Token> {
  return CurrencyAmount.fromRawAmount(PATH_USD, raw)
}

describe(hasSufficientFundsIncludingTempoGas, () => {
  it('returns false when pathUsdBalance is undefined', () => {
    expect(hasSufficientFundsIncludingTempoGas({ pathUsdBalance: undefined, gasFee: '1000000000000000000' })).toBe(
      false,
    )
  })

  it('returns false when gasFee is undefined', () => {
    expect(hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('1000000'), gasFee: undefined })).toBe(
      false,
    )
  })

  it('returns false when both are undefined', () => {
    expect(hasSufficientFundsIncludingTempoGas({ pathUsdBalance: undefined, gasFee: undefined })).toBe(false)
  })

  it('returns true when balance exactly covers the gas fee', () => {
    // 1 pathUSD (1_000_000 raw) should cover a 1 attodollar-USD gas fee (1_000_000_000_000_000_000)
    expect(
      hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('1000000'), gasFee: '1000000000000000000' }),
    ).toBe(true)
  })

  it('returns true when balance exceeds the gas fee', () => {
    // 10 pathUSD covering a 1 pathUSD gas fee
    expect(
      hasSufficientFundsIncludingTempoGas({
        pathUsdBalance: pathUsdBalance('10000000'),
        gasFee: '1000000000000000000',
      }),
    ).toBe(true)
  })

  it('returns false when balance is insufficient', () => {
    // 0.5 pathUSD (500_000 raw) vs 1 pathUSD gas fee
    expect(
      hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('500000'), gasFee: '1000000000000000000' }),
    ).toBe(false)
  })

  it('returns false when balance is zero', () => {
    expect(
      hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('0'), gasFee: '1000000000000000000' }),
    ).toBe(false)
  })

  it('rounds up sub-unit gas fees so zero balance does not pass', () => {
    // A gas fee of 1 wei (far below 10^12) should round up to 1 pathUSD unit
    expect(hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('0'), gasFee: '1' })).toBe(false)
    // 1 raw pathUSD unit should be enough
    expect(hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('1'), gasFee: '1' })).toBe(true)
  })

  it('rounds up fees that are not exact multiples of the shift factor', () => {
    // 1_500_000_000_000 wei = 1.5 pathUSD units → rounds up to 2
    expect(hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('1'), gasFee: '1500000000000' })).toBe(
      false,
    )
    expect(hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('2'), gasFee: '1500000000000' })).toBe(
      true,
    )
  })

  it('returns false for an invalid gasFee string', () => {
    expect(
      hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('1000000'), gasFee: 'not-a-number' }),
    ).toBe(false)
  })

  it('returns true when gasFee is zero', () => {
    expect(hasSufficientFundsIncludingTempoGas({ pathUsdBalance: pathUsdBalance('0'), gasFee: '0' })).toBe(true)
  })

  it('returns false when balance cannot cover gas + transaction amount', () => {
    // 10 pathUSD balance, 0.5 pathUSD gas, 10 pathUSD transaction = needs 10.5, has 10
    expect(
      hasSufficientFundsIncludingTempoGas({
        pathUsdBalance: pathUsdBalance('10000000'),
        gasFee: '500000000000000000',
        pathUsdTransactionAmount: pathUsdBalance('10000000'),
      }),
    ).toBe(false)
  })

  it('returns true when balance covers gas + transaction amount', () => {
    // 11 pathUSD balance, 0.5 pathUSD gas, 10 pathUSD transaction = needs 10.5, has 11
    expect(
      hasSufficientFundsIncludingTempoGas({
        pathUsdBalance: pathUsdBalance('11000000'),
        gasFee: '500000000000000000',
        pathUsdTransactionAmount: pathUsdBalance('10000000'),
      }),
    ).toBe(true)
  })

  it('ignores transaction amount when undefined', () => {
    expect(
      hasSufficientFundsIncludingTempoGas({
        pathUsdBalance: pathUsdBalance('1000000'),
        gasFee: '1000000000000000000',
        pathUsdTransactionAmount: undefined,
      }),
    ).toBe(true)
  })
})

describe(convertTempoGasFeeForDisplay, () => {
  it('converts 18-decimal attodollars to 6-decimal pathUSD units', () => {
    expect(convertTempoGasFeeForDisplay('1000000000000000000')).toBe('1000000')
  })

  it('converts a typical gas fee', () => {
    expect(convertTempoGasFeeForDisplay('50000000000000')).toBe('50')
  })

  it('rounds up sub-unit amounts', () => {
    expect(convertTempoGasFeeForDisplay('1')).toBe('1')
  })

  it('handles zero', () => {
    expect(convertTempoGasFeeForDisplay('0')).toBe('0')
  })
})
