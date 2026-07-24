import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  convertShiftedGasFeeForDisplay,
  hasSufficientFundsIncludingShiftedGasToken,
} from 'uniswap/src/features/gas/shiftedGasToken'

// 6-decimal gas token (e.g. pathUSD / USDC) → 18-decimal native fees shift by 10^12
const SHIFT = BigInt(10) ** BigInt(12)
const GAS_TOKEN = new Token(
  UniverseChainId.Tempo,
  '0x20c0000000000000000000000000000000000000',
  6,
  'pathUSD',
  'pathUSD',
)

function gasTokenBalance(raw: string): CurrencyAmount<Token> {
  return CurrencyAmount.fromRawAmount(GAS_TOKEN, raw)
}

describe(hasSufficientFundsIncludingShiftedGasToken, () => {
  it('returns false when gasTokenBalance is undefined', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: undefined,
        gasFee: '1000000000000000000',
        decimalShift: SHIFT,
      }),
    ).toBe(false)
  })

  it('returns false when gasFee is undefined', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('1000000'),
        gasFee: undefined,
        decimalShift: SHIFT,
      }),
    ).toBe(false)
  })

  it('returns false when both are undefined', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: undefined,
        gasFee: undefined,
        decimalShift: SHIFT,
      }),
    ).toBe(false)
  })

  it('returns true when balance exactly covers the gas fee', () => {
    // 1 gas-token unit (1_000_000 raw) covers a 1e18 native gas fee
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('1000000'),
        gasFee: '1000000000000000000',
        decimalShift: SHIFT,
      }),
    ).toBe(true)
  })

  it('returns true when balance exceeds the gas fee', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('10000000'),
        gasFee: '1000000000000000000',
        decimalShift: SHIFT,
      }),
    ).toBe(true)
  })

  it('returns false when balance is insufficient', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('500000'),
        gasFee: '1000000000000000000',
        decimalShift: SHIFT,
      }),
    ).toBe(false)
  })

  it('returns false when balance is zero', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('0'),
        gasFee: '1000000000000000000',
        decimalShift: SHIFT,
      }),
    ).toBe(false)
  })

  it('rounds up sub-unit gas fees so zero balance does not pass', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('0'),
        gasFee: '1',
        decimalShift: SHIFT,
      }),
    ).toBe(false)
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('1'),
        gasFee: '1',
        decimalShift: SHIFT,
      }),
    ).toBe(true)
  })

  it('rounds up fees that are not exact multiples of the shift factor', () => {
    // 1_500_000_000_000 native = 1.5 gas-token units → rounds up to 2
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('1'),
        gasFee: '1500000000000',
        decimalShift: SHIFT,
      }),
    ).toBe(false)
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('2'),
        gasFee: '1500000000000',
        decimalShift: SHIFT,
      }),
    ).toBe(true)
  })

  it('returns false for an invalid gasFee string', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('1000000'),
        gasFee: 'not-a-number',
        decimalShift: SHIFT,
      }),
    ).toBe(false)
  })

  it('returns true when gasFee is zero', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('0'),
        gasFee: '0',
        decimalShift: SHIFT,
      }),
    ).toBe(true)
  })

  it('returns false when balance cannot cover gas + transaction amount', () => {
    // 10 balance, 0.5 gas, 10 tx = needs 10.5, has 10
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('10000000'),
        gasFee: '500000000000000000',
        gasTokenTransactionAmount: gasTokenBalance('10000000'),
        decimalShift: SHIFT,
      }),
    ).toBe(false)
  })

  it('returns true when balance covers gas + transaction amount', () => {
    // 11 balance, 0.5 gas, 10 tx = needs 10.5, has 11
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('11000000'),
        gasFee: '500000000000000000',
        gasTokenTransactionAmount: gasTokenBalance('10000000'),
        decimalShift: SHIFT,
      }),
    ).toBe(true)
  })

  it('ignores transaction amount when undefined', () => {
    expect(
      hasSufficientFundsIncludingShiftedGasToken({
        gasTokenBalance: gasTokenBalance('1000000'),
        gasFee: '1000000000000000000',
        gasTokenTransactionAmount: undefined,
        decimalShift: SHIFT,
      }),
    ).toBe(true)
  })
})

describe(convertShiftedGasFeeForDisplay, () => {
  it('converts 18-decimal native fees to 6-decimal gas-token units', () => {
    expect(convertShiftedGasFeeForDisplay('1000000000000000000', SHIFT)).toBe('1000000')
  })

  it('converts a typical gas fee', () => {
    expect(convertShiftedGasFeeForDisplay('50000000000000', SHIFT)).toBe('50')
  })

  it('rounds up sub-unit amounts', () => {
    expect(convertShiftedGasFeeForDisplay('1', SHIFT)).toBe('1')
  })

  it('handles zero', () => {
    expect(convertShiftedGasFeeForDisplay('0', SHIFT)).toBe('0')
  })

  it('is a no-op when the shift is 1 (native gas token)', () => {
    expect(convertShiftedGasFeeForDisplay('1000000000000000000', BigInt(1))).toBe('1000000000000000000')
  })
})
