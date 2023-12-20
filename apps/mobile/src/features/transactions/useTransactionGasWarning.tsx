import { CurrencyAmount, NativeCurrency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/modals/WarningModal/types'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { useOnChainNativeCurrencyBalance } from 'wallet/src/features/portfolio/api'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { hasSufficientFundsIncludingGas } from 'wallet/src/features/transactions/utils'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { DerivedSwapInfo } from './swap/types'

export function useTransactionGasWarning({
  derivedInfo,
  gasFee,
}: {
  derivedInfo: DerivedSwapInfo | DerivedTransferInfo
  gasFee?: string
}): Warning | undefined {
  const { chainId, currencyAmounts, currencyBalances } = derivedInfo
  const { t } = useTranslation()
  const address = useActiveAccountAddressWithThrow()
  const { balance: nativeCurrencyBalance } = useOnChainNativeCurrencyBalance(chainId, address)

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

  const isSwapRewriteFeatureEnabled = useFeatureFlag(FEATURE_FLAGS.SwapRewrite)

  return useMemo(() => {
    // if balance is already insufficient, dont need to show warning about network fee
    if (gasFee === undefined || balanceInsufficient || !nativeCurrencyBalance || hasGasFunds) return

    return {
      type: WarningLabel.InsufficientGasFunds,
      severity: WarningSeverity.Medium,
      action: WarningAction.DisableSubmit,
      title: isSwapRewriteFeatureEnabled
        ? t('You don’t have enough {{ nativeCurrency }} to cover the network cost', {
            nativeCurrency: nativeCurrencyBalance.currency.symbol,
          })
        : t('Not enough {{ nativeCurrency }} to cover network cost', {
            nativeCurrency: nativeCurrencyBalance.currency.symbol,
          }),
      // TODO: No modal for this error state in the swap rewrite until "BUY" button implemented
      message: isSwapRewriteFeatureEnabled
        ? undefined
        : t('Network fees are paid in the native token. Buy more {{ nativeCurrency }}.', {
            nativeCurrency: nativeCurrencyBalance.currency.symbol,
          }),
    }
  }, [
    gasFee,
    balanceInsufficient,
    nativeCurrencyBalance,
    hasGasFunds,
    isSwapRewriteFeatureEnabled,
    t,
  ])
}
