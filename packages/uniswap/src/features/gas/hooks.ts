import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { GasStrategy } from '@universe/api'
import { BigNumber, providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FormattedUniswapXGasFeeInfo, GasFeeResult } from 'uniswap/src/features/gas/types'
import { getActiveGasStrategy, hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { GasStrategyType } from 'uniswap/src/features/gating/configs'
import { useStatsigClientStatus } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { useUSDCValueWithStatus } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { isWebPlatform } from 'utilities/src/platform'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export { getActiveGasStrategy }

export const SMART_WALLET_DELEGATION_GAS_FEE = 21500

export type CancellationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  gasFeeDisplayValue: string
}

// Hook to use active GasStrategy for a specific chain.
export function useActiveGasStrategy(chainId: number | undefined, type: GasStrategyType): GasStrategy {
  const { isStatsigReady } = useStatsigClientStatus()
  return useMemo(() => getActiveGasStrategy({ chainId, type, isStatsigReady }), [isStatsigReady, chainId, type])
}

/**
 * Converts a gas fee calculated with the provided gas strategy to a display value.
 * When calculating the gas fee, the gas limit is multiplied by the `limitInflationFactor`,
 * but in the vast majority of cases, the transaction uses only the originally estimated gas limit.
 * We use the `displayLimitInflationFactor` to calculate the display value, which can be
 * different from the `limitInflationFactor` so that the gas fee displayed is more accurate.
 *
 * More info: https://www.notion.so/uniswaplabs/Gas-Limit-Experiment-14ac52b2548b80ea932ff2edfdab6683
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

export function useTransactionGasFee({
  tx,
  smartContractDelegationAddress,
  skip,
  refetchInterval,
  fallbackGasLimit,
  // Warning: only use when it's Ok to return old data even when params change.
  shouldUsePreviousValueDuringLoading,
}: {
  tx: providers.TransactionRequest | undefined
  smartContractDelegationAddress?: Address
  skip?: boolean
  refetchInterval?: PollingInterval
  fallbackGasLimit?: number
  shouldUsePreviousValueDuringLoading?: boolean
}): GasFeeResult {
  const pollingIntervalForChain = usePollingIntervalByChain(tx?.chainId)

  const { data, error, isLoading } = useGasFeeQuery({
    params: skip || !tx ? undefined : { tx, fallbackGasLimit, smartContractDelegationAddress },
    refetchInterval,
    staleTime: pollingIntervalForChain,
    immediateGcTime: pollingIntervalForChain + 15 * ONE_SECOND_MS,
    shouldUsePreviousValueDuringLoading,
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
    currency: chainId ? nativeOnChain(chainId) : undefined,
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
    currency: chainId ? nativeOnChain(chainId) : undefined,
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
      Number(approvalCostUsd ?? 0) + Number(uniswapXGasBreakdown.classicGasUseEstimateUSD ?? 0)
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
  accountAddress,
  derivedInfo,
  gasFee,
  skipGasCheck = false,
}: {
  accountAddress?: Address
  derivedInfo: DerivedSwapInfo | DerivedSendInfo
  gasFee?: string
  skipGasCheck?: boolean
}): Warning | undefined {
  const { chainId, currencyAmounts, currencyBalances } = derivedInfo
  const { t } = useTranslation()
  const { balance: nativeCurrencyBalance } = useOnChainNativeCurrencyBalance(chainId, accountAddress)
  const { isSmartContractAddress } = useIsSmartContractAddress(accountAddress, chainId)

  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]

  // insufficient funds for gas
  const nativeAmountIn = currencyAmountIn?.currency.isNative
    ? (currencyAmountIn as CurrencyAmount<Currency>)
    : undefined
  const hasGasFunds = hasSufficientFundsIncludingGas({
    transactionAmount: nativeAmountIn,
    gasFee,
    nativeCurrencyBalance,
  })
  const balanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)

  return useMemo(() => {
    // Skip gas check if explicitly requested (e.g., for wallets that can pay fees in any token)
    if (skipGasCheck) {
      return undefined
    }

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
      buttonText: isWebPlatform
        ? t('swap.warning.insufficientGas.button', {
            currencySymbol,
          })
        : undefined,
      message: undefined,
      currency: nativeCurrencyBalance.currency,
    }
  }, [gasFee, isSmartContractAddress, balanceInsufficient, nativeCurrencyBalance, hasGasFunds, t, skipGasCheck])
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

  const nativeCurrency = nativeOnChain(chainId)
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
      return gasFee.isLoading || gasFeeUSDIsLoading ? emptyState : `${nativeAmountFormatted} ${nativeCurrency.symbol}`
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
