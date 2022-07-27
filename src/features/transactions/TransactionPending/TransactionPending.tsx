import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import CheckCircle from 'src/assets/icons/check-circle.svg'
import Send from 'src/assets/icons/send.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { ElementName } from 'src/features/telemetry/constants'
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

function StatusIcon({ status, size }: { status?: TransactionStatus; size: number }) {
  const theme = useAppTheme()

  if (status === TransactionStatus.Success) {
    return <CheckCircle height={size} width={size} />
  }

  if (status === TransactionStatus.Failed) {
    return <AlertTriangle color={theme.colors.accentFailure} height={size} width={size} />
  }

  return <Send height={size} width={size} />
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
          <StatusIcon size={72} status={transaction?.status} />
        </Flex>
        <Flex centered gap="sm">
          <Text variant="headlineSmall">{title}</Text>
          <Text color="textTertiary" textAlign="center" variant="body">
            {description}
          </Text>
          {transaction?.status === TransactionStatus.Failed ? (
            <TextButton
              fontWeight="600"
              textColor="accentAction"
              textVariant="body"
              onPress={onTryAgain}>
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
