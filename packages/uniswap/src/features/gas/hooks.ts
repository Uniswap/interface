import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useConfig } from 'statsig-react'
import { isWeb } from 'ui/src'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { GasEstimate, GasStrategy } from 'uniswap/src/data/tradingApi/__generated__'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import {
  FormattedUniswapXGasFeeInfo,
  GasFeeResult,
  TransactionEip1559FeeParams,
  TransactionLegacyFeeParams,
  areEqualGasStrategies,
} from 'uniswap/src/features/gas/types'
import { hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { DynamicConfigs, GasStrategies, GasStrategyType } from 'uniswap/src/features/gating/configs'
import { Statsig } from 'uniswap/src/features/gating/sdk/statsig'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

// The default "Urgent" strategy that was previously hardcoded in the gas service
export const DEFAULT_GAS_STRATEGY: GasStrategy = {
  limitInflationFactor: 1.15,
  priceInflationFactor: 1.5,
  percentileThresholdFor1559Fee: 75,
  minPriorityFeeGwei: 2,
  maxPriorityFeeGwei: 9,
}

export type CancelationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  cancelationGasFee: string
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
  const { isLoading } = useConfig(DynamicConfigs.GasStrategies)

  return useMemo(() => {
    if (isLoading) {
      return DEFAULT_GAS_STRATEGY
    }

    const config = Statsig.getConfig(DynamicConfigs.GasStrategies)
    const gasStrategies = isValidGasStrategies(config.value) ? config.value : undefined
    const activeStrategy = gasStrategies?.strategies.find(
      (s) => s.conditions.chainId === chainId && s.conditions.types === type && s.conditions.isActive,
    )
    return activeStrategy ? activeStrategy.strategy : DEFAULT_GAS_STRATEGY
  }, [isLoading, chainId, type])
}

// Hook to use shadow GasStrategies for a specific chain.
export function useShadowGasStrategies(chainId: number | undefined, type: GasStrategyType): GasStrategy[] {
  const { isLoading } = useConfig(DynamicConfigs.GasStrategies)

  return useMemo(() => {
    if (isLoading) {
      return []
    }

    const config = Statsig.getConfig(DynamicConfigs.GasStrategies)
    const gasStrategies = isValidGasStrategies(config.value) ? config.value : undefined
    const shadowStrategies = gasStrategies?.strategies
      .filter((s) => s.conditions.chainId === chainId && s.conditions.types === type && !s.conditions.isActive)
      .map((s) => s.strategy)
    return shadowStrategies ?? []
  }, [isLoading, chainId, type])
}

// Function to find the name of a gas strategy based on the GasEstimate
export function findGasStrategyName(gasEstimate: GasEstimate): string | undefined {
  const gasStrategies = Statsig.getConfig(DynamicConfigs.GasStrategies).value as GasStrategies

  const matchingStrategy = gasStrategies.strategies.find((s) => areEqualGasStrategies(s.strategy, gasEstimate.strategy))

  return matchingStrategy?.conditions.name
}

export function useTransactionGasFee(
  tx: providers.TransactionRequest | undefined,
  skip?: boolean,
  refetchInterval?: PollingInterval,
): GasFeeResult {
  const pollingIntervalForChain = usePollingIntervalByChain(tx?.chainId)
  const activeGasStrategy = useActiveGasStrategy(tx?.chainId, 'general')
  const shadowGasStrategies = useShadowGasStrategies(tx?.chainId, 'general')

  const { data, error, isLoading } = useGasFeeQuery({
    params: skip || !tx ? undefined : { ...tx, gasStrategies: [activeGasStrategy, ...(shadowGasStrategies ?? [])] },
    refetchInterval,
    staleTime: pollingIntervalForChain,
    immediateGcTime: pollingIntervalForChain + 15 * ONE_SECOND_MS,
  })

  return useMemo(() => {
    if (!data) {
      return { error: error ?? null, isLoading }
    }

    const activeEstimate = data.gasEstimates?.find((e) => areEqualGasStrategies(e.strategy, activeGasStrategy))

    if (!activeEstimate) {
      return { error: error ?? new Error('Could not get gas estimate'), isLoading }
    }

    return {
      value: activeEstimate.gasFee,
      isLoading,
      error: error ?? null,
      params: extractGasFeeParams(activeEstimate),
      gasEstimates: {
        activeEstimate,
        shadowEstimates: data.gasEstimates?.filter((e) => e !== activeEstimate),
      },
    }
  }, [data, error, isLoading, activeGasStrategy])
}

export function useUSDValue(chainId?: UniverseChainId, ethValueInWei?: string): string | undefined {
  const currencyAmount = getCurrencyAmount({
    value: ethValueInWei,
    valueType: ValueType.Raw,
    currency: chainId ? NativeCurrency.onChain(chainId) : undefined,
  })

  return useUSDCValue(currencyAmount)?.toExact()
}

export function useFormattedUniswapXGasFeeInfo(
  uniswapXGasBreakdown: UniswapXGasBreakdown | undefined,
  chainId: WalletChainId,
): FormattedUniswapXGasFeeInfo | undefined {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const approvalCostUsd = useUSDValue(chainId, uniswapXGasBreakdown?.approvalCost)
  const wrapCostUsd = useUSDValue(chainId, uniswapXGasBreakdown?.wrapCost)

  return useMemo(() => {
    if (!uniswapXGasBreakdown) {
      return undefined
    }
    const { approvalCost, wrapCost, inputTokenSymbol } = uniswapXGasBreakdown
    // Without uniswapx, the swap would have costed approval price + classic swap fee. A separate wrap tx would not have occurred.
    const preSavingsGasCostUsd =
      Number(approvalCostUsd ?? 0) + Number(uniswapXGasBreakdown?.classicGasUseEstimateUSD ?? 0)
    const preSavingsGasFeeFormatted = convertFiatAmountFormatted(preSavingsGasCostUsd, NumberType.FiatGasPrice)

    // Swap submission will always cost 0, since it's not an on-chain tx.
    const swapFeeFormatted = convertFiatAmountFormatted(0, NumberType.FiatGasPrice)

    return {
      approvalFeeFormatted: approvalCost
        ? convertFiatAmountFormatted(approvalCostUsd, NumberType.FiatGasPrice)
        : undefined,
      wrapFeeFormatted: wrapCost ? convertFiatAmountFormatted(wrapCostUsd, NumberType.FiatGasPrice) : undefined,
      preSavingsGasFeeFormatted,
      swapFeeFormatted,
      inputTokenSymbol,
    }
  }, [uniswapXGasBreakdown, approvalCostUsd, convertFiatAmountFormatted, wrapCostUsd])
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
    if (gasFee === undefined || balanceInsufficient || !nativeCurrencyBalance || hasGasFunds) {
      return
    }

    return {
      type: WarningLabel.InsufficientGasFunds,
      severity: WarningSeverity.Medium,
      action: WarningAction.DisableSubmit,
      title: t('swap.warning.insufficientGas.title', {
        currencySymbol: nativeCurrencyBalance.currency.symbol,
      }),
      buttonText: isWeb
        ? t('swap.warning.insufficientGas.button', {
            currencySymbol: nativeCurrencyBalance.currency.symbol,
          })
        : undefined,
      message: undefined,
      currency: nativeCurrencyBalance.currency,
    }
  }, [gasFee, balanceInsufficient, nativeCurrencyBalance, hasGasFunds, t])
}

function extractGasFeeParams(estimate: GasEstimate): TransactionLegacyFeeParams | TransactionEip1559FeeParams {
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
