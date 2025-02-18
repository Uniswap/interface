import { CurrencyAmount, NativeCurrency } from '@uniswap/sdk-core'
import { GasEstimate } from 'uniswap/src/data/tradingApi/types'
import { areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import {
  DynamicConfigs,
  GasStrategies,
  GasStrategyType,
  GasStrategyWithConditions,
} from 'uniswap/src/features/gating/configs'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'

function getNativeCurrencyTotalSpend(
  value?: CurrencyAmount<NativeCurrency>,
  gasFee?: string,
  nativeCurrency?: NativeCurrency,
): Maybe<CurrencyAmount<NativeCurrency>> {
  if (!gasFee || !nativeCurrency) {
    return value
  }

  const gasFeeAmount = getCurrencyAmount({
    value: gasFee,
    valueType: ValueType.Raw,
    currency: nativeCurrency,
  })

  return value && gasFeeAmount ? gasFeeAmount.add(value) : gasFeeAmount
}

export function hasSufficientFundsIncludingGas(params: {
  transactionAmount?: CurrencyAmount<NativeCurrency>
  gasFee?: string
  nativeCurrencyBalance?: CurrencyAmount<NativeCurrency>
}): boolean {
  const { transactionAmount, gasFee, nativeCurrencyBalance } = params
  const totalSpend = getNativeCurrencyTotalSpend(transactionAmount, gasFee, nativeCurrencyBalance?.currency)
  return !totalSpend || !nativeCurrencyBalance?.lessThan(totalSpend)
}

// Function to find the name of a gas strategy based on the GasEstimate
export function findLocalGasStrategy(
  gasEstimate: GasEstimate,
  type: GasStrategyType,
): GasStrategyWithConditions | undefined {
  const gasStrategies = Statsig.getConfig(DynamicConfigs.GasStrategies).value as GasStrategies
  return gasStrategies.strategies.find(
    (s) => s.conditions.types === type && areEqualGasStrategies(s.strategy, gasEstimate.strategy),
  )
}
