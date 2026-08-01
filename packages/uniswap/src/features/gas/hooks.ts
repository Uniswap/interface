import { type PartialMessage } from '@bufbuild/protobuf'
import type { Urgency } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { type Currency, type CurrencyAmount } from '@uniswap/sdk-core'
import { type FormattedUniswapXGasFeeInfo, type GasFeeResult, type GasStrategy } from '@universe/api'
import { isWebPlatform } from '@universe/environment'
import { type GasStrategyType, useStatsigClientStatus } from '@universe/gating'
import { type providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/components/modals/WarningModal/types'
import { type PollingInterval } from 'uniswap/src/constants/misc'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { useIsSmartContractAddress } from 'uniswap/src/features/address/useIsSmartContractAddress'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainGasToken, useChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import {
  convertShiftedGasFeeForDisplay,
  getGasFeeDecimalsShift,
  hasShiftedGasToken,
} from 'uniswap/src/features/gas/shiftedGasToken'
import { getActiveGasStrategy, hasSufficientGasBalance } from 'uniswap/src/features/gas/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/hooks/usePollingIntervalByChain'
import { useUSDCValueWithStatus } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { type DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { type DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { type UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export type CancellationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  gasFeeDisplayValue: string
}

// Hook to use active GasStrategy for a specific chain.
export function useActiveGasStrategy(chainId: number | undefined, type: GasStrategyType): GasStrategy {
  const { isStatsigReady } = useStatsigClientStatus()
  return useMemo(() => getActiveGasStrategy({ chainId, type, isStatsigReady }), [isStatsigReady, chainId, type])
}

export function useTransactionGasFee({
  tx,
  smartContractDelegationAddress,
  skip,
  refetchInterval,
  fallbackGasLimit,
  urgency,
  gasLimitOverride,
  // Warning: only use when it's Ok to return old data even when params change.
  shouldUsePreviousValueDuringLoading,
}: {
  tx: providers.TransactionRequest | undefined
  smartContractDelegationAddress?: Address
  skip?: boolean
  refetchInterval?: PollingInterval
  fallbackGasLimit?: number
  /**
   * Optional proto-shape urgency. When supplied alongside the
   * `GasFeeOverrides` feature flag (set in `fetchGasFeeQuery`), the gas
   * service uses these values instead of running its strategy-based
   * estimation. Built via `buildGasServiceUrgencyOverride`.
   */
  urgency?: PartialMessage<Urgency>
  /** Optional top-level gas_limit override. Forwarded to the gas service
   *  alongside `urgency`. Built via `buildGasServiceUrgencyOverride`. */
  gasLimitOverride?: string
  shouldUsePreviousValueDuringLoading?: boolean
}): GasFeeResult {
  const pollingIntervalForChain = usePollingIntervalByChain(tx?.chainId)

  const { data, error, isLoading } = useGasFeeQuery({
    params:
      skip || !tx ? undefined : { tx, fallbackGasLimit, smartContractDelegationAddress, urgency, gasLimitOverride },
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
  const currencyAmount = getGasFeeCurrencyAmount({ chainId, feeValueInWei })
  const { value, isLoading } = useUSDCValueWithStatus(currencyAmount)
  return { isLoading, value: value?.toExact() }
}

// Same as useUSDValueOfGasFee, but returns a CurrencyAmount<Currency> instead of a string
export function useUSDCurrencyAmountOfGasFee(
  chainId?: UniverseChainId,
  feeValueInWei?: string,
): CurrencyAmount<Currency> | null {
  const currencyAmount = getGasFeeCurrencyAmount({ chainId, feeValueInWei })
  const { value } = useUSDCValueWithStatus(currencyAmount)
  return value
}

/**
 * Converts a raw gas fee value into a CurrencyAmount using the correct gas token for the chain.
 *
 * On Tempo, gas is paid in pathUSD (6 decimals) but fees are reported as 18-decimal attodollars,
 * so the value is converted to 6-decimal pathUSD units before wrapping.
 */
function getGasFeeCurrencyAmount({
  chainId,
  feeValueInWei,
}: {
  chainId?: UniverseChainId
  feeValueInWei?: string
}): CurrencyAmount<Currency> | undefined {
  if (!chainId) {
    return undefined
  }
  const gasToken = getChainGasToken(chainId)
  const adjustedFee =
    hasShiftedGasToken(chainId) && feeValueInWei
      ? convertShiftedGasFeeForDisplay(feeValueInWei, getGasFeeDecimalsShift(chainId))
      : feeValueInWei

  return (
    getCurrencyAmount({
      value: adjustedFee,
      valueType: ValueType.Raw,
      currency: gasToken,
    }) ?? undefined
  )
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
    const approvalCostAmount = Number(approvalCost)
    const hasApprovalCost = Number.isFinite(approvalCostAmount) && approvalCostAmount > 0
    // If this swap was done via classic routing, the total gas fee would have been approval gas fee + classic swap gas fee.
    const preSavingsGasCostUsd =
      Number(approvalCostUsd ?? 0) + Number(uniswapXGasBreakdown.classicGasUseEstimateUSD ?? 0)
    const preSavingsGasFeeFormatted = convertFiatAmountFormatted(preSavingsGasCostUsd, NumberType.FiatGasPrice)

    // Swap submission will always cost 0, since it's not an on-chain tx.
    const swapFeeFormatted = convertFiatAmountFormatted(0, NumberType.FiatGasPrice)

    return {
      approvalFeeFormatted: hasApprovalCost
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
  isGasSponsored,
}: {
  accountAddress?: Address
  derivedInfo: DerivedSwapInfo | DerivedSendInfo
  gasFee?: string
  /** When gas is sponsored we skip the native gas-token balance check entirely. */
  isGasSponsored?: boolean
}): Warning | undefined {
  const { chainId, currencyAmounts, currencyBalances } = derivedInfo
  const { t } = useTranslation()

  // Wallets that pay gas via a non-native method don't need a native balance to swap.
  const hasAlternateGasFees = useUniswapContextSelector((ctx) => ctx.getHasAlternateGasFees?.(chainId)) ?? false
  const skipGasBalanceCheck = hasAlternateGasFees || Boolean(isGasSponsored)

  const { gasToken, gasBalance } = useChainGasToken({ chainId, accountAddress })

  const { isSmartContractAddress } = useIsSmartContractAddress(accountAddress, chainId)

  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]

  // Include input amount in gas check when spending the gas token
  // (pathUSD on Tempo, native currency on other chains)
  const gasTokenAmountIn = currencyAmountIn?.currency.equals(gasToken)
    ? (currencyAmountIn as CurrencyAmount<Currency>)
    : undefined
  const hasGasFunds = hasSufficientGasBalance({
    chainId,
    gasBalance,
    gasFee,
    gasTokenTransactionAmount: gasTokenAmountIn,
  })
  const balanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)

  return useMemo(() => {
    if (skipGasBalanceCheck) {
      return undefined
    }

    // if balance is already insufficient, dont need to show warning about network fee
    if (isSmartContractAddress || balanceInsufficient || !gasBalance) {
      return undefined
    }

    // Fire even without a concrete gasFee when gas-token balance is provably zero
    // (e.g. Gas Service v2 refused to estimate because the account is underfunded).
    const gasBalanceIsZero = gasBalance.equalTo(0)
    if (!gasBalanceIsZero && (gasFee === undefined || hasGasFunds)) {
      return undefined
    }

    const currencySymbol = gasBalance.currency.symbol ?? ''

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
      currency: gasBalance.currency,
    }
  }, [gasFee, isSmartContractAddress, balanceInsufficient, gasBalance, hasGasFunds, skipGasBalanceCheck, t])
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

  const gasToken = getChainGasToken(chainId)

  // On chains that pay gas in a non-native shifted token (e.g. Tempo pathUSD, Arc
  // USDC), convert the 18-decimal native gas fee to the gas token's decimals before wrapping.
  const displayValue =
    hasShiftedGasToken(chainId) && gasFee?.displayValue
      ? convertShiftedGasFeeForDisplay(gasFee.displayValue, getGasFeeDecimalsShift(chainId))
      : gasFee?.displayValue

  const gasTokenAmount = getCurrencyAmount({
    currency: gasToken,
    value: displayValue,
    valueType: ValueType.Raw,
  })

  const fiatAmountFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const gasTokenAmountFormatted = formatNumberOrString({
    value: gasTokenAmount?.toExact(),
    type: NumberType.TokenNonTx,
  })

  const emptyState = placeholder ?? null

  const gasFeeFormatted = useMemo(() => {
    // Gas fee not available
    if (!gasFee?.displayValue) {
      return emptyState
    }

    // Gas fee available, USD not available - return gas token amount (always do this in testnet mode)
    if (!gasFeeUSD || isTestnetModeEnabled) {
      return gasFee.isLoading || gasFeeUSDIsLoading ? emptyState : `${gasTokenAmountFormatted} ${gasToken.symbol}`
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
    gasTokenAmountFormatted,
    gasToken.symbol,
  ])

  return {
    gasFeeUSD,
    gasFeeFormatted,
  } as GasFeeFormattedAmounts<T>
}
