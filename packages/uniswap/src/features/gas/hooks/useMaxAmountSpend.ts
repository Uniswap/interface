import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { DynamicConfigs, SwapConfigKey, useDynamicConfigValue } from '@universe/gating'
import JSBI from 'jsbi'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { GENERIC_L2_GAS_CONFIG } from 'uniswap/src/features/chains/gasDefaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

// Buffer added on top of actual gas estimates to account for estimation variance
const ACTUAL_GAS_FEE_BUFFER_PERCENT = 10

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 * @param transactionType to determine cost of transaction
 * @param isExtraTx adds a gas buffer to cover one additional transaction
 * @param actualGasFee optional gas fee in wei from backend simulation, used instead of static reservation
 */
export function useMaxAmountSpend({
  currencyAmount,
  txType,
  isExtraTx = false,
  actualGasFee,
}: {
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  txType?: TransactionType
  isExtraTx?: boolean
  actualGasFee?: string
}): Maybe<CurrencyAmount<Currency>> {
  const chainId = currencyAmount?.currency.chainId
  const gasToken = chainId !== undefined ? getChainGasToken(chainId) : undefined
  const minAmountPerTx = useMinGasAmount({ chainId, txType, gasTokenDecimals: gasToken?.decimals })
  const multiplierAsPercent = useLowBalanceWarningGasPercentage()

  if (!currencyAmount) {
    return undefined
  }

  // Only reserve gas when spending the chain's gas token (native on most chains, pathUSD on Tempo).
  // The chainId guard is redundant (gasToken is only set when chainId !== undefined) but
  // included so TypeScript narrows both variables for the branches below.
  if (!gasToken || chainId === undefined || !currencyAmount.currency.equals(gasToken)) {
    return currencyAmount
  }

  let minAmount: JSBI

  if (actualGasFee) {
    // actualGasFee is in native currency units (e.g. 18-decimal "attodollars" on Tempo).
    // Convert to gas token units when decimals differ (e.g. pathUSD has 6 decimals).
    const gasFeeInGasTokenUnits = convertGasFeeToGasTokenUnits({ chainId, gasFee: actualGasFee, gasToken })
    const buffer = JSBI.divide(
      JSBI.multiply(gasFeeInGasTokenUnits, JSBI.BigInt(ACTUAL_GAS_FEE_BUFFER_PERCENT)),
      JSBI.BigInt(100),
    )
    minAmount = JSBI.add(gasFeeInGasTokenUnits, buffer)
  } else if (minAmountPerTx) {
    // Fall back to static reservation (already in gas token units via useMinGasAmount)
    // if isExtraTx: minAmountPerTx * multiplierAsPercent / 100%
    // else: minAmountPerTx
    minAmount = JSBI.divide(
      JSBI.multiply(minAmountPerTx, JSBI.BigInt(isExtraTx ? multiplierAsPercent : 100)),
      JSBI.BigInt(100),
    )
  } else {
    return undefined
  }

  // If amount is negative then set it to 0
  const amount = JSBI.greaterThan(currencyAmount.quotient, minAmount)
    ? JSBI.subtract(currencyAmount.quotient, minAmount).toString()
    : '0'

  return getCurrencyAmount({
    value: amount,
    valueType: ValueType.Raw,
    currency: currencyAmount.currency,
  })
}

/**
 * Convert a gas fee from native currency units to gas token units.
 * On most chains these are the same (both 18-decimal). On Tempo, gas fees arrive in
 * 18-decimal "attodollars" but the gas token (pathUSD) is 6-decimal.
 * Uses ceiling division so we never underestimate the reservation.
 */
function convertGasFeeToGasTokenUnits({
  chainId,
  gasFee,
  gasToken,
}: {
  chainId: UniverseChainId
  gasFee: string
  gasToken: Currency
}): JSBI {
  const nativeDecimals = getChainInfo(chainId).nativeCurrency.decimals
  const gasTokenDecimals = gasToken.decimals
  const gasFeeBI = JSBI.BigInt(gasFee)

  // Today gasTokenDecimals <= nativeDecimals for all chains (e.g. pathUSD 6 < native 18).
  // If a future chain has gasTokenDecimals > nativeDecimals we'd need to multiply up.
  if (gasTokenDecimals > nativeDecimals) {
    throw new Error(
      `Unsupported: gas token decimals (${gasTokenDecimals}) > native decimals (${nativeDecimals}) on chain ${chainId}`,
    )
  }

  if (gasTokenDecimals === nativeDecimals) {
    return gasFeeBI
  }

  // Ceiling division: ceil(gasFee / 10^(nativeDecimals - gasTokenDecimals))
  const shift = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(nativeDecimals - gasTokenDecimals))
  return JSBI.divide(JSBI.add(gasFeeBI, JSBI.subtract(shift, JSBI.BigInt(1))), shift)
}

export function useMinGasAmount({
  chainId,
  txType,
  gasTokenDecimals,
}: {
  chainId?: UniverseChainId
  txType?: TransactionType
  gasTokenDecimals?: number
}): JSBI | undefined {
  // Always determine config at the top level to avoid conditional hook calls
  const gasConfig = chainId ? getChainInfo(chainId).gasConfig : GENERIC_L2_GAS_CONFIG

  const variant = isSend(txType) ? 'send' : 'swap'
  const key = gasConfig[variant].configKey
  const defaultAmount = gasConfig[variant].default

  // Always call the hook, but return undefined for unsupported cases
  const result = useCalculateMinForGas({ key, defaultAmount, gasTokenDecimals })

  return chainId ? result : undefined
}

export function useLowBalanceWarningGasPercentage(): number {
  return useDynamicConfigValue({
    config: DynamicConfigs.Swap,
    key: SwapConfigKey.LowBalanceWarningGasPercentage,
    defaultValue: 100,
  })
}

export function useCalculateMinForGas(config: {
  key: SwapConfigKey
  defaultAmount: number
  gasTokenDecimals?: number
}): JSBI {
  const { key, defaultAmount, gasTokenDecimals } = config
  const multiplier = useDynamicConfigValue({ config: DynamicConfigs.Swap, key, defaultValue: defaultAmount })

  // Use gas token decimals so the reservation is in the correct units
  // (e.g. 6 for pathUSD on Tempo, 18 for ETH on mainnet)
  const decimals = gasTokenDecimals ?? 18
  // TODO(SWAP-559): remove arbitrary decimal offset after updating swap config patterns
  const decimalOffset = decimals - 4

  return JSBI.multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimalOffset)), JSBI.BigInt(multiplier))
}

function isSend(transactionType?: TransactionType): boolean {
  return transactionType === TransactionType.Send
}
