import React from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import {
  ApproveTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'src/features/transactions/types'
import { buildCurrencyId } from 'src/utils/currencyId'
import { formatNumberOrString, NumberType } from 'src/utils/format'

const INFINITE_AMOUNT = 'INF'
const ZERO_AMOUNT = '0.0'

export default function ApproveSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & { typeInfo: ApproveTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const currencyInfo = useCurrencyInfo(
    buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress)
  )

  const { approvalAmount } = transaction.typeInfo

  const amount =
    approvalAmount === INFINITE_AMOUNT
      ? t('Unlimited')
      : approvalAmount && approvalAmount !== ZERO_AMOUNT
      ? formatNumberOrString(approvalAmount, NumberType.TokenNonTx)
      : ''

  const caption = `${amount ? amount + ' ' : ''}${currencyInfo?.currency.symbol ?? ''}`

  return (
    <TransactionSummaryLayout
      caption={caption}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          chainId={transaction.chainId}
          currencyInfo={currencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={TransactionType.Approve}
        />
      }
      transaction={transaction}
    />
  )
}
