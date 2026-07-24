import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { QuestionInCircleFilled } from 'ui/src/components/icons/QuestionInCircleFilled'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { Bid } from '~/features/Toucan/Auction/Bids/Bid'
import { BidDetailsModal } from '~/features/Toucan/Auction/Bids/BidDetailsModal'
import { BidsSkeleton } from '~/features/Toucan/Auction/Bids/BidsSkeleton'
import { WithdrawModal } from '~/features/Toucan/Auction/Bids/WithdrawModal/WithdrawModal'
import { useBidsListData } from '~/features/Toucan/Auction/hooks/useBidsListData'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useWithdrawButtonState } from '~/features/Toucan/Auction/hooks/useWithdrawButtonState'
import { AuctionProgressState, type UserBid } from '~/features/Toucan/Auction/store/types'
import {
  useAuctionStore,
  useAuctionStoreActions,
  useIsAuctionFailed,
} from '~/features/Toucan/Auction/store/useAuctionStore'
import { InlineAlertBanner } from '~/features/Toucan/Shared/InlineAlertBanner'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

export function Bids(): JSX.Element {
  const media = useMedia()
  const { t } = useTranslation()

  const { auctionDetails, auctionProgress, isGraduated, currentBlockNumber, chartSelectedBid } = useAuctionStore(
    (state) => ({
      auctionDetails: state.auctionDetails,
      auctionProgress: state.progress.state,
      isGraduated: state.progress.isGraduated,
      currentBlockNumber: state.currentBlockNumber,
      chartSelectedBid: state.chartSelectedBid,
    }),
  )

  const { bidTokenInfo } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  const isAuctionEnded = auctionProgress === AuctionProgressState.ENDED
  const isAuctionInProgress = auctionProgress === AuctionProgressState.IN_PROGRESS
  const isAuctionFailedToGraduate = useIsAuctionFailed()

  const { bidItems, isLoading, hasErrors } = useBidsListData()

  const [selectedBid, setSelectedBid] = useState<{
    bidId: string
    isOpen: boolean
  } | null>(null)
  const [withdrawModalState, setWithdrawModalState] = useState<{
    isOpen: boolean
    bidId?: string
    mode?: 'exit' | 'claim'
    isPreClaimWindow?: boolean
  }>({ isOpen: false })

  // Check if we're in the window between auction end and claim period start
  const isInPreClaimWindow = useMemo(() => {
    const claimBlock = auctionDetails?.claimBlock
    if (!claimBlock || !currentBlockNumber) {
      return false
    }
    return currentBlockNumber < Number(claimBlock)
  }, [auctionDetails?.claimBlock, currentBlockNumber])

  const { setChartSelectedBid } = useAuctionStoreActions()

  // Open bid details modal when a chart marker is clicked
  useEffect(() => {
    if (chartSelectedBid) {
      setSelectedBid({ bidId: chartSelectedBid.bidId, isOpen: true })
      setChartSelectedBid(null)
    }
  }, [chartSelectedBid, setChartSelectedBid])

  const handleBidPress = useEvent((bid: UserBid, _isInRange: boolean) => {
    if (bid.bidId === 'optimistic-pending') {
      return
    }
    setSelectedBid({ bidId: bid.bidId, isOpen: true })
  })

  const handleCloseModal = useEvent(() => {
    setSelectedBid((previous) => (previous ? { ...previous, isOpen: false } : previous))
  })

  const handleOpenWithdraw = useEvent(
    ({
      bidId,
      mode,
      isPreClaimWindowOverride,
    }: {
      bidId: string
      mode: 'exit' | 'claim'
      isPreClaimWindowOverride?: boolean
    }) => {
      // Use the override if provided, otherwise use the calculated value
      // This allows the BidDetailsModal to pass the correct value based on its own state
      const usePreClaimWindow = isPreClaimWindowOverride ?? (isAuctionEnded && isGraduated && isInPreClaimWindow)
      setWithdrawModalState({
        isOpen: true,
        bidId,
        mode,
        isPreClaimWindow: usePreClaimWindow,
      })
    },
  )

  const selectedBidItem = useMemo(() => {
    if (!selectedBid?.bidId) {
      return null
    }
    return bidItems.find((item) => item.bid.bidId === selectedBid.bidId) ?? null
  }, [bidItems, selectedBid?.bidId])

  const hasSelectedBid = Boolean(selectedBid?.isOpen)
  // Defensive: a persisted bidId should always resolve to a bid item.
  const modalBid = selectedBidItem?.bid ?? null

  // Get withdraw button state from shared hook
  const {
    label: withdrawLabel,
    isDisabled: isWithdrawDisabledFromHook,
    disabledTooltip: withdrawDisabledTooltip,
    allBidsExited,
  } = useWithdrawButtonState({
    isGraduated: Boolean(isGraduated),
    claimBlock: auctionDetails?.claimBlock,
    currentBlockNumber,
    chainId: auctionDetails?.chainId,
  })

  // Loading state or empty state
  if (isLoading || (bidItems.length === 0 && !hasErrors)) {
    return (
      <Flex width="100%" gap="$spacing12">
        <BidsSkeleton />
      </Flex>
    )
  }

  return (
    <Flex width="100%" grow justifyContent="space-between" gap="$spacing12">
      <Flex row justifyContent="space-between" alignItems="center">
        <Text color="$neutral2" variant="subheading2">
          {t('toucan.auction.yourBids')}
        </Text>
        <InfoTooltip
          placement="top"
          trigger={<QuestionInCircleFilled color="$neutral2" size="$icon.20" />}
          text={t('toucan.auction.yourBids.tooltip')}
        />
      </Flex>
      {hasErrors && (
        <Flex
          px="$spacing12"
          py="$spacing8"
          backgroundColor="$statusCritical2"
          borderRadius="$rounded12"
          borderWidth="$spacing1"
          borderColor="$statusCritical"
        >
          <Text variant="body4" color="$statusCritical">
            {t('toucan.auction.myBids.partialError')}
          </Text>
        </Flex>
      )}
      {isAuctionFailedToGraduate && (
        <Flex mb="$spacing12">
          <InlineAlertBanner
            variant="warning"
            title={t('toucan.auction.myBids.failedToLaunch')}
            description={
              allBidsExited
                ? t('toucan.auction.myBids.failedToLaunch.description.withdrawn')
                : t('toucan.auction.myBids.failedToLaunch.description', {
                    token: auctionDetails?.token?.currency.symbol ?? auctionDetails?.tokenSymbol ?? t('common.token'),
                  })
            }
          />
        </Flex>
      )}
      <Flex
        gap="$spacing4"
        maxHeight={420}
        flexGrow={1}
        flexShrink={1}
        minHeight={0}
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarGutter: 'stable both-edges',
        }}
      >
        {bidItems.map((item, index) => (
          <Bid key={item.bid.bidId || `${item.bid.maxPrice}-${index}`} item={item} onPress={handleBidPress} />
        ))}
      </Flex>
      {/* Hide on $lg and below - mobile uses AuctionChartContainer inline button or ToucanToken fixed button */}
      {!media.lg && !isAuctionInProgress && (
        <ToucanActionButton
          elementName={ElementName.AuctionWithdrawTokensButton}
          label={withdrawLabel}
          onPress={() => setWithdrawModalState({ isOpen: true })}
          isDisabled={isWithdrawDisabledFromHook}
          disabledTooltip={isWithdrawDisabledFromHook ? withdrawDisabledTooltip : undefined}
        />
      )}
      {hasSelectedBid && bidTokenInfo ? (
        <BidDetailsModal
          bid={modalBid}
          isInRange={selectedBidItem?.isInRange ?? false}
          bidTokenInfo={bidTokenInfo}
          isOpen={hasSelectedBid}
          onClose={handleCloseModal}
          onOpenWithdraw={handleOpenWithdraw}
        />
      ) : null}
      <WithdrawModal
        isOpen={withdrawModalState.isOpen}
        onClose={() => setWithdrawModalState({ isOpen: false })}
        bidId={withdrawModalState.bidId}
        mode={withdrawModalState.mode}
        isPreClaimWindow={withdrawModalState.isPreClaimWindow}
      />
    </Flex>
  )
}
