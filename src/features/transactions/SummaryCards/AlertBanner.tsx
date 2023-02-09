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

export default function AlertBanner({
  status,
}: {
  status:
    | TransactionStatus.Cancelled
    | TransactionStatus.Cancelling
    | TransactionStatus.FailedCancel
}): JSX.Element {
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
      backgroundColor="background2"
      borderBottomColor="backgroundOutline"
      borderBottomWidth={1}
      borderTopLeftRadius="rounded16"
      borderTopRightRadius="rounded16"
      justifyContent="space-between"
      p="spacing16">
      <Flex centered row gap="spacing8">
        {status === TransactionStatus.FailedCancel ? (
          <AlertTriangle color={theme.colors.textSecondary} height={ICON_SIZE} width={ICON_SIZE} />
        ) : (
          <SlashCircleIcon color={theme.colors.textSecondary} fill="none" height={ICON_SIZE} />
        )}
        <Text color="textSecondary" variant="buttonLabelSmall">
          {copy}
        </Text>
      </Flex>
      {status === TransactionStatus.FailedCancel && (
        <TooltipInfoButton content={failedCancelTooltipContent} size={theme.iconSizes.icon24} />
      )}
    </Flex>
  )
}
