import { Flex, Text } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { BidAveragePriceSection } from '~/features/Toucan/Auction/Bids/BidDetailsModal/BidAveragePriceSection'
import { BidDescription } from '~/features/Toucan/Auction/Bids/BidDetailsModal/BidDescription'
import { BidDetailsHeader } from '~/features/Toucan/Auction/Bids/BidDetailsModal/BidDetailsHeader'
import { BidFdvSummary } from '~/features/Toucan/Auction/Bids/BidDetailsModal/BidFdvSummary'
import { BidSpendSummary } from '~/features/Toucan/Auction/Bids/BidDetailsModal/BidSpendSummary'
import { BidTotalsSection } from '~/features/Toucan/Auction/Bids/BidDetailsModal/BidTotalsSection'
import { useBidDetails } from '~/features/Toucan/Auction/hooks/useBidDetails'
import {
  AuctionDetails,
  AuctionOutcome,
  AuctionProgressState,
  BidTokenInfo,
  UserBid,
} from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { shouldUsePreClaimWindow } from '~/features/Toucan/Auction/utils/preClaimWindow'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

interface BidDetailsModalProps {
  bid: UserBid | null
  isInRange: boolean
  bidTokenInfo: BidTokenInfo
  isOpen: boolean
  onClose: () => void
  onOpenWithdraw: (params: { bidId: string; mode: 'exit' | 'claim'; isPreClaimWindowOverride?: boolean }) => void
}

export function BidDetailsModal({
  bid,
  isInRange,
  bidTokenInfo,
  isOpen,
  onClose,
  onOpenWithdraw,
}: BidDetailsModalProps): JSX.Element {
  const {
    auctionDetails,
    checkpointData,
    onchainCheckpoint,
    outcome,
    hasMetThreshold,
    auctionProgressState,
    currentBlockNumber,
  } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    checkpointData: state.checkpointData,
    onchainCheckpoint: state.onchainCheckpoint,
    outcome: state.progress.outcome,
    hasMetThreshold: state.progress.hasMetThreshold,
    auctionProgressState: state.progress.state,
    currentBlockNumber: state.currentBlockNumber,
  }))

  // Check if we're in the window between auction end and claim period start
  const isInPreClaimWindow = useMemo(() => {
    const claimBlock = auctionDetails?.claimBlock
    if (!claimBlock || !currentBlockNumber) {
      return false
    }
    return currentBlockNumber < Number(claimBlock)
  }, [auctionDetails?.claimBlock, currentBlockNumber])
  // Use on-chain clearing price during active auction for display consistency with isInRange
  // Use simulated clearing price when auction has ended (preserves final state)
  const isAuctionActive = auctionProgressState === AuctionProgressState.IN_PROGRESS
  const effectiveCheckpoint = isAuctionActive ? onchainCheckpoint : checkpointData
  const clearingPrice = getClearingPrice(effectiveCheckpoint, auctionDetails)
  // Use onchainCheckpoint for in-range/refund eligibility detection (always on-chain truth)
  const onchainClearingPrice = getClearingPrice(onchainCheckpoint, auctionDetails)
  const { t } = useTranslation()

  // An undecided outcome cannot say whether this bid's funds are refundable, so it stays on the
  // loading state instead of guessing.
  // TODO | Toucan -- technically should never hit the missing-auctionDetails state, but determine if
  // we need error states
  if (!auctionDetails || outcome === AuctionOutcome.UNKNOWN) {
    return (
      <Modal name={ModalName.BidDetails} isModalOpen={isOpen} onClose={onClose} maxWidth={420} padding={0}>
        <Flex centered p="$spacing8" width="100%">
          <Text variant="body2" color="$neutral2">
            {t('common.loading')}
          </Text>
        </Flex>
      </Modal>
    )
  }

  if (!bid) {
    return (
      <Modal name={ModalName.BidDetails} isModalOpen={isOpen} onClose={onClose} maxWidth={420} padding={0}>
        <Flex centered p="$spacing8" width="100%">
          <Text variant="body2" color="$neutral2">
            {t('toucan.bidDetails.unavailable')}
          </Text>
        </Flex>
      </Modal>
    )
  }

  return (
    <BidDetailsModalContent
      bid={bid}
      isInRange={isInRange}
      bidTokenInfo={bidTokenInfo}
      auctionDetails={auctionDetails}
      clearingPrice={clearingPrice}
      onchainClearingPrice={onchainClearingPrice}
      outcome={outcome}
      hasMetThreshold={hasMetThreshold}
      isInPreClaimWindow={isInPreClaimWindow}
      auctionProgressState={auctionProgressState}
      isOpen={isOpen}
      onClose={onClose}
      onOpenWithdraw={onOpenWithdraw}
    />
  )
}

interface BidDetailsModalContentProps {
  bid: UserBid
  isInRange: boolean
  bidTokenInfo: BidTokenInfo
  auctionDetails: AuctionDetails
  clearingPrice: string
  onchainClearingPrice: string
  outcome: AuctionOutcome
  hasMetThreshold: boolean | undefined
  isInPreClaimWindow: boolean
  auctionProgressState: AuctionProgressState
  isOpen: boolean
  onClose: () => void
  onOpenWithdraw: (params: { bidId: string; mode: 'exit' | 'claim'; isPreClaimWindowOverride?: boolean }) => void
}

