import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { TransactionStatus } from 'src/features/transactions/types'

const ICON_SIZE = 20

export default function AlertBanner({
  status,
}: {
  status:
    | TransactionStatus.Cancelled
    | TransactionStatus.Cancelling
    | TransactionStatus.FailedCancel
}) {
  const theme = useAppTheme()
  const { t } = useTranslation()

  const copy =
    status === TransactionStatus.Cancelled
      ? t('Swap Canceled')
      : status === TransactionStatus.Cancelling
      ? t('Canceling swap')
      : t('Failed to Cancel')

  return (
    <Flex row alignItems="center" backgroundColor="backgroundOutline" p="md">
      <Flex centered row gap="xs">
        {status === TransactionStatus.FailedCancel ? (
          <AlertTriangle color={theme.colors.accentWarning} height={ICON_SIZE} width={ICON_SIZE} />
        ) : (
          <SlashCircleIcon fill="none" height={ICON_SIZE} />
        )}
        <Text
          color={status === TransactionStatus.FailedCancel ? 'accentWarning' : 'textSecondary'}
          variant="smallLabel">
          {copy}
        </Text>
      </Flex>
    </Flex>
  )
}
