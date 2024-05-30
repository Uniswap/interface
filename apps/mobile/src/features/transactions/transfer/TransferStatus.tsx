import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { goBack } from 'src/app/navigation/rootNavigation'
import { TransactionPending } from 'src/features/transactions/TransactionPending/TransactionPending'
import { AppTFunction } from 'ui/src/i18n/types'
import { NumberType } from 'utilities/src/format/types'
import { FiatCurrencyInfo, useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import {
  LocalizationContextState,
  useLocalizationContext,
} from 'wallet/src/features/language/LocalizationContext'
import { useSelectTransaction } from 'wallet/src/features/transactions/hooks'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { DerivedTransferInfo } from 'wallet/src/features/transactions/transfer/types'
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
      title: t('send.status.inProgress.title'),
      description: t('send.status.inProgress.description'),
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
      title: t('send.status.success.title'),
      description: t('send.status.success.description', {
        currencyAmount: nftIn
          ? ''
          : formatter.formatCurrencyAmount({
              value: currencyAmounts[CurrencyField.INPUT],
              type: NumberType.TokenTx,
            }),
        fiatValue: isFiatInput ? ` (${formattedFiatValue})` : '',
        tokenName: nftIn?.name ?? ` ${currencyInInfo?.currency.symbol}` ?? ' tokens',
        recipient,
      }),
    }
  }

  if (status === TransactionStatus.Failed) {
    return {
      title: t('send.status.failed.title'),
      description: t('send.status.fail.description'),
    }
  }

  // TODO: [MOB-241] handle TransactionStatus.Unknown state
  return {
    title: t('send.status.inProgress.title'),
    description: t('send.status.inProgress.description'),
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

  const displayName = useDisplayName(recipient, { includeUnitagSuffix: true })
  const recipientName = displayName?.name ?? recipient
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

  if (!chainId) {
    return null
  }

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
