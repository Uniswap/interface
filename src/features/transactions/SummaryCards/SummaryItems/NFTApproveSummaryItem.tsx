import React, { ReactElement } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { AssetType } from 'src/entities/assets'
import TransactionSummaryLayout, {
  AssetUpdateLayout,
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { BaseTransactionSummaryProps } from 'src/features/transactions/SummaryCards/TransactionSummaryRouter'
import { getTransactionTitle } from 'src/features/transactions/SummaryCards/utils'
import { NFTApproveTransactionInfo, TransactionType } from 'src/features/transactions/types'
import { shortenAddress } from 'src/utils/addresses'

export default function NFTApproveSummaryItem({
  transaction,
  readonly,
  ...rest
}: BaseTransactionSummaryProps & {
  transaction: { typeInfo: NFTApproveTransactionInfo }
}): ReactElement {
  const { t } = useTranslation()
  const title = getTransactionTitle(transaction.status, t('Approve'), t('Approved'), t)
  return (
    <TransactionSummaryLayout
      caption={shortenAddress(transaction.typeInfo.spender)}
      endAdornment={<AssetUpdateLayout title={transaction.typeInfo.nftSummaryInfo.name} />}
      icon={
        <LogoWithTxStatus
          assetType={AssetType.ERC721}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={TransactionType.NFTApprove}
        />
      }
      readonly={readonly}
      title={title}
      transaction={transaction}
      {...rest}
    />
  )
}
