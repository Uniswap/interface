import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { GasEstimate, GasStrategy } from '@universe/api'
import {
  DynamicConfigs,
  GasStrategies,
  GasStrategyType,
  GasStrategyWithConditions,
  getStatsigClient,
} from '@universe/gating'
import JSBI from 'jsbi'
import { areEqualGasStrategies } from 'uniswap/src/features/gas/types'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'

// The default "Urgent" strategy that was previously hardcoded in the gas service
export const DEFAULT_GAS_STRATEGY: GasStrategy = {
  limitInflationFactor: 1.15,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.5,
  percentileThresholdFor1559Fee: 75,
  thresholdToInflateLastBlockBaseFee: 0.75,
  baseFeeMultiplier: 1,
  baseFeeHistoryWindow: 20,
  minPriorityFeeRatioOfBaseFee: 0.2,
  minPriorityFeeGwei: 2,
  maxPriorityFeeGwei: 9,
}

export function applyNativeTokenPercentageBuffer(
  currencyAmount: Maybe<CurrencyAmount<Currency>>,
  nativeTokenPercentageBuffer: number,
): Maybe<CurrencyAmount<Currency>> {
  if (!currencyAmount) {
    return undefined
  }

  if (!currencyAmount.currency.isNative) {
    return currencyAmount
  }

  // Calculate the remaining percentage (e.g., for 10% reduction, multiply by 0.9)
  const remainingPercentage = JSBI.subtract(
    JSBI.BigInt(10000),
    JSBI.BigInt(Math.floor(nativeTokenPercentageBuffer * 100)),
  )

  // currencyAmount is 1 ETH (1000000000000000000 wei)
  const totalAmount = currencyAmount.quotient
  // remainingAmount is remainingPercentage * totalAmount
  // or for 10% reduction, it's 900000000000000000 wei
  const remainingAmount = JSBI.divide(JSBI.multiply(totalAmount, remainingPercentage), JSBI.BigInt(10000))

  return getCurrencyAmount({
    value: remainingAmount.toString(),
    valueType: ValueType.Raw,
    currency: currencyAmount.currency,
  })
}

function getNativeCurrencyTotalSpend({
  value,
  gasFee,
  nativeCurrency,
}: {
  value?: CurrencyAmount<Currency>
  gasFee?: string
  nativeCurrency?: Currency
}): Maybe<CurrencyAmount<Currency>> {
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
  transactionAmount?: CurrencyAmount<Currency>
  gasFee?: string
  nativeCurrencyBalance?: CurrencyAmount<Currency>
}): boolean {
  const { transactionAmount, gasFee, nativeCurrencyBalance } = params
  const totalSpend = getNativeCurrencyTotalSpend({
    value: transactionAmount,
    gasFee,
    nativeCurrency: nativeCurrencyBalance?.currency,
  })
  return !totalSpend || !nativeCurrencyBalance?.lessThan(totalSpend)
}

// Function to find the name of a gas strategy based on the GasEstimate
export function findLocalGasStrategy(
  gasEstimate: GasEstimate,
  type: GasStrategyType,
): GasStrategyWithConditions | undefined {
  const gasStrategies = getStatsigClient().getDynamicConfig(DynamicConfigs.GasStrategies).value as GasStrategies
  return gasStrategies.strategies.find(
    (s) => s.conditions.types === type && areEqualGasStrategies(s.strategy, gasEstimate.strategy),
  )
}

// Helper function to check if the config value is a valid GasStrategies object
function isValidGasStrategies(value: unknown): value is GasStrategies {
  return (
    typeof value === 'object' &&
    value !== null &&
    'strategies' in value &&
    Array.isArray((value as GasStrategies).strategies)
  )
}

function getIsStatsigReady(): boolean {
  return getStatsigClient().loadingStatus === 'Ready'
}

export function getActiveGasStrategy({
  chainId,
  type,
  isStatsigReady,
}: {
  chainId: number | undefined
  type: GasStrategyType
  isStatsigReady?: boolean
}): GasStrategy {
  if (isStatsigReady === false || !getIsStatsigReady()) {
    return DEFAULT_GAS_STRATEGY
  }
  const config = getStatsigClient().getDynamicConfig(DynamicConfigs.GasStrategies)
  const gasStrategies = isValidGasStrategies(config.value) ? config.value : undefined
  const activeStrategy = gasStrategies?.strategies.find(
    (s) => s.conditions.chainId === chainId && s.conditions.types === type && s.conditions.isActive,
  )
  return activeStrategy ? activeStrategy.strategy : DEFAULT_GAS_STRATEGY
}
