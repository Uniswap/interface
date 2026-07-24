import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { useIsModeMismatch } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { setIsTestnetModeEnabled } from 'uniswap/src/features/settings/slice'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useWithdrawBidAndClaimTokensReviewData } from '~/features/Toucan/Auction/Bids/WithdrawModal/useWithdrawBidAndClaimTokensReviewData'
import { useWithdrawModalData } from '~/features/Toucan/Auction/Bids/WithdrawModal/useWithdrawModalData'
import { useWithdrawBidAndClaimTokensFormSubmit } from '~/features/Toucan/Auction/hooks/useWithdrawBidAndClaimTokensFormSubmit'
import { AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getRequiredTestnetMode } from '~/features/Toucan/Shared/getRequiredTestnetMode'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'
import { useWithdrawBidAndClaimTokens } from '~/hooks/useWithdrawBidAndClaimTokens'

interface WithdrawModalProps {
  isOpen: boolean
  onClose: () => void
  bidId?: string
  mode?: 'exit' | 'claim'
  isPreClaimWindow?: boolean
}

type SubmissionStatus = 'idle' | 'waitingForWallet'

// oxlint-disable-next-line complexity
export function WithdrawModal({
  isOpen,
  onClose,
  bidId,
  mode = 'exit',
  isPreClaimWindow = false,
}: WithdrawModalProps): JSX.Element {
  const { t } = useTranslation()
  const accountAddress = useActiveAddress(Platform.EVM)
  const triggerWithdrawBidAndClaimTokens = useWithdrawBidAndClaimTokens()
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>('idle')

  const auctionDetails = useAuctionStore((state) => state.auctionDetails)
  const progress = useAuctionStore((state) => state.progress)

  // Determine auction status for analytics
  const isGraduated = progress.isGraduated
  const isAuctionCompleted = progress.state === AuctionProgressState.ENDED

  // Get calculated withdrawal data
  const {
    formattedAuctionTokens,
    formattedBidTokens,
    bidTokensFiatValue,
    averageCostPerToken,
    auctionLogoUrl,
    auctionTokenSymbol,
    bidTokenSymbol,
    bidTokenLogoUrl,
    auctionTokenAmountUsd,
    bidTokenAmountUsd,
    budgetTokenAmountRaw,
    budgetTokenAmountUsd,
    maxFdvUsd,
    chainId,
    hasAuctionTokens,
    hasBidTokens,
    hasAnyTokens,
    showPartialFillInfo,
    isAuctionEnded,
    auctionTokensToClaim,
    bidTokensToClaim,
  } = useWithdrawModalData({ bidId })

  // Initialize form submit hook
  const { submitState } = useWithdrawBidAndClaimTokensFormSubmit({
    accountAddress,
    auctionContractAddress: auctionDetails?.address,
    chainId: auctionDetails?.chainId,
    bidId,
    mode,
    isPreClaimWindow,
    onTransactionSubmitted: onClose,
    triggerWithdrawBidAndClaimTokens,
    withdrawalData: {
      auctionTokenAddress: auctionDetails?.tokenAddress,
      auctionTokenSymbol,
      auctionTokenAmountRaw: isAuctionEnded && auctionTokensToClaim > 0n ? auctionTokensToClaim.toString() : undefined,
      auctionTokenAmountUsd,
      bidTokenAddress: auctionDetails?.currency,
      bidTokenSymbol,
      bidTokenAmountRaw: bidTokensToClaim > 0n ? bidTokensToClaim.toString() : undefined,
      bidTokenAmountUsd,
      budgetTokenAmountRaw,
      budgetTokenAmountUsd,
      maxFdvUsd,
    },
    isGraduated,
    isAuctionCompleted,
  })

  // Initialize review data hook for transaction preparation
  const { preparedWithdrawBidAndClaimTokens, isPreparing, isConfirmDisabled } = useWithdrawBidAndClaimTokensReviewData({
    isOpen,
    submitState,
    auctionChainId: auctionDetails?.chainId,
  })

  const pendingWithdrawalBidIds = useAuctionStore((state) => state.pendingWithdrawalBidIds)
  const awaitingConfirmationBidIds = useAuctionStore((state) => state.awaitingConfirmationBidIds)

  // Check if this specific bid (or any bid in all mode) is pending
  const isWithdrawalPending = bidId ? pendingWithdrawalBidIds.has(bidId) : pendingWithdrawalBidIds.size > 0
  const isAwaitingWithdrawalConfirmation = bidId
    ? awaitingConfirmationBidIds.has(bidId)
    : awaitingConfirmationBidIds.size > 0

  const isSubmitting = submissionStatus !== 'idle'
  const isWaitingForWallet = submissionStatus === 'waitingForWallet'

  // Withdrawing calls selectChain just like bidding, so a testnet/mainnet mode mismatch dead-ends the
  // withdraw saga with "Failed to switch networks for Toucan withdraw". When the app's mode doesn't
  // match the auction chain, the button becomes a one-tap CTA to flip testnet mode (see
  // getRequiredTestnetMode) instead of letting the user hit that error.
  const dispatch = useDispatch()
  const isModeMismatch = useIsModeMismatch(auctionDetails?.chainId)
  const requiredTestnetMode = getRequiredTestnetMode({
    isWalletConnected: Boolean(accountAddress),
    isActionAvailable: hasAnyTokens,
    isModeMismatch,
    chainId: auctionDetails?.chainId,
  })
  const needsTestnetModeSwitch = requiredTestnetMode !== undefined

  const helpLink = UniswapHelpUrls.articles.toucanWithdrawHelp

  const modalTitle = t('toucan.withdraw.title')

  const withdrawButtonLabel = useMemo(() => {
    if (needsTestnetModeSwitch) {
      return requiredTestnetMode ? t('toucan.action.enableTestnetMode') : t('toucan.action.disableTestnetMode')
    }
    if (isPreparing) {
      return t('common.loading')
    }
    if (isWaitingForWallet) {
      return t('common.confirmWallet')
    }
    if (isWithdrawalPending || isAwaitingWithdrawalConfirmation) {
      return hasAuctionTokens
        ? t('toucan.auction.withdrawTokens.withdrawingTokens')
        : t('toucan.auction.withdrawTokens.withdrawingFunds')
    }
    return t('toucan.withdraw.title')
  }, [
    needsTestnetModeSwitch,
    requiredTestnetMode,
    hasAuctionTokens,
    isAwaitingWithdrawalConfirmation,
    isPreparing,
    isWaitingForWallet,
    isWithdrawalPending,
    t,
  ])

  const handleSubmit = useEvent(async () => {
    if (requiredTestnetMode !== undefined) {
      dispatch(setIsTestnetModeEnabled(requiredTestnetMode))
      return
    }
    if (!preparedWithdrawBidAndClaimTokens || isConfirmDisabled || isSubmitting) {
      return
    }
    setSubmissionStatus('waitingForWallet')
    try {
      await submitState.onSubmit(preparedWithdrawBidAndClaimTokens)
    } catch {
      // Error handling is done in submitState
    } finally {
      setSubmissionStatus('idle')
    }
  })

  // Reset submission status if an error occurs (including wallet rejections)
  useEffect(() => {
    if (!submitState.error) {
      return
    }
    setSubmissionStatus('idle')
  }, [submitState.error])

  // Reset submission status when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubmissionStatus('idle')
    }
  }, [isOpen])

  return (
    <Modal name={ModalName.BidWithdraw} isModalOpen={isOpen} onClose={onClose} maxWidth={420} padding={0}>
      <Flex gap="$spacing16" width="100%" p="$spacing16">
        <GetHelpHeader title={modalTitle} closeModal={onClose} link={helpLink} />

        {/* Partial fill info banner - only show after auction ends */}
        {isAuctionEnded && showPartialFillInfo && (
          <Flex
            row
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            p="$spacing12"
            gap="$spacing12"
            alignItems="flex-start"
          >
            <InfoCircleFilled size="$icon.20" color="$neutral1" />
            <Text variant="body3" color="$neutral2" flex={1}>
              {t('toucan.withdraw.partialFillInfo')}
            </Text>
          </Flex>
        )}

        {/* Withdrawal amounts */}
        <Flex gap="$spacing16" minHeight={100}>
          {/* Auction tokens to claim - only show after auction ends and not during preclaim window */}
          {isAuctionEnded && hasAuctionTokens && !isPreClaimWindow && (
            <Flex gap="$spacing4">
              <Flex row justifyContent="space-between" alignItems="center">
                <Text variant="heading2" color="$neutral1">
                  {formattedAuctionTokens} {auctionTokenSymbol}
                </Text>
                <TokenLogo url={auctionLogoUrl} chainId={chainId} symbol={auctionTokenSymbol} size={40} />
              </Flex>
              {averageCostPerToken && (
                <Text variant="body3" color="$neutral2">
                  {t('toucan.withdraw.avgCost', {
                    cost: averageCostPerToken,
                    symbol: bidTokenSymbol ?? t('common.token'),
                  })}
                </Text>
              )}
            </Flex>
          )}

          {isAuctionEnded && hasAuctionTokens && hasBidTokens && !isPreClaimWindow && (
            <Text variant="body2" color="$neutral2">
              {t('common.and')}
            </Text>
          )}

          {/* Bid tokens to refund - show during and after auction */}
          {hasBidTokens && (
            <Flex gap="$spacing4">
              <Flex row justifyContent="space-between" alignItems="center">
                <Text variant="heading2" color="$neutral1">
                  {formattedBidTokens}
                </Text>
                <TokenLogo url={bidTokenLogoUrl} chainId={chainId} symbol={bidTokenSymbol} size={40} />
              </Flex>
              {bidTokensFiatValue && (
                <Text variant="body3" color="$neutral2">
                  {bidTokensFiatValue}
                </Text>
              )}
            </Flex>
          )}

          {/* No tokens message - only show after auction ends */}
          {isAuctionEnded && !hasAuctionTokens && !hasBidTokens && (
            <Text variant="body2" color="$neutral2">
              {t('toucan.withdraw.noTokens')}
            </Text>
          )}
        </Flex>

        {/* Withdraw button */}
        <ToucanActionButton
          elementName={ElementName.AuctionWithdrawBalanceButton}
          label={withdrawButtonLabel}
          onPress={handleSubmit}
          shouldUseBranded
          isDisabled={
            !needsTestnetModeSwitch &&
            (isConfirmDisabled ||
              isSubmitting ||
              isWithdrawalPending ||
              isAwaitingWithdrawalConfirmation ||
              !hasAnyTokens)
          }
          loading={
            !needsTestnetModeSwitch &&
            (isPreparing || isWaitingForWallet || isWithdrawalPending || isAwaitingWithdrawalConfirmation)
          }
        />
      </Flex>
    </Modal>
  )
}
