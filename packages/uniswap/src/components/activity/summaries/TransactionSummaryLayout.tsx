import { TradingApi } from '@universe/api'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { FlexProps, TextProps } from 'ui/src'
import { AnimatePresence, Flex, SpinningLoader, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { SlashCircle } from 'ui/src/components/icons/SlashCircle'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { DisplayNameText } from 'uniswap/src/components/accounts/DisplayNameText'
import { TransactionDetailsModal } from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { TransactionSummaryTitle } from 'uniswap/src/components/activity/general/TransactionSummaryTitle'
import { useFormattedTimeForActivity } from 'uniswap/src/components/activity/hooks/useFormattedTime'
import type { TransactionSummaryLayoutProps } from 'uniswap/src/components/activity/types'
import { TXN_HISTORY_ICON_SIZE, TXN_STATUS_ICON_SIZE } from 'uniswap/src/components/activity/utils'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useTransactionActions } from 'uniswap/src/features/activity/hooks/useTransactionActions'
import { getTransactionSummaryTitle } from 'uniswap/src/features/activity/utils/getTransactionSummaryTitle'
import { useIsQueuedTransaction } from 'uniswap/src/features/transactions/hooks/useIsQueuedTransaction'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { openTransactionLink } from 'uniswap/src/utils/linking'
import { isWebPlatform } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const LOADING_SPINNER_SIZE = 20

const hoverStyle: FlexProps['hoverStyle'] = { backgroundColor: '$surface2' }

const displayNameTextProps: TextProps = { color: '$accent1', variant: 'body1' }

export const TransactionSummaryLayout = memo(function _TransactionSummaryLayout({
  caption,
  transaction,
  authTrigger,
  icon,
  index,
  onRetry,
  title,
}: TransactionSummaryLayoutProps): JSX.Element {
  // Monitor latest nonce to identify queued transactions.
  // We moved this outside of `TransactionSummaryLayoutContent` to avoid re-rendering the entire component when the nonce changes,
  // given that we do not care about the nonce itself but just about the `isQueued` boolean.
  const isQueued = useIsQueuedTransaction(transaction)

  return (
    <TransactionSummaryLayoutContent
      caption={caption}
      icon={icon}
      index={index}
      isQueued={isQueued}
      title={title}
      authTrigger={authTrigger}
      transaction={transaction}
      onRetry={onRetry}
    />
  )
})

/**
 * IMPORTANT: If you add any new hooks to this component, make sure to profile the app using `react-devtools` to verify
 *            that the component is not re-rendering unnecessarily.
 */
const TransactionSummaryLayoutContent = memo(function _TransactionSummaryLayoutContent({
  authTrigger,
  transaction,
  title,
  caption,
  icon,
  index,
  isQueued,
  onRetry,
}: TransactionSummaryLayoutProps & {
  isQueued: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { evmAccount } = useWallet()
  const readonly = !evmAccount || evmAccount.accountType === AccountType.Readonly

  const {
    value: showDetailsModal,
    setTrue: handleShowDetailsModal,
    setFalse: handleHideDetailsModal,
  } = useBooleanState(false)

  const { status, hash, chainId } = transaction

  const { useWalletDisplayName } = useUniswapContext()
  const walletDisplayName = useWalletDisplayName(transaction.ownerAddress)

  title = title ?? getTransactionSummaryTitle(transaction, t) ?? ''

  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending
  const isCancel = status === TransactionStatus.Canceled || status === TransactionStatus.Cancelling

  const { renderModals } = useTransactionActions({
    authTrigger,
    transaction,
  })

  const onPress = useEvent(async (): Promise<void> => {
    if (readonly) {
      await openTransactionLink(hash, chainId)
    } else {
      handleShowDetailsModal()
    }
  })

  const formattedAddedTime = useFormattedTimeForActivity(transaction.addedTime)

  const statusIconFill = colors.surface1.get()

  const rightBlock = useMemo(
    () =>
      isCancel ? (
        <SlashCircle color="$statusCritical" fill={statusIconFill} fillOpacity={1} size={TXN_STATUS_ICON_SIZE} />
      ) : status === TransactionStatus.Failed ? (
        <Flex grow alignItems="flex-end" justifyContent="space-between">
          <AlertTriangleFilled color="$statusWarning" fill={colors.statusWarning.val} size={TXN_STATUS_ICON_SIZE} />
        </Flex>
      ) : (
        <Text color="$neutral3" variant="body3">
          {formattedAddedTime}
        </Text>
      ),
    [isCancel, status, statusIconFill, formattedAddedTime, colors],
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
          hoverStyle={hoverStyle}
          px={isWebPlatform ? '$spacing8' : '$none'}
          py="$spacing8"
        >
          {icon && (
            <Flex centered width={TXN_HISTORY_ICON_SIZE}>
              {icon}
            </Flex>
          )}
          <Flex grow shrink>
            <Flex grow gap="$spacing2">
              <Flex grow row alignItems="center" gap="$spacing4" justifyContent="space-between">
                <Flex row shrink alignItems="center" gap="$spacing4">
                  {walletDisplayName ? (
                    <DisplayNameText displayName={walletDisplayName} textProps={displayNameTextProps} />
                  ) : null}
                  {(transaction.routing === TradingApi.Routing.DUTCH_V2 ||
                    transaction.routing === TradingApi.Routing.DUTCH_LIMIT) && <UniswapX size="$icon.16" />}
                  <TransactionSummaryTitle title={title} transaction={transaction} />
                </Flex>
                {!inProgress && rightBlock}
              </Flex>
              <Flex grow row gap="$spacing16">
                {typeof caption === 'string' ? <Text flex={1}>{caption}</Text> : caption}
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
              <SpinningLoader color="$accent1" disabled={isQueued} size={LOADING_SPINNER_SIZE} />
            </Flex>
          )}
        </Flex>
      </TouchableArea>
      <AnimatePresence>
        {showDetailsModal && (
          <TransactionDetailsModal
            authTrigger={authTrigger}
            transactionDetails={transaction}
            onClose={handleHideDetailsModal}
          />
        )}
      </AnimatePresence>
      {renderModals()}
    </>
  )
})
