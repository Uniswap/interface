import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { BidAveragePriceSection } from '~/components/Toucan/Auction/Bids/BidDetailsModal/BidAveragePriceSection'
import { BidDescription } from '~/components/Toucan/Auction/Bids/BidDetailsModal/BidDescription'
import { BidDetailsHeader } from '~/components/Toucan/Auction/Bids/BidDetailsModal/BidDetailsHeader'
import { BidFdvSummary } from '~/components/Toucan/Auction/Bids/BidDetailsModal/BidFdvSummary'
import { BidSpendSummary } from '~/components/Toucan/Auction/Bids/BidDetailsModal/BidSpendSummary'
import { BidTotalsSection } from '~/components/Toucan/Auction/Bids/BidDetailsModal/BidTotalsSection'
import { useBidDetails } from '~/components/Toucan/Auction/hooks/useBidDetails'
import { AuctionDetails, AuctionProgressState, BidTokenInfo, UserBid } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'
import { ToucanActionButton } from '~/components/Toucan/Shared/ToucanActionButton'

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
  const { auctionDetails, checkpointData, onchainCheckpoint, isGraduated, auctionProgressState, currentBlockNumber } =
    useAuctionStore((state) => ({
      auctionDetails: state.auctionDetails,
      checkpointData: state.checkpointData,
      onchainCheckpoint: state.onchainCheckpoint,
      isGraduated: state.progress.isGraduated,
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

  // TODO | Toucan -- technically should never hit this state, but determine if we need error or loading states
  if (!auctionDetails) {
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
      isGraduated={isGraduated}
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
  isGraduated: boolean
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
  onchainClearingPrice,
  isGraduated,
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
    isGraduated,
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
  // Pass isPreClaimWindow when we're in pre-claim window for a graduated auction
  const shouldUsePreClaimWindow = isAuctionEnded && isGraduated && isInPreClaimWindow

  const handleWithdraw = () => {
    onOpenWithdraw({
      bidId: bid.bidId,
      mode: buttonState.action,
      isPreClaimWindowOverride: shouldUsePreClaimWindow,
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
            isGraduated={isGraduated}
            isAuctionEnded={isAuctionEnded}
          />
          {averagePriceData ? (
            <BidAveragePriceSection
              avgPriceDecimal={averagePriceData.avgPriceDecimal}
              bidTokenSymbol={averagePriceData.bidTokenSymbol}
              avgPriceFiat={averagePriceData.avgPriceFiat}
              fdvFromAvgPriceDisplay={averagePriceData.fdvFromAvgPriceDisplay}
              percentBelowClearing={averagePriceData.percentBelowClearing}
              isGraduated={isGraduated}
              isAuctionEnded={isAuctionEnded}
            />
          ) : null}
          {!(isAuctionEnded && !isGraduated) && (
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

              <BidFdvSummary
                currentFdvDisplay={currentFdvDisplay}
                maxFdvDisplay={maxFdvDisplay}
                fdvFraction={fdvFraction}
                displayState={displayState}
              />
            </Flex>
          )}

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
