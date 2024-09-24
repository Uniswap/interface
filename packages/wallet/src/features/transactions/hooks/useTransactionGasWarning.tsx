import { CurrencyAmount, NativeCurrency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb } from 'ui/src'
import { AccountMeta } from 'uniswap/src/features/accounts/types'
import { useOnChainNativeCurrencyBalance } from 'uniswap/src/features/portfolio/api'

import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/features/transactions/WarningModal/types'
import { DerivedSendInfo } from 'uniswap/src/features/transactions/send/types'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { CurrencyField } from 'uniswap/src/types/currency'
import { hasSufficientFundsIncludingGas } from 'wallet/src/features/transactions/utils'

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
