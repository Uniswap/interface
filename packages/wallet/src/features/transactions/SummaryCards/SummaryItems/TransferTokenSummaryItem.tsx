import { createElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Icons } from 'ui/src'
import { LogoWithTxStatus } from 'wallet/src/components/CurrencyLogo/LogoWithTxStatus'
import { ChainId } from 'wallet/src/constants/chains'
import { AssetType } from 'wallet/src/entities/assets'
import { useENS } from 'wallet/src/features/ens/useENS'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  SummaryItemProps,
  TransactionSummaryLayoutProps,
} from 'wallet/src/features/transactions/SummaryCards/types'
import { TXN_HISTORY_ICON_SIZE } from 'wallet/src/features/transactions/SummaryCards/utils'
import {
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { useUnitagByAddress } from 'wallet/src/features/unitags/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'wallet/src/utils/currency'
import { buildCurrencyId } from 'wallet/src/utils/currencyId'

export function TransferTokenSummaryItem({
  transactionType,
  otherAddress,
  transaction,
  layoutElement,
}: SummaryItemProps & {
  transactionType: TransactionType.Send | TransactionType.Receive
  otherAddress: string
  transaction: TransactionDetails & {
    typeInfo: ReceiveTokenTransactionInfo | SendTokenTransactionInfo
  }
}): JSX.Element {
  const { t } = useTranslation()
  const formatter = useLocalizationContext()

  const currencyInfo = useCurrencyInfo(
    transaction.typeInfo.assetType === AssetType.Currency
      ? buildCurrencyId(transaction.chainId, transaction.typeInfo.tokenAddress)
      : undefined
  )

  const isCurrency = transaction.typeInfo.assetType === AssetType.Currency

  const currencyAmount =
    currencyInfo &&
    transaction.typeInfo.currencyAmountRaw &&
    getFormattedCurrencyAmount(
      currencyInfo.currency,
      transaction.typeInfo.currencyAmountRaw,
      formatter
    )

  const icon = useMemo(() => {
    if (isCurrency) {
      return (
        <LogoWithTxStatus
          assetType={AssetType.Currency}
          chainId={transaction.chainId}
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
        chainId={transaction.chainId}
        nftImageUrl={transaction.typeInfo.nftSummaryInfo?.imageURL}
        size={TXN_HISTORY_ICON_SIZE}
        txStatus={transaction.status}
        txType={transaction.typeInfo.type}
      />
    )
  }, [
    currencyInfo,
    isCurrency,
    transaction.chainId,
    transaction.status,
    transaction.typeInfo.nftSummaryInfo?.imageURL,
    transaction.typeInfo.type,
  ])

  // Search for matching ENS
  const { name: ensName } = useENS(ChainId.Mainnet, otherAddress, true)
  const { unitag } = useUnitagByAddress(otherAddress)
  const personDisplayName = unitag?.username ?? ensName ?? shortenAddress(otherAddress)

  const tokenAmountWithSymbol = isCurrency
    ? (currencyAmount ?? '') + (getSymbolDisplayText(currencyInfo?.currency?.symbol) ?? '')
    : transaction.typeInfo.nftSummaryInfo?.name

  let caption = ''
  if (transactionType === TransactionType.Send) {
    caption = t('transaction.summary.received', {
      recipientAddress: personDisplayName,
      tokenAmountWithSymbol,
    })
  } else {
    caption = t('transaction.summary.sent', {
      senderAddress: personDisplayName,
      tokenAmountWithSymbol,
    })
  }

  return createElement(layoutElement as React.FunctionComponent<TransactionSummaryLayoutProps>, {
    caption,
    icon,
    transaction,
    postCaptionElement: unitag?.username ? <Icons.Unitag size="$icon.24" /> : undefined,
  })
}
