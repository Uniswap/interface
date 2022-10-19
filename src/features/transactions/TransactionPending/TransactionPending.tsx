import React from 'react'
import { useTranslation } from 'react-i18next'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
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
}: TransactionStatusProps) {
  const { t } = useTranslation()

  return (
    <AnimatedFlex flexGrow={1} mb="xl" px="sm">
      <Flex centered flexGrow={1}>
        <Flex centered>
          <StatusAnimation status={transaction?.status} />
        </Flex>
        <Flex centered gap="sm">
          <Text variant="headlineSmall">{title}</Text>
          <Text color="textTertiary" textAlign="center" variant="bodyLarge">
            {description}
          </Text>
          {transaction?.status === TransactionStatus.Failed ? (
            <TextButton textColor="accentAction" textVariant="bodyLarge" onPress={onTryAgain}>
              {t('Try again')}
            </TextButton>
          ) : null}
        </Flex>
      </Flex>
      {transaction && isFinalizedState(transaction.status) ? (
        <PrimaryButton
          alignSelf="stretch"
          label={t('View transaction')}
          py="md"
          variant="transparent"
          onPress={() => openTransactionLink(transaction.hash, chainId)}
        />
      ) : null}
      <PrimaryButton
        alignSelf="stretch"
        label={t('OK')}
        py="md"
        testID={ElementName.OK}
        onPress={onNext}
      />
    </AnimatedFlex>
  )
}
