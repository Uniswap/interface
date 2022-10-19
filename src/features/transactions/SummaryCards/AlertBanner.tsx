import { default as React } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import { Flex } from 'src/components/layout/Flex'
import { Text } from 'src/components/Text'
import { TooltipInfoButton } from 'src/components/tooltip/TooltipButton'
import { TransactionStatus } from 'src/features/transactions/types'

const ICON_SIZE = 20
const INLINE_ICON_SIZE = 10

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
      ? t('Canceled')
      : status === TransactionStatus.Cancelling
      ? t('Canceling')
      : t('Failed to Cancel')

  const failedCancelTooltipContent = t(
    'The network processed your transaction before you canceled it.'
  )

  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="backgroundOutline"
      justifyContent="space-between"
      p="md">
      <Flex centered row gap="xs">
        {status === TransactionStatus.FailedCancel ? (
          <AlertTriangle color={theme.colors.accentWarning} height={ICON_SIZE} width={ICON_SIZE} />
        ) : (
          <SlashCircleIcon fill="none" height={ICON_SIZE} />
        )}
        <Text
          color={status === TransactionStatus.FailedCancel ? 'accentWarning' : 'textSecondary'}
          variant="buttonLabelSmall">
          {copy}
        </Text>
      </Flex>
      {status === TransactionStatus.FailedCancel && (
        <TooltipInfoButton content={failedCancelTooltipContent} />
      )}
    </Flex>
  )
}

export function FailedCancelBadge() {
  const theme = useAppTheme()
  const { t } = useTranslation()
  return (
    <Flex
      grow
      row
      alignItems="center"
      borderRadius="sm"
      gap="xxs"
      px="xs"
      py="xxxs"
      style={{ backgroundColor: theme.colors.accentWarningSoft }}>
      <AlertTriangle
        color={theme.colors.accentWarning}
        height={INLINE_ICON_SIZE}
        width={INLINE_ICON_SIZE}
      />
      <Text color="accentWarning" variant="caption_deprecated">
        {t('Cancel failed')}
      </Text>
    </Flex>
  )
}
