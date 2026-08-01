import { memo, useMemo } from 'react'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import type { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { CrossChainIcon, SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { AssetType } from 'uniswap/src/entities/assets'
import { getEarnPlanDisplayInfo } from 'uniswap/src/features/activity/utils/getEarnPlanDisplayInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CrossChainCurrencyRow } from 'uniswap/src/features/transactions/swap/components/CrossChainCurrencyRow'
import {
  type PlanTransactionInfo,
  type TransactionDetails,
  TransactionStatus,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'

/**
 * Component used in the activity history to display the top level details of a plan transaction.
 * @param param0
 * @returns
 */
function PlanSummaryItemInner({
  transaction,
  index,
  isExternalProfile,
}: SummaryItemProps & {
  transaction: TransactionDetails & {
    typeInfo: PlanTransactionInfo
  }
}): JSX.Element {
  const { typeInfo, status } = transaction
  const { inputCurrencyId, outputCurrencyId, inputCurrencyAmountRaw, outputCurrencyAmountRaw } = typeInfo
  const earnDisplayInfo = useMemo(() => getEarnPlanDisplayInfo(typeInfo), [typeInfo])
  const earnTransactionType = earnDisplayInfo?.transactionType
  const inputCurrencyInfo = useCurrencyInfo(inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(outputCurrencyId)
  const earnCurrencyInfo = useCurrencyInfo(earnDisplayInfo?.currencyId)
  const formatter = useLocalizationContext()

  const caption = useMemo(() => {
    if (earnDisplayInfo && earnCurrencyInfo) {
      const currencyAmount = getFormattedCurrencyAmount({
        currency: earnCurrencyInfo.currency,
        amount: earnDisplayInfo.amountRaw,
        formatter,
        isApproximateAmount: status !== TransactionStatus.Success,
      })
      const symbol = getSymbolDisplayText(earnCurrencyInfo.currency.symbol) ?? ''
      const formattedAmount = currencyAmount.trim()
      return symbol ? `${formattedAmount} ${symbol}` : formattedAmount
    }

    if (!inputCurrencyInfo || !outputCurrencyInfo) {
      return ''
    }

    const { currency: inputCurrency } = inputCurrencyInfo
    const { currency: outputCurrency } = outputCurrencyInfo
    const currencyAmount = getFormattedCurrencyAmount({
      currency: inputCurrency,
      amount: inputCurrencyAmountRaw,
      formatter,
      isApproximateAmount: false,
    })

    const isApproximateAmount = status !== TransactionStatus.Success
    const otherCurrencyAmount = getFormattedCurrencyAmount({
      currency: outputCurrency,
      amount: outputCurrencyAmountRaw,
      formatter,
      isApproximateAmount,
    })
    return (
      <CrossChainCurrencyRow
        inputChainId={inputCurrency.chainId}
        inputSymbol={inputCurrency.symbol ?? ''}
        outputChainId={outputCurrency.chainId}
        outputSymbol={outputCurrency.symbol ?? ''}
        formattedInputTokenAmount={currencyAmount}
        formattedOutputTokenAmount={otherCurrencyAmount}
      />
    )
  }, [
    earnCurrencyInfo,
    earnDisplayInfo,
    inputCurrencyInfo,
    outputCurrencyInfo,
    formatter,
    inputCurrencyAmountRaw,
    outputCurrencyAmountRaw,
    status,
  ])

  const icon = useMemo(() => {
    if (earnTransactionType && earnCurrencyInfo) {
      return (
        <LogoWithTxStatus
          isVaultTransaction
          assetType={AssetType.Currency}
          chainId={earnCurrencyInfo.currency.chainId}
          currencyInfo={earnCurrencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={status}
          txType={earnTransactionType}
        />
      )
    }

    return (
      <SplitLogo
        chainId={transaction.chainId}
        inputCurrencyInfo={inputCurrencyInfo}
        outputCurrencyInfo={outputCurrencyInfo}
        size={TXN_HISTORY_ICON_SIZE}
        customIcon={<CrossChainIcon status={status} />}
      />
    )
  }, [earnCurrencyInfo, earnTransactionType, inputCurrencyInfo, outputCurrencyInfo, transaction.chainId, status])

  // TODO(SWAP-2133): Add onRetry prop to support retrying plan transactions in-line.
  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={icon}
      index={index}
      transaction={transaction}
      isExternalProfile={isExternalProfile}
    />
  )
}

export const PlanSummaryItem = memo(PlanSummaryItemInner)
