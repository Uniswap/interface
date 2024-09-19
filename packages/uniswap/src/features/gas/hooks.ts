import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { providers } from 'ethers/lib/ethers'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb } from 'ui/src'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useGasFeeQuery } from 'uniswap/src/data/apiClients/uniswapApi/useGasFeeQuery'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { FeeType, FormattedUniswapXGasFeeInfo, GasFeeResult, GasSpeed } from 'uniswap/src/features/gas/types'
import { hasSufficientFundsIncludingGas } from 'uniswap/src/features/gas/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { NativeCurrency } from 'uniswap/src/features/tokens/NativeCurrency'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { usePollingIntervalByChain } from 'uniswap/src/features/transactions/swap/hooks/usePollingIntervalByChain'
import { UniswapXGasBreakdown } from 'uniswap/src/features/transactions/swap/hooks/useSwapTxAndGasInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

export type CancelationGasFeeDetails = {
  cancelRequest: providers.TransactionRequest
  cancelationGasFee: string
}

export function useTransactionGasFee(
  tx: providers.TransactionRequest | undefined,
  speed: GasSpeed = GasSpeed.Urgent,
  skip?: boolean,
  refetchInterval?: PollingInterval,
): GasFeeResult {
  const pollingIntervalForChain = usePollingIntervalByChain(tx?.chainId)

  const { data, error, isLoading } = useGasFeeQuery({
    params: skip ? undefined : tx,
    refetchInterval,
    staleTime: pollingIntervalForChain,
    immediateGcTime: pollingIntervalForChain + 15 * ONE_SECOND_MS,
  })

  return useMemo(() => {
    if (!data) {
      return { error: error ?? null, isLoading }
    }

    const params =
      data.type === FeeType.Eip1559
        ? {
            maxPriorityFeePerGas: data.maxPriorityFeePerGas[speed],
            maxFeePerGas: data.maxFeePerGas[speed],
            gasLimit: data.gasLimit,
          }
        : {
            gasPrice: data.gasPrice[speed],
            gasLimit: data.gasLimit,
          }
    return {
      value: data.gasFee[speed],
      isLoading,
      error: error ?? null,
      params,
    }
  }, [data, error, isLoading, speed])
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
