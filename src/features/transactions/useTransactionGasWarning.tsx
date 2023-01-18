import { CurrencyAmount, NativeCurrency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/modals/WarningModal/types'
import { useOnChainNativeCurrencyBalance } from 'src/features/balances/api'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { hasSufficientFundsIncludingGas } from 'src/features/transactions/utils'
import { useActiveAccountAddressWithThrow } from 'src/features/wallet/hooks'

export function useTransactionGasWarning(
  { chainId, currencyAmounts, currencyBalances }: DerivedSwapInfo | DerivedTransferInfo,
  gasFee?: string
):
  | {
      type: WarningLabel
      severity: WarningSeverity
      action: WarningAction
      title: string
      message: string
    }
  | undefined {
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

  return useMemo(() => {
    // if balance is already insufficient, dont need to show warning about network fee
    if (gasFee === undefined || balanceInsufficient || !nativeCurrencyBalance || hasGasFunds) return

    return {
      type: WarningLabel.InsufficientGasFunds,
      severity: WarningSeverity.Medium,
      action: WarningAction.DisableSubmit,
      title: t('Not enough {{ nativeCurrency }} to pay network fee', {
        nativeCurrency: nativeCurrencyBalance.currency.symbol,
      }),
      message: t('Network fees are paid in the native token. Buy more {{ nativeCurrency }}.', {
        nativeCurrency: nativeCurrencyBalance.currency.symbol,
      }),
    }
  }, [gasFee, hasGasFunds, nativeCurrencyBalance, balanceInsufficient, t])
}
