import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
import { StatusAnimation } from 'src/features/transactions/TransactionPending/StatusAnimation'
import { TransactionDetails, TransactionStatus } from 'src/features/transactions/types'
import { openTransactionLink } from 'src/utils/linking'

type TransactionStatusProps = {
  transaction: TransactionDetails | undefined
  chainId: ChainId
  title: string
  description: string
  onNext: () => void
  onTryAgain: () => void
  transactionType: 'swap' | 'send'
}

function isFinalizedState(status: TransactionStatus) {
  return status === TransactionStatus.Success || status === TransactionStatus.Failed
}

export function TransactionPending({
  transaction,
  chainId,
  title,
  description,
  onNext,
  onTryAgain,
  transactionType,
}: TransactionStatusProps) {
  const { t } = useTranslation()

  return (
    <AnimatedFlex flexGrow={1} px="sm">
      <Flex centered flexGrow={1}>
        <Flex centered>
          <StatusAnimation status={transaction?.status} transactionType={transactionType} />
        </Flex>
        <Flex centered gap="sm">
          <Text variant="headlineSmall">{title}</Text>
          <Text color="textTertiary" textAlign="center" variant="bodyLarge">
            {description}
          </Text>
          {transaction?.status === TransactionStatus.Failed ? (
            <TouchableArea onPress={onTryAgain}>
              <Text color="accentAction" variant="bodyLarge">
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
          onPress={() => openTransactionLink(transaction.hash, chainId)}
        />
      ) : null}
      <Button label={t('OK')} name={ElementName.OK} onPress={onNext} />
    </AnimatedFlex>
  )
}
