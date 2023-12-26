import React from 'react'
import { useTranslation } from 'react-i18next'
import { ElementName } from 'src/features/telemetry/constants'
import { StatusAnimation } from 'src/features/transactions/TransactionPending/StatusAnimation'
import { openTransactionLink } from 'src/utils/linking'
import { AnimatedFlex, Button, Flex, Text, TouchableArea } from 'ui/src'
import { ChainId } from 'wallet/src/constants/chains'
import {
  isFinalizedTx,
  TransactionDetails,
  TransactionStatus,
} from 'wallet/src/features/transactions/types'

type TransactionStatusProps = {
  transaction: TransactionDetails | undefined
  chainId: ChainId
  title: string
  description: string
  onNext: () => void
  onTryAgain: () => void
  transactionType: 'swap' | 'send'
}

export function TransactionPending({
  transaction,
  title,
  description,
  onNext,
  onTryAgain,
  transactionType,
}: TransactionStatusProps): JSX.Element {
  const { t } = useTranslation()

  const onPressViewTransaction = async (): Promise<void> => {
    if (transaction) {
      await openTransactionLink(transaction.hash, transaction.chainId)
    }
  }

  return (
    <AnimatedFlex grow px="$spacing12">
      <Flex grow alignItems="center" justifyContent="flex-start" pt="$spacing60">
        <Flex alignItems="center" justifyContent="flex-end" pt="$spacing16">
          <StatusAnimation status={transaction?.status} transactionType={transactionType} />
        </Flex>
        <Flex alignItems="center" gap="$spacing12" justifyContent="flex-start">
          <Text variant="heading3">{title}</Text>
          <Text color="$neutral3" textAlign="center" variant="body1">
            {description}
          </Text>
          {transaction?.status === TransactionStatus.Failed ? (
            <TouchableArea onPress={onTryAgain}>
              <Text color="$accent1" variant="body1">
                {t('Try again')}
              </Text>
            </TouchableArea>
          ) : null}
        </Flex>
      </Flex>
      <Flex gap="$spacing8">
        {transaction && isFinalizedTx(transaction) ? (
          <Button
            testID="transaction-pending-view"
            theme="tertiary"
            onPress={onPressViewTransaction}>
            {t('View transaction')}
          </Button>
        ) : null}
        <Button testID={ElementName.OK} onPress={onNext}>
          {t('Close')}
        </Button>
      </Flex>
    </AnimatedFlex>
  )
}
