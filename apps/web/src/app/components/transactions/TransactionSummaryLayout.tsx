import { useTranslation } from 'react-i18next'
import { Icons, Text } from 'ui/src'
import { Box, Flex } from 'ui/src/components/layout'
import { TransactionSummaryLayoutProps } from 'wallet/src/features/transactions/SummaryCards/types'
import {
  getTransactionSummaryTitle,
  TXN_HISTORY_ICON_SIZE,
  TXN_STATUS_ICON_SIZE,
  useFormattedTime,
} from 'wallet/src/features/transactions/SummaryCards/utils'
import { TransactionStatus } from 'wallet/src/features/transactions/types'

function TransactionSummaryLayout({
  transaction,
  title,
  caption,
  icon,
}: TransactionSummaryLayoutProps): JSX.Element {
  const { t } = useTranslation()

  const { status } = transaction
  title = title ?? getTransactionSummaryTitle(transaction, t) ?? ''
  const formattedAddedTime = useFormattedTime(transaction.addedTime)

  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending
  const inCancelling =
    status === TransactionStatus.Cancelled || status === TransactionStatus.Cancelling

  const onPress = (): void => {
    // TODO action on press
  }

  const rightBlock = inCancelling ? (
    <Icons.SlashCircle
      color="DEP_accentCritical"
      fill="statusIconFill"
      fillOpacity={1}
      height={TXN_STATUS_ICON_SIZE}
      width={TXN_STATUS_ICON_SIZE}
    />
  ) : status === TransactionStatus.Failed ? (
    <Box alignItems="flex-end" flexGrow={1} justifyContent="space-between">
      <Icons.AlertTriangle
        color="DEP_accentWarning"
        fill="DEP_background0"
        height={TXN_STATUS_ICON_SIZE}
        width={TXN_STATUS_ICON_SIZE}
      />
    </Box>
  ) : (
    <Text color="$DEP_textTertiary" variant="bodyMicro">
      {formattedAddedTime}
    </Text>
  )

  return (
    <Flex mb="$spacing16" width="100%" onPress={onPress}>
      <Flex grow row gap="$spacing12">
        {icon && (
          <Flex centered width={TXN_HISTORY_ICON_SIZE}>
            {icon}
          </Flex>
        )}
        <Flex grow shrink gap="$none">
          <Flex grow gap="$none">
            <Flex grow row alignItems="center" gap="$spacing4" justifyContent="space-between">
              <Text color="$DEP_textSecondary" numberOfLines={1} variant="bodySmall">
                {title}
              </Text>
              {!inProgress && rightBlock}
            </Flex>
            <Flex grow row>
              <Box flexGrow={1} flexShrink={1}>
                <Text color="$DEP_textPrimary" variant="bodyMicro">
                  {caption}
                </Text>
              </Box>
            </Flex>
          </Flex>
        </Flex>
        {inProgress && (
          <Flex height="100%" justifyContent="center">
            {/* TODO actual loading spinner */}
            <Text color="$DEP_textPrimary" variant="bodyMicro">
              Loading...
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

export default TransactionSummaryLayout
