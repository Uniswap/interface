import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text } from 'ui/src'
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
      color="statusCritical"
      fill="statusIconFill"
      fillOpacity={1}
      height={TXN_STATUS_ICON_SIZE}
      width={TXN_STATUS_ICON_SIZE}
    />
  ) : status === TransactionStatus.Failed ? (
    <Flex grow alignItems="flex-end" justifyContent="space-between">
      <Icons.AlertTriangle
        color="DEP_accentWarning"
        fill="surface1"
        height={TXN_STATUS_ICON_SIZE}
        width={TXN_STATUS_ICON_SIZE}
      />
    </Flex>
  ) : (
    <Text color="$neutral3" variant="body3">
      {formattedAddedTime}
    </Text>
  )

  return (
    <Flex gap="$spacing16" mb="$spacing16" width="100%" onPress={onPress}>
      <Flex grow row gap="$spacing12">
        {icon && (
          <Flex centered width={TXN_HISTORY_ICON_SIZE}>
            {icon}
          </Flex>
        )}
        <Flex grow shrink>
          <Flex grow>
            <Flex grow row alignItems="center" gap="$spacing4" justifyContent="space-between">
              <Text color="$neutral2" numberOfLines={1} variant="body2">
                {title}
              </Text>
              {!inProgress && rightBlock}
            </Flex>
            <Flex grow row>
              <Flex grow shrink>
                <Text color="$neutral1" variant="body3">
                  {caption}
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
        {inProgress && (
          <Flex height="100%" justifyContent="center">
            {/* TODO actual loading spinner */}
            <Text color="$neutral1" variant="body3">
              Loading...
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

export default TransactionSummaryLayout
