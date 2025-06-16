import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { BigNumber, providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'nexttrade/src/components/modals/WarningModal/types'
import { PollingInterval } from 'nexttrade/src/constants/misc'
import { useGasFeeQuery } from 'nexttrade/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { GasStrategy } from 'nexttrade/src/data/tradingApi/types'
import { AccountMeta } from 'nexttrade/src/features/accounts/types'
import { useIsSmartContractAddress } from 'nexttrade/src/features/address/useIsSmartContractAddress'
import { useEnabledChains } from 'nexttrade/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'nexttrade/src/features/chains/types'
import { FormattedUniswapXGasFeeInfo, GasFeeResult } from 'nexttrade/src/features/gas/types'
import { hasSufficientFundsIncludingGas } from 'nexttrade/src/features/gas/utils'
import { DynamicConfigs, GasStrategies, GasStrategyType } from 'nexttrade/src/features/gating/configs'
import { useStatsigClientStatus } from 'nexttrade/src/features/gating/hooks'
import { getStatsigClient } from 'nexttrade/src/features/gating/sdk/statsig'
import { useLocalizationContext } from 'nexttrade/src/features/language/LocalizationContext'
import { useOnChainNativeCurrencyBalance } from 'nexttrade/src/features/portfolio/api'
import { NativeCurrency } from 'nexttrade/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'nexttrade/src/features/tokens/getCurrencyAmount'
import { usePollingIntervalByChain } from 'nexttrade/src/features/transactions/hooks/usePollingIntervalByChain'
import { useUSDCValueWithStatus } from 'nexttrade/src/features/transactions/hooks/useUSDCPrice'
import { DerivedSendInfo } from 'nexttrade/src/features/transactions/send/types'
import { DerivedSwapInfo } from 'nexttrade/src/features/transactions/swap/types/derivedSwapInfo'
import { UniswapXGasBreakdown } from 'nexttrade/src/features/transactions/swap/types/swapTxAndGasInfo'
import { CurrencyField } from 'nexttrade/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { isWeb } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// The default "Urgent" strategy that was previously hardcoded in the gas service
export const DEFAULT_GAS_STRATEGY: GasStrategy = {
  limitInflationFactor: 1.15,
  displayLimitInflationFactor: 1,
  priceInflationFactor: 1.5,
  percentileThresholdFor1559Fee: 75,
  thresholdToInflateLastBlockBaseFee: 0,
  baseFeeMultiplier: 1.05,
  baseFeeHistoryWindow: 100,
  minPriorityFeeRatioOfBaseFee: undefined,
  minPriorityFeeGwei: 2,
  maxPriorityFeeGwei: 9,
}

export const SMART_WALLET_DELEGATION_GAS_FEE = 21500

export type CancellationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  gasFeeDisplayValue: string
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

// Hook to use active GasStrategy for a specific chain.
export function useActiveGasStrategy(chainId: number | undefined, type: GasStrategyType): GasStrategy {
  const { isStatsigReady } = useStatsigClientStatus()

  return useMemo(() => {
    if (!isStatsigReady) {
      return DEFAULT_GAS_STRATEGY
    }

    const config = getStatsigClient().getDynamicConfig(DynamicConfigs.GasStrategies)
    const gasStrategies = isValidGasStrategies(config.value) ? config.value : undefined
    const activeStrategy = gasStrategies?.strategies.find(
      (s) => s.conditions.chainId === chainId && s.conditions.types === type && s.conditions.isActive,
    )
    return activeStrategy ? activeStrategy.strategy : DEFAULT_GAS_STRATEGY
  }, [isStatsigReady, chainId, type])
}

// Hook to use shadow GasStrategies for a specific chain.
export function useShadowGasStrategies(chainId: number | undefined, type: GasStrategyType): GasStrategy[] {
  const { isStatsigReady } = useStatsigClientStatus()

  return useMemo(() => {
    if (!isStatsigReady) {
      return []
    }

    const config = getStatsigClient().getDynamicConfig(DynamicConfigs.GasStrategies)
    const gasStrategies = isValidGasStrategies(config.value) ? config.value : undefined
    const shadowStrategies = gasStrategies?.strategies
      .filter((s) => s.conditions.chainId === chainId && s.conditions.types === type && !s.conditions.isActive)
      .map((s) => s.strategy)
    return shadowStrategies ?? []
  }, [chainId, isStatsigReady, type])
}

/**
 * Converts a gas fee calculated with the provided gas strategy to a display value.
 * When calculating the gas fee, the gas limit is multiplied by the `limitInflationFactor`,
 * but in the vast majority of cases, the transaction uses only the originally estimated gas limit.
 * We use the `displayLimitInflationFactor` to calculate the display value, which can be
 * different from the `limitInflationFactor` so that the gas fee displayed is more accurate.
 *
 * More info: https://www.notion.so/nexttradelabs/Gas-Limit-Experiment-14ac52b2548b80ea932ff2edfdab6683
 *
 * @param gasFee - The gas fee value to convert.
 * @param gasStrategy - The gas strategy used to calculate the gas fee.
 * @returns The display value of the gas fee.
 */
export function convertGasFeeToDisplayValue(
  gasFee: string | undefined,
  gasStrategy: GasStrategy | undefined,
): string | undefined {
  if (!gasFee || !gasStrategy || gasStrategy.limitInflationFactor === 0) {
    return gasFee
  }

  const PRECISION = 1_000_000
  const { displayLimitInflationFactor, limitInflationFactor } = gasStrategy

  // Scale the inflation factors to integers
  const scaledDisplayFactor = Math.round(displayLimitInflationFactor * PRECISION)
  const scaledLimitFactor = Math.round(limitInflationFactor * PRECISION)

  return BigNumber.from(gasFee)
    .mul(BigNumber.from(scaledDisplayFactor))
    .div(BigNumber.from(scaledLimitFactor))
    .toString()
}

export function useTransactionGasFee(
  tx: providers.TransactionRequest | undefined,
  skip?: boolean,
  refetchInterval?: PollingInterval,
  fallbackGasLimit?: number,
): GasFeeResult {
  const pollingIntervalForChain = usePollingIntervalByChain(tx?.chainId)

  const { data, error, isLoading } = useGasFeeQuery({
    params: skip || !tx ? undefined : { tx, fallbackGasLimit },
    refetchInterval,
    staleTime: pollingIntervalForChain,
    immediateGcTime: pollingIntervalForChain + 15 * ONE_SECOND_MS,
  })

  // TODO(WALL-6421): Remove spread once GasFeeResult shape is decoupled from state fields
  return useMemo(() => ({ ...data, error, isLoading }), [data, error, isLoading])
}

export function useUSDValueOfGasFee(
  chainId?: UniverseChainId,
  feeValueInWei?: string,
): { isLoading: boolean; value: string | undefined } {
  const currencyAmount = getCurrencyAmount({
    value: feeValueInWei,
    valueType: ValueType.Raw,
    currency: chainId ? NativeCurrency.onChain(chainId) : undefined,
  })
  const { value, isLoading } = useUSDCValueWithStatus(currencyAmount)
  return { isLoading, value: value?.toExact() }
}

// Same as useUSDValueOfGasFee, but returns a CurrencyAmount<Currency> instead of a string
export function useUSDCurrencyAmountOfGasFee(
  chainId?: UniverseChainId,
  feeValueInWei?: string,
): CurrencyAmount<Currency> | null {
  const currencyAmount = getCurrencyAmount({
    value: feeValueInWei,
    valueType: ValueType.Raw,
    currency: chainId ? NativeCurrency.onChain(chainId) : undefined,
  })
  const { value } = useUSDCValueWithStatus(currencyAmount)
  return value
}

export function useFormattedUniswapXGasFeeInfo(
  uniswapXGasBreakdown: UniswapXGasBreakdown | undefined,
  chainId: UniverseChainId,
): FormattedUniswapXGasFeeInfo | undefined {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const { value: approvalCostUsd } = useUSDValueOfGasFee(chainId, uniswapXGasBreakdown?.approvalCost)

  return useMemo(() => {
    if (!uniswapXGasBreakdown) {
      return undefined
    }
    const { approvalCost, inputTokenSymbol } = uniswapXGasBreakdown
    // If this swap was done via classic routing, the total gas fee would have been approval gas fee + classic swap gas fee.
    const preSavingsGasCostUsd =
      Number(approvalCostUsd ?? 0) + Number(uniswapXGasBreakdown?.classicGasUseEstimateUSD ?? 0)
    const preSavingsGasFeeFormatted = convertFiatAmountFormatted(preSavingsGasCostUsd, NumberType.FiatGasPrice)

    // Swap submission will always cost 0, since it's not an on-chain tx.
    const swapFeeFormatted = convertFiatAmountFormatted(0, NumberType.FiatGasPrice)

    return {
      approvalFeeFormatted: approvalCost
        ? convertFiatAmountFormatted(approvalCostUsd, NumberType.FiatGasPrice)
        : undefined,
      preSavingsGasFeeFormatted,
      swapFeeFormatted,
      inputTokenSymbol,
    }
  }, [uniswapXGasBreakdown, approvalCostUsd, convertFiatAmountFormatted])
}

export function useGasFeeHighRelativeToValue(
  gasFeeUSD: string | undefined,
  value: Maybe<CurrencyAmount<Currency>>,
): boolean {
  return useMemo(() => {
    if (!value) {
      return false
    }
    const tenthOfOutputValue = parseFloat(value.toExact()) / 10
    return Number(gasFeeUSD ?? 0) > tenthOfOutputValue
  }, [gasFeeUSD, value])
}

export function useTransactionGasWarning({
  account,
  derivedInfo,
  gasFee,
}: {
  account?: AccountMeta
  derivedInfo: DerivedSwapInfo | DerivedSendInfo
  gasFee?: string
}): Warning | undefined {
  const { chainId, currencyAmounts, currencyBalances } = derivedInfo
  const { t } = useTranslation()
  const { balance: nativeCurrencyBalance } = useOnChainNativeCurrencyBalance(chainId, account?.address)
  const { isSmartContractAddress } = useIsSmartContractAddress(account?.address, chainId)

  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]

  // insufficient funds for gas
  const nativeAmountIn = currencyAmountIn?.currency.isNative
    ? (currencyAmountIn as CurrencyAmount<NativeCurrency>)
    : undefined
  const hasGasFunds = hasSufficientFundsIncludingGas({
    transactionAmount: nativeAmountIn,
    gasFee,
    nativeCurrencyBalance,
  })
  const balanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)

  return useMemo(() => {
    // if balance is already insufficient, dont need to show warning about network fee
    if (
      gasFee === undefined ||
      isSmartContractAddress ||
      balanceInsufficient ||
      !nativeCurrencyBalance ||
      hasGasFunds
    ) {
      return undefined
    }
    const currencySymbol = nativeCurrencyBalance.currency.symbol ?? ''

    return {
      type: WarningLabel.InsufficientGasFunds,
      severity: WarningSeverity.Medium,
      action: WarningAction.DisableSubmit,
      title: t('swap.warning.insufficientGas.title', {
        currencySymbol,
      }),
      buttonText: isWeb
        ? t('swap.warning.insufficientGas.button', {
            currencySymbol,
          })
        : undefined,
      message: undefined,
      currency: nativeCurrencyBalance.currency,
    }
  }, [gasFee, isSmartContractAddress, balanceInsufficient, nativeCurrencyBalance, hasGasFunds, t])
}

