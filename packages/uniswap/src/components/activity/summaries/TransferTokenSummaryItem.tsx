import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ElementAfterText } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { TransactionSummaryLayout } from 'uniswap/src/components/activity/summaries/TransactionSummaryLayout'
import { SummaryItemProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { LogoWithTxStatus } from 'uniswap/src/components/CurrencyLogo/LogoWithTxStatus'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { AssetType } from 'uniswap/src/entities/assets'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import {
  ReceiveTokenTransactionInfo,
  SendTokenTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'

function _TransferTokenSummaryItem({
  transactionType,
  otherAddress,
  transaction,
  index,
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
      : undefined,
  )

  const isCurrency = transaction.typeInfo.assetType === AssetType.Currency

  const currencyAmount = useMemo(
    () =>
      currencyInfo &&
      transaction.typeInfo.currencyAmountRaw &&
      getFormattedCurrencyAmount({
        currency: currencyInfo.currency,
        amount: transaction.typeInfo.currencyAmountRaw,
        formatter,
      }),
    [currencyInfo, formatter, transaction.typeInfo.currencyAmountRaw],
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
  const { name: ensName } = useENS({ nameOrAddress: otherAddress, autocompleteDomain: true })
  const { data: unitag } = useUnitagsAddressQuery({
    params: otherAddress ? { address: otherAddress } : undefined,
  })
  const personDisplayName = unitag?.username ?? ensName ?? shortenAddress({ address: otherAddress })

  const tokenAmountWithSymbol = isCurrency
    ? (currencyAmount ?? '') + (getSymbolDisplayText(currencyInfo?.currency.symbol) ?? '')
    : transaction.typeInfo.nftSummaryInfo?.name

  const captionText = useMemo(() => {
    const isSend = transactionType === TransactionType.Send

    if (!tokenAmountWithSymbol) {
      return isSend
        ? t('transaction.summary.sent.noAmount', { name: personDisplayName })
        : t('transaction.summary.received.noAmount', { name: personDisplayName })
    }

    if (isSend) {
      // The key is improperly named, it should be 'sent'. We're leaving this to avoid messing with translations.
      return t('transaction.summary.received', {
        recipientAddress: personDisplayName,
        tokenAmountWithSymbol,
      })
    } else {
      // The key is improperly named, it should be 'received'. We're leaving this to avoid messing with translations.
      return t('transaction.summary.sent', {
        senderAddress: personDisplayName,
        tokenAmountWithSymbol,
      })
    }
  }, [personDisplayName, t, tokenAmountWithSymbol, transactionType])

  const caption = useMemo(
    () => (
      <ElementAfterText
        wrapperProps={{
          grow: true,
          shrink: true,
        }}
        element={unitag?.username ? <Unitag size="$icon.24" /> : undefined}
        text={captionText}
      />
    ),
    [captionText, unitag?.username],
  )

  return <TransactionSummaryLayout caption={caption} icon={icon} index={index} transaction={transaction} />
}

export const TransferTokenSummaryItem = memo(_TransferTokenSummaryItem)
