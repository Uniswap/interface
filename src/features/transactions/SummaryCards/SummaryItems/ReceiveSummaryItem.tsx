import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useENS } from 'src/features/ens/useENS'
import { getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import { useCurrencyInfo } from 'src/features/tokens/useCurrencyInfo'
import TransactionSummaryLayout, {
  TXN_HISTORY_ICON_SIZE,
} from 'src/features/transactions/SummaryCards/TransactionSummaryLayout'
import { ReceiveTokenTransactionInfo, TransactionDetails } from 'src/features/transactions/types'
import { shortenAddress } from 'src/utils/addresses'
import { buildCurrencyId } from 'src/utils/currencyId'

export default function ReceiveSummaryItem({
  transaction,
}: {
  transaction: TransactionDetails & { typeInfo: ReceiveTokenTransactionInfo }
}): JSX.Element {
  const { t } = useTranslation()
  const currencyInfo = useCurrencyInfo(
    transaction.typeInfo.assetType === AssetType.Currency
      ? buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress)
      : undefined
  )

  const isCurrency = transaction.typeInfo.assetType === AssetType.Currency

  const icon = useMemo(() => {
    if (isCurrency) {
      return (
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          currencyInfo={currencyInfo}
          size={TXN_HISTORY_ICON_SIZE}
          txStatus={transaction.status}
          txType={transaction.typeInfo.type}
        />
      )
    }
    return (
      <LogoWithTxStatus
        assetType={AssetType.ERC721}
        nftImageUrl={transaction.typeInfo.nftSummaryInfo?.imageURL}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transaction.typeInfo.type}
      />
    )
  }, [
    currencyInfo,
    isCurrency,
    transaction.status,
    transaction.typeInfo.nftSummaryInfo?.imageURL,
    transaction.typeInfo.type,
  ])

  // Search for matching ENS
  const { name: ensName } = useENS(ChainId.Mainnet, transaction.typeInfo.sender, true)
  const senderName = ensName ?? shortenAddress(transaction.typeInfo.sender)

  const currencyAmount =
    currencyInfo &&
    transaction.typeInfo.currencyAmountRaw &&
    getFormattedCurrencyAmount(currencyInfo.currency, transaction.typeInfo.currencyAmountRaw)

  const caption = t('{{what}} from {{sender}}', {
    what: isCurrency
      ? currencyAmount ?? '' + currencyInfo?.currency?.symbol ?? ''
      : transaction.typeInfo.nftSummaryInfo?.name,
    sender: senderName,
  })

  return <TransactionSummaryLayout caption={caption} icon={icon} transaction={transaction} />
}