type GasFeeFormattedAmounts<T extends string | undefined> = T extends string
  ? { gasFeeUSD: string | undefined; gasFeeFormatted: string }
  : { gasFeeUSD: string | undefined; gasFeeFormatted: string | null }

/**
 * Returns formatted fiat amounts based on a gas fee. Will format a USD price if a quote
 * is available, otherwise will return a formatted native currency amount.
 *
 * If no placeholder is defined, the response can be null. If a placeholder is defined,
 * the gas fee amount will always be a string.
 */
export function useGasFeeFormattedDisplayAmounts<T extends string | undefined>({
  gasFee,
  chainId,
  placeholder,
}: {
  gasFee: GasFeeResult | undefined
  chainId: UniverseChainId
  placeholder: T
  includesDelegation?: boolean
}): GasFeeFormattedAmounts<T> {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const { value: gasFeeUSD, isLoading: gasFeeUSDIsLoading } = useUSDValueOfGasFee(chainId, gasFee?.displayValue)

  // In testnet mode, use native currency values as USD pricing may be unreliable
  const { isTestnetModeEnabled } = useEnabledChains()

  const nativeCurrency = NativeCurrency.onChain(chainId)
  const nativeCurrencyAmount = getCurrencyAmount({
    currency: nativeCurrency,
    value: gasFee?.displayValue,
    valueType: ValueType.Raw,
  })

  const fiatAmountFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const nativeAmountFormatted = formatNumberOrString({
    value: nativeCurrencyAmount?.toExact(),
    type: NumberType.TokenNonTx,
  })

  const emptyState = placeholder ?? null

  const gasFeeFormatted = useMemo(() => {
    // Gas fee not available
    if (!gasFee?.displayValue) {
      return emptyState
    }

    // Gas fee available, USD not available - return native currency amount (always do this in testnet mode)
    if (!gasFeeUSD || isTestnetModeEnabled) {
      return gasFee?.isLoading || gasFeeUSDIsLoading ? emptyState : `${nativeAmountFormatted} ${nativeCurrency.symbol}`
    }

    // Gas fee and USD both available
    return fiatAmountFormatted
  }, [
    emptyState,
    fiatAmountFormatted,
    gasFee?.isLoading,
    gasFee?.displayValue,
    gasFeeUSD,
    gasFeeUSDIsLoading,
    isTestnetModeEnabled,
    nativeAmountFormatted,
    nativeCurrency.symbol,
  ])

  return {
    gasFeeUSD,
    gasFeeFormatted,
  } as GasFeeFormattedAmounts<T>
}
