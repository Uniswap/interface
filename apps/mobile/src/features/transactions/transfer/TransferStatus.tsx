import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { goBack } from 'src/app/navigation/rootNavigation'
import { useSelectTransaction } from 'src/features/transactions/hooks'
import { TransactionPending } from 'src/features/transactions/TransactionPending/TransactionPending'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { AppTFunction } from 'ui/src/i18n/types'
import { NumberType } from 'utilities/src/format/types'
import { FiatCurrencyInfo, useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import {
  LocalizationContextState,
  useLocalizationContext,
} from 'wallet/src/features/language/LocalizationContext'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'

type TransferStatusProps = {
  derivedTransferInfo: DerivedTransferInfo
  onNext: () => void
  onTryAgain: () => void
}

const getTextFromTransferStatus = (
  t: AppTFunction,
  formatter: LocalizationContextState,
  fiatCurrencyInfo: FiatCurrencyInfo,
  derivedTransferInfo: DerivedTransferInfo,
  recipient: string | undefined,
  transactionDetails?: TransactionDetails
): {
  title: string
  description: string
} => {
  const { currencyInInfo, nftIn, currencyAmounts, isFiatInput, exactAmountFiat } =
    derivedTransferInfo
  if (
    !transactionDetails ||
    transactionDetails.typeInfo.type !== TransactionType.Send ||
    !recipient ||
    (!currencyInInfo && !nftIn)
  ) {
    // TODO: [MOB-240] should never go into this state but should probably do some
    // error display here as well as log to sentry or amplitude
    return {
      title: t('Sending'),
      description: t('We’ll notify you once your transaction is complete.'),
    }
  }
  const status = transactionDetails.status
  if (status === TransactionStatus.Success) {
    const formattedFiatValue = formatter.addFiatSymbolToNumber({
      value: exactAmountFiat,
      currencyCode: fiatCurrencyInfo.code,
      currencySymbol: fiatCurrencyInfo.symbol,
    })
    return {
      title: t('Send successful!'),
      description: t(
        'You sent {{ currencyAmount }}{{ tokenName }}{{ fiatValue }} to {{ recipient }}.',
        {
          currencyAmount: nftIn
            ? ''
            : formatter.formatCurrencyAmount({
                value: currencyAmounts[CurrencyField.INPUT],
                type: NumberType.TokenTx,
              }),
          fiatValue: isFiatInput ? ` (${formattedFiatValue})` : '',
          tokenName: nftIn?.name ?? ` ${currencyInInfo?.currency.symbol}` ?? ' tokens',
          recipient,
        }
      ),
    }
  }

  if (status === TransactionStatus.Failed) {
    return {
      title: t('Send failed'),
      description: t('Keep in mind that the network fee is still charged for failed transfers.'),
    }
  }

  // TODO: [MOB-241] handle TransactionStatus.Unknown state
  return {
    title: t('Sending'),
    description: t('We’ll notify you once your transaction is complete.'),
  }
}

export function TransferStatus({
  derivedTransferInfo,
  onNext,
  onTryAgain,
}: TransferStatusProps): JSX.Element | null {
  const { t } = useTranslation()
  const formatter = useLocalizationContext()
  const appFiatCurrencyInfo = useAppFiatCurrencyInfo()
  const activeAddress = useActiveAccountAddressWithThrow()

  const { recipient, chainId, txId } = derivedTransferInfo

  const transaction = useSelectTransaction(activeAddress, chainId, txId)

  const recipientName = useDisplayName(recipient)?.name ?? recipient
  const { title, description } = useMemo(() => {
    return getTextFromTransferStatus(
      t,
      formatter,
      appFiatCurrencyInfo,
      derivedTransferInfo,
      recipientName,
      transaction
    )
  }, [t, formatter, appFiatCurrencyInfo, derivedTransferInfo, recipientName, transaction])

  const onClose = useCallback(() => {
    onNext()
    goBack()
  }, [onNext])

  if (!chainId) return null

  return (
    <TransactionPending
      chainId={chainId}
      description={description}
      title={title}
      transaction={transaction}
      transactionType="send"
      onNext={onClose}
      onTryAgain={onTryAgain}
    />
  )
}
