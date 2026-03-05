import type { TransactionRequest } from '@ethersproject/providers'
import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import {
  type GasEstimate,
  type GasFeeResult,
  type GasFeeResultWithoutState,
  type GasStrategy,
  type TransactionEip1559FeeParams,
  type TransactionLegacyFeeParams,
} from '@universe/api'
import {
  DynamicConfigs,
  type GasStrategies,
  type GasStrategyType,
  type GasStrategyWithConditions,
  getStatsigClient,
} from '@universe/gating'
import JSBI from 'jsbi'
import { createEthersProvider } from 'uniswap/src/features/providers/createEthersProvider'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { type Prettify } from 'viem'

// Normal speed strategy - Lower multipliers for economical transactions
export const NORMAL_GAS_STRATEGY: GasStrategy = {
  limitInflationFactor: 1.1,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.1,
  percentileThresholdFor1559Fee: 50,
  thresholdToInflateLastBlockBaseFee: 0.9,
  baseFeeMultiplier: 1,
  baseFeeHistoryWindow: 20,
  minPriorityFeeRatioOfBaseFee: 0.1,
  minPriorityFeeGwei: 1,
  maxPriorityFeeGwei: 5,
}

// Fast speed strategy - Moderate multipliers for balanced speed/cost
export const FAST_GAS_STRATEGY: GasStrategy = {
  limitInflationFactor: 1.12,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.25,
  percentileThresholdFor1559Fee: 60,
  thresholdToInflateLastBlockBaseFee: 0.8,
  baseFeeMultiplier: 1,
  baseFeeHistoryWindow: 20,
  minPriorityFeeRatioOfBaseFee: 0.15,
  minPriorityFeeGwei: 1.5,
  maxPriorityFeeGwei: 7,
}

// Urgent speed strategy - Higher multipliers for fast confirmation
export const URGENT_GAS_STRATEGY: GasStrategy = {
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

// The default "Urgent" strategy that was previously hardcoded in the gas service
export const DEFAULT_GAS_STRATEGY: GasStrategy = URGENT_GAS_STRATEGY

export enum GasSpeed {
  Normal = 'normal',
  Fast = 'fast',
  Urgent = 'urgent',
}

export const GAS_SPEED_STRATEGIES: Record<GasSpeed, GasStrategy> = {
  [GasSpeed.Normal]: NORMAL_GAS_STRATEGY,
  [GasSpeed.Fast]: FAST_GAS_STRATEGY,
  [GasSpeed.Urgent]: URGENT_GAS_STRATEGY,
} as const

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

export function areEqualGasStrategies(a?: GasStrategy, b?: GasStrategy): boolean {
  if (!a || !b) {
    return false
  }

  const optionalFieldMatch = <T>(fieldA: T | undefined | null, fieldB: T | undefined | null): boolean => {
    return fieldA == null || fieldB == null || fieldA === fieldB
  }

  // Required fields must be exactly equal
  const requiredFieldsEqual =
    a.limitInflationFactor === b.limitInflationFactor &&
    a.priceInflationFactor === b.priceInflationFactor &&
    a.percentileThresholdFor1559Fee === b.percentileThresholdFor1559Fee

  // Optional fields can be undefined on either side or equal if both defined
  const optionalFieldsMatch =
    optionalFieldMatch(a.thresholdToInflateLastBlockBaseFee, b.thresholdToInflateLastBlockBaseFee) &&
    optionalFieldMatch(a.baseFeeMultiplier, b.baseFeeMultiplier) &&
    optionalFieldMatch(a.baseFeeHistoryWindow, b.baseFeeHistoryWindow) &&
    optionalFieldMatch(a.minPriorityFeeRatioOfBaseFee, b.minPriorityFeeRatioOfBaseFee) &&
    optionalFieldMatch(a.minPriorityFeeGwei, b.minPriorityFeeGwei) &&
    optionalFieldMatch(a.maxPriorityFeeGwei, b.maxPriorityFeeGwei)

  // displayLimitInflationFactor is not returned by the server, so it's ignored here
  return requiredFieldsEqual && optionalFieldsMatch
}

export function getGasPrice(estimate?: GasEstimate): string | undefined {
  return estimate && 'gasPrice' in estimate ? estimate.gasPrice : (estimate?.maxFeePerGas ?? undefined)
}

export type ValidatedGasFeeResult = Prettify<GasFeeResult & { value: string; error: null }>
export function validateGasFeeResult(gasFee: GasFeeResult): ValidatedGasFeeResult | undefined {
  if (gasFee.value === undefined || gasFee.error) {
    return undefined
  }
  return { ...gasFee, value: gasFee.value, error: null }
}

export async function estimateGasWithClientSideProvider({
  tx,
  fallbackGasLimit,
}: {
  tx: TransactionRequest
  fallbackGasLimit?: number
}): Promise<GasFeeResultWithoutState> {
  try {
    if (!tx.chainId) {
      throw new Error('No chainId for clientside gas estimation')
    }
    const provider = createEthersProvider({ chainId: tx.chainId })
    if (!provider) {
      throw new Error('No provider for clientside gas estimation')
    }
    const gasUseEstimate = (await provider.estimateGas(tx)).toNumber() * 10e9

    return {
      value: gasUseEstimate.toString(),
      displayValue: gasUseEstimate.toString(),
    }
  } catch {
    // provider.estimateGas will error if the account doesn't have sufficient ETH balance, but we should show an estimated cost anyway
    return {
      value: fallbackGasLimit?.toString(),
      // These estimates don't inflate the gas limit, so we can use the same value for display
      displayValue: fallbackGasLimit?.toString(),
    }
  }
}

export function extractGasFeeParams(estimate: GasEstimate): TransactionLegacyFeeParams | TransactionEip1559FeeParams {
  if ('maxFeePerGas' in estimate) {
    return {
      maxFeePerGas: estimate.maxFeePerGas,
      maxPriorityFeePerGas: estimate.maxPriorityFeePerGas,
      gasLimit: estimate.gasLimit,
    }
  } else {
    return {
      gasPrice: estimate.gasPrice,
      gasLimit: estimate.gasLimit,
    }
  }
}

/**
 * Determines if gas estimation has failed for a transaction request.
 * Returns true when:
 * - The request is a transaction type that requires gas estimation
 * - Gas fee result has finished loading
 * - Either an error occurred OR no value was returned
 */
export function hasGasEstimationFailed(isTransactionRequest: boolean, gasFeeResult: GasFeeResult | undefined): boolean {
  return (
    isTransactionRequest && !!gasFeeResult && !gasFeeResult.isLoading && (!!gasFeeResult.error || !gasFeeResult.value)
  )
}
