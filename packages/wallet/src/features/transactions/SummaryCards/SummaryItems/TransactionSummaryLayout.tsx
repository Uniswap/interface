import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, Flex, SpinningLoader, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import SlashCircleIcon from 'ui/src/assets/icons/slash-circle.svg'
import { AlertTriangleFilled, UniswapX } from 'ui/src/components/icons'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { DisplayNameText } from 'wallet/src/components/accounts/DisplayNameText'
import { TransactionDetailsModal } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/TransactionDetailsModal'
import { useTransactionActions } from 'wallet/src/features/transactions/SummaryCards/DetailsModal/useTransactionActions'
import { TransactionSummaryTitle } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/TransactionSummaryTitle'
import { TransactionSummaryLayoutProps } from 'wallet/src/features/transactions/SummaryCards/types'
import {
  TXN_HISTORY_ICON_SIZE,
  TXN_STATUS_ICON_SIZE,
  getTransactionSummaryTitle,
  useFormattedTime,
} from 'wallet/src/features/transactions/SummaryCards/utils'
import { useIsQueuedTransaction } from 'wallet/src/features/transactions/hooks'
import { useActiveAccountWithThrow, useDisplayName } from 'wallet/src/features/wallet/hooks'
import { usePostTextElementPositionProps } from 'wallet/src/utils/layout'
import { openTransactionLink } from 'wallet/src/utils/linking'

const LOADING_SPINNER_SIZE = 20

function TransactionSummaryLayout({
  authTrigger,
  transaction,
  title,
  caption,
  postCaptionElement,
  icon,
  index,
  onRetry,
}: TransactionSummaryLayoutProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isTransactionDetailsModalEnabled = useFeatureFlag(FeatureFlags.TransactionDetailsSheet)

  const { type } = useActiveAccountWithThrow()
  const readonly = type === AccountType.Readonly

  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const { status, hash, chainId } = transaction

  const walletDisplayName = useDisplayName(transaction.ownerAddress)

  title = title ?? getTransactionSummaryTitle(transaction, t) ?? ''

  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending
  const isCancel = status === TransactionStatus.Canceled || status === TransactionStatus.Cancelling

  // Monitor latest nonce to identify queued transactions.
  const queued = useIsQueuedTransaction(transaction)

  const { openActionsModal, renderModals } = useTransactionActions({
    authTrigger,
    transaction,
  })

  const onPress = async (): Promise<void> => {
    if (readonly) {
      await openTransactionLink(hash, chainId)
    } else {
      if (isTransactionDetailsModalEnabled) {
        setShowDetailsModal(true)
      } else {
        openActionsModal()
      }
    }
  }

  const { postTextElementPositionProps, onTextLayout } = usePostTextElementPositionProps()

  const formattedAddedTime = useFormattedTime(transaction.addedTime)

  const statusIconFill = colors.surface1.get()

  const rightBlock = isCancel ? (
    <SlashCircleIcon
      color={colors.statusCritical.val}
      fill={statusIconFill}
      fillOpacity={1}
      height={TXN_STATUS_ICON_SIZE}
      width={TXN_STATUS_ICON_SIZE}
    />
  ) : status === TransactionStatus.Failed ? (
    <Flex grow alignItems="flex-end" justifyContent="space-between">
      <AlertTriangleFilled
        color={colors.DEP_accentWarning.val}
        fill={colors.DEP_accentWarning.val}
        size={TXN_STATUS_ICON_SIZE}
      />
    </Flex>
  ) : (
    <Text color="$neutral3" variant="body3">
      {formattedAddedTime}
    </Text>
  )

  return (
    <>
      <TouchableArea mb="$spacing4" overflow="hidden" testID={`activity-list-item-${index ?? 0}`} onPress={onPress}>
        <Flex
          grow
          row
          backgroundColor="$surface1"
          borderRadius="$rounded16"
          gap="$spacing12"
          hoverStyle={{ backgroundColor: '$surface2' }}
          px={isWeb ? '$spacing8' : '$none'}
          py="$spacing8"
        >
          {icon && (
            <Flex centered width={TXN_HISTORY_ICON_SIZE}>
              {icon}
            </Flex>
          )}
          <Flex grow shrink>
            <Flex grow>
              <Flex grow row alignItems="center" gap="$spacing4" justifyContent="space-between">
                <Flex row shrink alignItems="center" gap="$spacing4">
                  {walletDisplayName ? (
                    <DisplayNameText
                      displayName={walletDisplayName}
                      textProps={{ color: '$accent1', variant: 'body1' }}
                    />
                  ) : null}
                  {(transaction.routing === Routing.DUTCH_V2 || transaction.routing === Routing.DUTCH_LIMIT) && (
                    <UniswapX size="$icon.16" />
                  )}
                  <TransactionSummaryTitle title={title} transaction={transaction} />
                </Flex>
                {!inProgress && rightBlock}
              </Flex>
              <Flex grow row gap="$spacing16">
                <Flex grow row shrink pr={postTextElementPositionProps ? '$spacing24' : undefined}>
                  <Text color="$neutral1" variant="body2" onTextLayout={onTextLayout}>
                    {caption}
                  </Text>
                  <Flex {...postTextElementPositionProps}>{postCaptionElement}</Flex>
                </Flex>
                {status === TransactionStatus.Failed && onRetry && (
                  <Flex flexShrink={0}>
                    <Text color="$accent1" variant="buttonLabel2" onPress={onRetry}>
                      {t('common.button.retry')}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>
          {inProgress && (
            <Flex justifyContent="center">
              <SpinningLoader disabled={queued} size={LOADING_SPINNER_SIZE} />
            </Flex>
          )}
        </Flex>
      </TouchableArea>
      <AnimatePresence>
        {showDetailsModal && (
          <TransactionDetailsModal
            authTrigger={authTrigger}
            transactionDetails={transaction}
            onClose={(): void => setShowDetailsModal(false)}
          />
        )}
      </AnimatePresence>
      {renderModals()}
    </>
  )
}

export default memo(TransactionSummaryLayout)
