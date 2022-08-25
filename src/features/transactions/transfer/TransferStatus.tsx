import { Currency } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { goBack } from 'src/app/navigation/rootNavigation'
import { NFTAsset } from 'src/features/nfts/types'
import { useSelectTransaction } from 'src/features/transactions/hooks'
import { TransactionPending } from 'src/features/transactions/TransactionPending/TransactionPending'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { useActiveAccountAddressWithThrow, useDisplayName } from 'src/features/wallet/hooks'

type TransferStatusProps = {
  derivedTransferInfo: DerivedTransferInfo
  txId: string | undefined
  onNext: () => void
  onTryAgain: () => void
}

const getTextFromTransferStatus = (
  t: TFunction,
  inputAmount: string,
  recipient: string | undefined,
  transactionDetails?: TransactionDetails,
  currencyIn?: Currency,
  nftIn?: NFTAsset.Asset
) => {
  if (
    !transactionDetails ||
    transactionDetails.typeInfo.type !== TransactionType.Send ||
    !recipient ||
    (!currencyIn && !nftIn)
  ) {
    // TODO: should never go into this state but should probably do some
    // error display here as well as log to sentry or amplitude
    return {
      title: t('Sending'),
      description: t(
        'We’ll notify you once your transaction is complete. You can now safely leave this page.'
      ),
    }
  }
  const status = transactionDetails.status

  if (status === TransactionStatus.Success) {
    return {
      title: t('Send successful!'),
      description: t('You sent {{ inputAmount }}{{ tokenName }} to {{ recipient }}.', {
        inputAmount,
        tokenName: nftIn?.name ?? ` ${currencyIn?.symbol}` ?? ' tokens',
        recipient,
      }),
    }
  }

  if (status === TransactionStatus.Failed) {
    return {
      title: t('Send failed'),
      description: t('Keep in mind that the network fee is still charged for failed transfers.'),
    }
  }

  // TODO: handle TransactionStatus.Unknown state
  return {
    title: t('Sending'),
    description: t(
      'We’ll notify you once your transaction is complete. You can now safely leave this page.'
    ),
  }
}

export function TransferStatus({
  derivedTransferInfo,
  txId,
  onNext,
  onTryAgain,
}: TransferStatusProps) {
  const { t } = useTranslation()
  const activeAddress = useActiveAccountAddressWithThrow()

  const { formattedAmounts, recipient, currencyIn, nftIn, chainId } = derivedTransferInfo

  const transaction = useSelectTransaction(activeAddress, chainId, txId)

  const recipientName = useDisplayName(recipient)?.name ?? recipient
  const { title, description } = useMemo(() => {
    return getTextFromTransferStatus(
      t,
      formattedAmounts[CurrencyField.INPUT],
      recipientName,
      transaction,
      currencyIn,
      nftIn
    )
  }, [t, currencyIn, formattedAmounts, nftIn, recipientName, transaction])

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
      onNext={onClose}
      onTryAgain={onTryAgain}
    />
  )
}
