import { CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { DAI, nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/hooks/useMaxAmountSpend'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { MAINNET_CURRENCY } from 'uniswap/src/test/fixtures/wallet/currencies'

const mockUseDynamicConfigValue = jest.fn()

jest.mock('@universe/gating', () => {
  return {
    ...jest.requireActual('@universe/gating'),
    useDynamicConfigValue: (params: { config: unknown; key: unknown; defaultValue: unknown }): unknown =>
      mockUseDynamicConfigValue(params),
  }
})

// Get Solana currency with 9 decimals
const SOLANA_CURRENCY = nativeOnChain(UniverseChainId.Solana)

describe(useMaxAmountSpend, () => {
  beforeEach(() => {
    // Reset mock to return default values
    mockUseDynamicConfigValue.mockImplementation(({ defaultValue }) => defaultValue)
  })

  it('handles undefined and null inputs', () => {
    expect(useMaxAmountSpend({ currencyAmount: undefined })).toBeUndefined()
    expect(useMaxAmountSpend({ currencyAmount: null })).toBeUndefined()
  })

  it('returns unchanged amount for non-native tokens', () => {
    const tokenAmount = CurrencyAmount.fromRawAmount(DAI, '100000000000000000000') // 100 DAI
    expect(useMaxAmountSpend({ currencyAmount: tokenAmount })).toBe(tokenAmount)
  })

  it('reserves gas for native tokens', () => {
    // Create an amount that's larger than typical gas reservation
    const nativeAmount = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, '1000000000000000000') // 1 ETH
    const spendableAmount = useMaxAmountSpend({ currencyAmount: nativeAmount })

    expect(spendableAmount).toBeDefined()
    expect(JSBI.lessThan(spendableAmount!.quotient, nativeAmount.quotient)).toBe(true)
    expect(JSBI.greaterThan(spendableAmount!.quotient, JSBI.BigInt(0))).toBe(true)
  })

  it('returns zero when amount is less than gas reservation', () => {
    // Create a tiny amount that's definitely less than gas reservation
    const tinyAmount = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, '1000') // 0.000000000000001 ETH
    const spendableAmount = useMaxAmountSpend({ currencyAmount: tinyAmount })

    expect(spendableAmount).toBeDefined()
    expect(spendableAmount!.quotient.toString()).toBe('0')
  })

  it('reserves more gas when isExtraTx is true', () => {
    // Mock the multiplier to be 150% for testing
    mockUseDynamicConfigValue.mockImplementation(({ key, defaultValue }) => {
      if (key === 'lowBalanceWarningGasPercentage') {
        return 150 // 150% = 1.5x gas reservation
      }
      return defaultValue
    })

    const amount = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, '1000000000000000000') // 1 ETH

    const normalSpend = useMaxAmountSpend({ currencyAmount: amount, isExtraTx: false })
    const extraTxSpend = useMaxAmountSpend({ currencyAmount: amount, isExtraTx: true })

    expect(normalSpend).toBeDefined()
    expect(extraTxSpend).toBeDefined()
    // Extra tx should leave less spendable amount (more gas reserved)
    expect(JSBI.lessThan(extraTxSpend!.quotient, normalSpend!.quotient)).toBe(true)
  })

  it('uses different gas amounts for swap vs send transactions', () => {
    const amount = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, '1000000000000000000') // 1 ETH

    const sendSpend = useMaxAmountSpend({ currencyAmount: amount, txType: TransactionType.Send })
    const swapSpend = useMaxAmountSpend({ currencyAmount: amount, txType: TransactionType.Swap })

    expect(sendSpend).toBeDefined()
    expect(swapSpend).toBeDefined()
    // Swaps typically require more gas than sends, so less should be spendable
    expect(JSBI.lessThan(swapSpend!.quotient, sendSpend!.quotient)).toBe(true)
  })

  it('respects dynamic config overrides', () => {
    const amount = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, '1000000000000000000') // 1 ETH

    // First test with default config
    mockUseDynamicConfigValue.mockImplementation(({ defaultValue }) => defaultValue)
    const defaultSpend = useMaxAmountSpend({ currencyAmount: amount })

    // Then test with overridden config (10x the gas reservation)
    mockUseDynamicConfigValue.mockImplementation(({ defaultValue }) => {
      if (typeof defaultValue === 'number') {
        return defaultValue * 10
      }
      return defaultValue
    })
    const overriddenSpend = useMaxAmountSpend({ currencyAmount: amount })

    expect(defaultSpend).toBeDefined()
    expect(overriddenSpend).toBeDefined()
    // With 10x gas reservation, less should be spendable
    expect(JSBI.lessThan(overriddenSpend!.quotient, defaultSpend!.quotient)).toBe(true)
  })

  it('handles chains with different decimal places correctly', () => {
    // Test with Solana (9 decimals) - 1 SOL
    const solanaAmount = CurrencyAmount.fromRawAmount(SOLANA_CURRENCY, '1000000000') // 1 SOL
    const solanaSpend = useMaxAmountSpend({ currencyAmount: solanaAmount })

    // Test with Ethereum (18 decimals) - 1 ETH
    const ethAmount = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, '1000000000000000000') // 1 ETH
    const ethSpend = useMaxAmountSpend({ currencyAmount: ethAmount })

    expect(solanaSpend).toBeDefined()
    expect(ethSpend).toBeDefined()

    // Both should have gas reserved (amount reduced)
    expect(JSBI.lessThan(solanaSpend!.quotient, solanaAmount.quotient)).toBe(true)
    expect(JSBI.lessThan(ethSpend!.quotient, ethAmount.quotient)).toBe(true)

    // Both should still have spendable amounts
    expect(JSBI.greaterThan(solanaSpend!.quotient, JSBI.BigInt(0))).toBe(true)
    expect(JSBI.greaterThan(ethSpend!.quotient, JSBI.BigInt(0))).toBe(true)
  })

  it('applies both isExtraTx and txType modifiers correctly', () => {
    // Mock the multiplier to be 150% for testing
    mockUseDynamicConfigValue.mockImplementation(({ key, defaultValue }) => {
      if (key === 'lowBalanceWarningGasPercentage') {
        return 150 // 150% = 1.5x gas reservation
      }
      return defaultValue
    })

    const amount = CurrencyAmount.fromRawAmount(MAINNET_CURRENCY, '1000000000000000000') // 1 ETH

    // Test all combinations
    const sendNormal = useMaxAmountSpend({
      currencyAmount: amount,
      txType: TransactionType.Send,
      isExtraTx: false,
    })
    const sendExtra = useMaxAmountSpend({
      currencyAmount: amount,
      txType: TransactionType.Send,
      isExtraTx: true,
    })
    const swapNormal = useMaxAmountSpend({
      currencyAmount: amount,
      txType: TransactionType.Swap,
      isExtraTx: false,
    })
    const swapExtra = useMaxAmountSpend({
      currencyAmount: amount,
      txType: TransactionType.Swap,
      isExtraTx: true,
    })

    // Verify the expected ordering: sendNormal > sendExtra > swapNormal > swapExtra
    expect(JSBI.greaterThan(sendNormal!.quotient, sendExtra!.quotient)).toBe(true)
    expect(JSBI.greaterThan(sendExtra!.quotient, swapNormal!.quotient)).toBe(true)
    expect(JSBI.greaterThan(swapNormal!.quotient, swapExtra!.quotient)).toBe(true)
  })
})
