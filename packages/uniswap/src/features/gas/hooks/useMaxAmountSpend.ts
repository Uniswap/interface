import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { GENERIC_L2_GAS_CONFIG } from 'uniswap/src/features/chains/gasDefaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DynamicConfigs, SwapConfigKey } from 'uniswap/src/features/gating/configs'
import { useDynamicConfigValue } from 'uniswap/src/features/gating/hooks'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 * @param transactionType to determine cost of transaction
 * @param isExtraTx adds a gas buffer to cover one additional transaction
 */
export function useMaxAmountSpend({
  currencyAmount,
  txType,
  isExtraTx = false,
}: {
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  txType?: TransactionType
  isExtraTx?: boolean
}): Maybe<CurrencyAmount<Currency>> {
  const minAmountPerTx = useMinGasAmount(currencyAmount?.currency.chainId, txType)
  const multiplierAsPercent = useLowBalanceWarningGasPercentage()

  if (!currencyAmount || !minAmountPerTx) {
    return undefined
  }

  // if isExtraTx: minAmountPerTx * multiplierAsPercent / 100%
  // else: minAmountPerTx
  const minAmount = JSBI.divide(
    JSBI.multiply(minAmountPerTx, JSBI.BigInt(isExtraTx ? multiplierAsPercent : 100)),
    JSBI.BigInt(100),
  )

  if (!currencyAmount.currency.isNative) {
    return currencyAmount
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

export function useMinGasAmount(chainId?: UniverseChainId, txType?: TransactionType): JSBI | undefined {
  // Always determine config at the top level to avoid conditional hook calls
  const gasConfig = chainId ? getChainInfo(chainId).gasConfig : GENERIC_L2_GAS_CONFIG

  const variant = isSend(txType) ? 'send' : 'swap'
  const key = gasConfig[variant].configKey
  const defaultAmount = gasConfig[variant].default

  // Always call the hook, but return undefined for unsupported cases
  const result = useCalculateMinForGas({ key, defaultAmount, chainId })

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
  chainId?: UniverseChainId
}): JSBI {
  const { key, defaultAmount, chainId } = config
  const multiplier = useDynamicConfigValue({ config: DynamicConfigs.Swap, key, defaultValue: defaultAmount })

  // Get the native currency decimals for the specific chain
  const decimals = chainId ? getChainInfo(chainId).nativeCurrency.decimals : 18
  // TODO(SWAP-559): remove arbitrary decimal offset after updating swap config patterns
  const decimalOffset = decimals - 4

  return JSBI.multiply(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimalOffset)), JSBI.BigInt(multiplier))
}

function isSend(transactionType?: TransactionType): boolean {
  return transactionType === TransactionType.Send
}