function BidDetailsModalContent({
  bid,
  isInRange,
  bidTokenInfo,
  auctionDetails,
  clearingPrice,
  // oxlint-disable-next-line no-unused-vars -- biome-parity: oxlint is stricter here
  onchainClearingPrice,
  outcome,
  hasMetThreshold,
  isInPreClaimWindow,
  auctionProgressState,
  isOpen,
  onClose,
  onOpenWithdraw,
}: BidDetailsModalContentProps): JSX.Element {
  const {
    displayState,
    spentAmount,
    maxBudgetAmount,
    spentFraction,
    refundBudgetAmount,
    refundBudgetLabel,
    refundBudgetSubtext,
    fdvFraction,
    maxFdvDisplay,
    currentFdvDisplay,
    totalTokensReceivedDisplay,
    buttonState,
    description,
    showUnusedBudgetCard,
    filledPercentageDisplay,
    averagePriceData,
  } = useBidDetails({
    bid,
    isInRange,
    bidTokenInfo,
    auctionDetails,
    clearingPrice,
    outcome,
    hasMetThreshold,
    auctionProgressState,
  })

  const { t } = useTranslation()
  const media = useMedia()

  // Use clearingPrice for refund eligibility (uses on-chain during active auction, simulated when ended)
  const isRefundEligible = useMemo(() => {
    if (!clearingPrice) {
      return false
    }

    try {
      return BigInt(bid.maxPrice) < BigInt(clearingPrice)
    } catch {
      return false
    }
  }, [clearingPrice, bid.maxPrice])
  const shouldShowRefundButton = buttonState.isVisible && isRefundEligible

  const isAuctionEnded = auctionProgressState === AuctionProgressState.ENDED
  const isAuctionFailed = outcome === AuctionOutcome.FAILED
  // Selects the pre-claim contract path downstream, so it must stay off live auctions — see
  // shouldUsePreClaimWindow.
  const usePreClaimWindow = shouldUsePreClaimWindow({ outcome, isInPreClaimWindow })

  const handleWithdraw = () => {
    onOpenWithdraw({
      bidId: bid.bidId,
      mode: buttonState.action,
      isPreClaimWindowOverride: usePreClaimWindow,
    })
  }

  const closeLabel = t('common.close')

  return (
    <Modal name={ModalName.BidDetails} isModalOpen={isOpen} onClose={onClose} maxWidth={420} padding={0}>
      <Flex p="$spacing8" pb="$spacing12" width="100%" gap="$spacing12">
        <Flex p="$spacing8" pb={0} gap="$spacing16">
          <BidDetailsHeader auctionDetails={auctionDetails} displayState={displayState} onClose={onClose} />
          <BidTotalsSection
            bidTokenSymbol={bidTokenInfo.symbol}
            tokenSymbol={auctionDetails.token?.currency.symbol ?? auctionDetails.tokenSymbol}
            totalTokensReceivedDisplay={totalTokensReceivedDisplay}
            filledPercentageDisplay={filledPercentageDisplay}
            showUnusedBudget={showUnusedBudgetCard}
            refundBudgetLabel={refundBudgetLabel}
            refundBudgetAmount={refundBudgetAmount}
            refundBudgetSubtext={refundBudgetSubtext}
            isAuctionFailed={isAuctionFailed}
          />
          {averagePriceData ? (
            <BidAveragePriceSection
              avgPriceDecimal={averagePriceData.avgPriceDecimal}
              bidTokenSymbol={averagePriceData.bidTokenSymbol}
              avgPriceFiat={averagePriceData.avgPriceFiat}
              fdvFromAvgPriceDisplay={averagePriceData.fdvFromAvgPriceDisplay}
              percentBelowClearing={averagePriceData.percentBelowClearing}
            />
          ) : null}
          <Flex row gap="$spacing12">
            <BidSpendSummary
              spentAmount={spentAmount}
              maxBudgetAmount={maxBudgetAmount}
              bidTokenSymbol={bidTokenInfo.symbol}
              spentFraction={spentFraction}
              displayState={displayState}
              isAuctionEnded={auctionProgressState === AuctionProgressState.ENDED}
            />

            <Flex width={1} backgroundColor="$surface3" />

            {/* Ended auctions show the frozen end-of-auction FDV, so label it "FDV at launch" regardless of graduation (LP-822) */}
            <BidFdvSummary
              currentFdvDisplay={currentFdvDisplay}
              maxFdvDisplay={maxFdvDisplay}
              fdvFraction={fdvFraction}
              displayState={displayState}
              isAuctionEnded={isAuctionEnded}
            />
          </Flex>

          <BidDescription description={description} />
        </Flex>

        {shouldShowRefundButton && (
          <ToucanActionButton
            label={buttonState.label}
            onPress={handleWithdraw}
            isDisabled={!buttonState.isEnabled}
            shouldUseBranded
          />
        )}
        {media.sm && <ToucanActionButton label={closeLabel} onPress={onClose} emphasis="secondary" />}
      </Flex>
    </Modal>
  )
}
