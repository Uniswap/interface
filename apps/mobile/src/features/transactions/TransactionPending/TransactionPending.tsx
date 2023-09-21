import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { AnimatedFlex } from 'src/components/layout'
import { ElementName } from 'src/features/telemetry/constants'
import { StatusAnimation } from 'src/features/transactions/TransactionPending/StatusAnimation'
import { openTransactionLink } from 'src/utils/linking'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ChainId } from 'wallet/src/constants/chains'
import { TransactionDetails, TransactionStatus } from 'wallet/src/features/transactions/types'

type TransactionStatusProps = {
  transaction: TransactionDetails | undefined
  chainId: ChainId
  title: string
  description: string
  onNext: () => void
  onTryAgain: () => void
  transactionType: 'swap' | 'send'
}

function isFinalizedState(status: TransactionStatus): boolean {
  return status === TransactionStatus.Success || status === TransactionStatus.Failed
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
    <AnimatedFlex grow px="spacing12">
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
      {transaction && isFinalizedState(transaction.status) ? (
        <Button
          emphasis={ButtonEmphasis.Tertiary}
          label={t('View transaction')}
          testID="transaction-pending-view"
          onPress={onPressViewTransaction}
        />
      ) : null}
      <Button label={t('Close')} testID={ElementName.OK} onPress={onNext} />
    </AnimatedFlex>
  )
}
