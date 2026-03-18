import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, useIsDarkMode, useMedia } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import ErrorBoundary from '~/components/ErrorBoundary'
import { BidDistributionChartTab } from '~/components/Toucan/Auction/AuctionChartShared'
import { ChartFooter } from '~/components/Toucan/Auction/BidDistributionChart/BidDistributionChartFooter'
import { BidDistributionChartHeader } from '~/components/Toucan/Auction/BidDistributionChart/BidDistributionChartHeader'
import { BidDistributionChartPlaceholder } from '~/components/Toucan/Auction/BidDistributionChart/BidDistributionChartPlaceholder'
import { WithdrawModal } from '~/components/Toucan/Auction/Bids/WithdrawModal/WithdrawModal'
import { useAuctionTokenColor } from '~/components/Toucan/Auction/hooks/useAuctionTokenColor'
import { useBidFormState } from '~/components/Toucan/Auction/hooks/useBidFormState'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { useWithdrawButtonState } from '~/components/Toucan/Auction/hooks/useWithdrawButtonState'
import {
  AuctionDetails,
  AuctionDetailsLoadState,
  AuctionProgressState,
  BidInfoTab,
  BidTokenInfo,
} from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/components/Toucan/Auction/utils/clearingPrice'
import { ToucanActionButton } from '~/components/Toucan/Shared/ToucanActionButton'
import { MobileScreen, MobileScreenConfig } from '~/pages/Explore/ToucanToken'

const PLACEHOLDER_HEIGHT = 400

enum AuctionChartName {
  ClearingPrice = 'ClearingPriceChart',
  BidDistribution = 'BidDistributionChart',
  BidDemand = 'BidDemandChart',
}

const createChartErrorFallback = (chartName: AuctionChartName) => {
  return function ChartErrorFallback({ error }: { error: Error; resetError: () => void }): JSX.Element {
    const { t } = useTranslation()
    const chartNameRef = useRef(chartName)

    useEffect(() => {
      logger.error(error, {
        tags: { file: 'AuctionChartContainer', function: chartNameRef.current },
      })
    }, [error])

    return (
      <Flex maxWidth={780} width="100%" gap="$spacing16" alignItems="center" justifyContent="center" py="$spacing48">
        <BidDistributionChartPlaceholder height={PLACEHOLDER_HEIGHT}>
          {t('toucan.auction.errorLoading')}
        </BidDistributionChartPlaceholder>
      </Flex>
    )
  }
}

const ClearingPriceChartErrorFallback = createChartErrorFallback(AuctionChartName.ClearingPrice)
const BidDistributionChartErrorFallback = createChartErrorFallback(AuctionChartName.BidDistribution)
const BidDemandChartErrorFallback = createChartErrorFallback(AuctionChartName.BidDemand)

const LazyClearingPriceChart = lazy(async () => {
  const module = await import('~/components/Charts/ToucanChart/clearingPrice/ClearingPriceChart')
  return { default: module.ClearingPriceChart }
})

const LazyBidDistributionChart = lazy(async () => {
  const module = await import('~/components/Toucan/Auction/BidDistributionChart/BidDistributionChart')
  return { default: module.BidDistributionChart }
})

interface AuctionChartContainerProps {
  activeTab: BidDistributionChartTab
  onTabChange: (tab: BidDistributionChartTab) => void
  onMobileScreenChange?: (config: MobileScreenConfig) => void
}

/**
 * AuctionChartContainer is the wrapper component for both ClearingPriceChart and BidDistributionChart.
 * It handles:
 * - Shared state from auction store (tokenColor, auctionDetails, userBids, load states, etc.)
 * - Bid token info fetching (shared between both charts)
 * - Loading/error/placeholder states
 * - Tab switching between chart types
 * - Shared footer
 */
export function AuctionChartContainer({ activeTab, onTabChange, onMobileScreenChange }: AuctionChartContainerProps) {
  const { auctionDetails, auctionDetailsLoadState, auctionProgressState, isGraduated, currentBlockNumber } =
    useAuctionStore((state) => ({
      auctionDetails: state.auctionDetails,
      auctionDetailsLoadState: state.auctionDetailsLoadState,
      auctionProgressState: state.progress.state,
      isGraduated: state.progress.isGraduated,
      currentBlockNumber: state.currentBlockNumber,
    }))
  const { effectiveTokenColor } = useAuctionTokenColor()
  const media = useMedia()
  const { t } = useTranslation()
  const [groupingToggleDisabled, setGroupingToggleDisabled] = useState(true)
  const isDarkMode = useIsDarkMode()
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)

  const {
    bidTokenInfo,
    loading: bidTokenLoading,
    error: bidTokenError,
  } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  const { canPlaceBid, showAuctionGraduated, showMyBidsButton, showMobileWithdrawButton } = useBidFormState()

  // Withdraw button state for $lg inline button (not $sm - that uses fixed bottom button)
  const {
    label: withdrawLabel,
    isDisabled: isWithdrawDisabled,
    disabledTooltip: withdrawDisabledTooltip,
  } = useWithdrawButtonState({
    isGraduated,
    claimBlock: auctionDetails?.claimBlock,
    currentBlockNumber,
    chainId: auctionDetails?.chainId,
  })

  const renderPlaceholder = (text: string) => (
    <Flex maxWidth={780} width="100%" gap="$spacing16" alignItems="center" justifyContent="center" py="$spacing48">
      <BidDistributionChartPlaceholder height={PLACEHOLDER_HEIGHT}>{text}</BidDistributionChartPlaceholder>
    </Flex>
  )

  // Handle auction-level error states (before we need bid data)
  if (auctionDetailsLoadState === AuctionDetailsLoadState.NotFound) {
    return renderPlaceholder(t('toucan.auction.notFound'))
  }

  if (auctionDetailsLoadState === AuctionDetailsLoadState.Error) {
    return renderPlaceholder(t('toucan.auction.errorLoading'))
  }

  if (
    auctionDetailsLoadState === AuctionDetailsLoadState.Success &&
    auctionProgressState === AuctionProgressState.NOT_STARTED
  ) {
    return renderPlaceholder(t('toucan.auction.notStarted'))
  }

  if (bidTokenError) {
    return renderPlaceholder(t('toucan.auction.errorLoading'))
  }

  const isLoadingSharedDeps =
    auctionDetailsLoadState !== AuctionDetailsLoadState.Success || bidTokenLoading || !auctionDetails || !bidTokenInfo

  if (isLoadingSharedDeps) {
    return renderPlaceholder(t('common.loading'))
  }

  return (
    <>
      <BidDistributionChartHeader activeTab={activeTab} onTabChange={onTabChange} />
      {activeTab === BidDistributionChartTab.ClearingPrice && (
        <ErrorBoundary fallback={ClearingPriceChartErrorFallback}>
          <Suspense fallback={renderPlaceholder(t('common.loading'))}>
            <ClearingPriceChartPanel
              key={`clearing-price-${isDarkMode}`}
              auctionDetails={auctionDetails}
              bidTokenInfo={bidTokenInfo}
              tokenColor={effectiveTokenColor}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {activeTab === BidDistributionChartTab.Distribution && (
        <ErrorBoundary fallback={BidDistributionChartErrorFallback}>
          <Suspense fallback={renderPlaceholder(t('common.loading'))}>
            <BidDistributionChartPanel
              key={`distribution-${isDarkMode}`}
              auctionDetails={auctionDetails}
              bidTokenInfo={bidTokenInfo}
              tokenColor={effectiveTokenColor}
              onGroupingToggleDisabledChange={setGroupingToggleDisabled}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {activeTab === BidDistributionChartTab.Demand && (
        <ErrorBoundary fallback={BidDemandChartErrorFallback}>
          <Suspense fallback={renderPlaceholder(t('common.loading'))}>
            <BidDemandChartPanel
              key={`demand-${isDarkMode}`}
              auctionDetails={auctionDetails}
              bidTokenInfo={bidTokenInfo}
              tokenColor={effectiveTokenColor}
            />
          </Suspense>
        </ErrorBoundary>
      )}
      {/* ChartFooter is shared across all chart tabs */}
      <ChartFooter activeTab={activeTab} groupingToggleDisabled={groupingToggleDisabled} />
      {/* Mobile action buttons - only visible on $lg screens */}
      <Flex
        display="none"
        $lg={{ display: 'flex', mt: '$none' }}
        $sm={{ mt: '$spacing8' }}
        gap="$spacing12"
        mt="$spacing16"
      >
        {showMyBidsButton && (
          <Button
            flex={1}
            emphasis="secondary"
            onPress={() =>
              onMobileScreenChange?.({
                screen: MobileScreen.BID_FORM,
                bidFormTab: showAuctionGraduated ? BidInfoTab.AUCTION_GRADUATED : BidInfoTab.MY_BIDS,
              })
            }
          >
            {t('toucan.auction.myBids')}
          </Button>
        )}
        {/* Show Place Bid button during auction ($lg but not $sm) */}
        {!media.sm && canPlaceBid && (
          <ToucanActionButton
            label={t('toucan.bidForm.placeABid')}
            onPress={() =>
              onMobileScreenChange?.({
                screen: MobileScreen.BID_FORM,
                bidFormTab: BidInfoTab.PLACE_A_BID,
              })
            }
          />
        )}
        {/* Show Withdraw button after auction ($lg but not $sm - $sm uses fixed bottom button) */}
        {!media.sm && showMobileWithdrawButton && (
          <ToucanActionButton
            elementName={ElementName.AuctionWithdrawTokensButton}
            label={withdrawLabel}
            onPress={() => setIsWithdrawModalOpen(true)}
            isDisabled={isWithdrawDisabled}
            disabledTooltip={isWithdrawDisabled ? withdrawDisabledTooltip : undefined}
          />
        )}
      </Flex>
      {/* Withdraw modal for $lg inline button */}
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
    </>
  )
}

function ClearingPriceChartPanel({
  auctionDetails,
  bidTokenInfo,
  tokenColor,
}: {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  tokenColor?: string
}): JSX.Element {
  const { currentBlockNumber, checkpointData } = useAuctionStore((state) => ({
    currentBlockNumber: state.currentBlockNumber,
    checkpointData: state.checkpointData,
  }))

  const latestClearingPriceQ96 = getClearingPrice(checkpointData, auctionDetails)

  return (
    <LazyClearingPriceChart
      auctionDetails={auctionDetails}
      bidTokenInfo={bidTokenInfo}
      currentBlockNumber={currentBlockNumber}
      latestClearingPriceQ96={latestClearingPriceQ96}
      tokenColor={tokenColor}
    />
  )
}

function BidDistributionChartPanel({
  auctionDetails,
  bidTokenInfo,
  tokenColor,
  onGroupingToggleDisabledChange,
}: {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  tokenColor?: string
  onGroupingToggleDisabledChange: (disabled: boolean) => void
}): JSX.Element {
  const userBids = useAuctionStore((state) => state.userBids)

  return (
    <LazyBidDistributionChart
      auctionDetails={auctionDetails}
      bidTokenInfo={bidTokenInfo}
      tokenColor={tokenColor}
      userBids={userBids}
      onGroupingToggleDisabledChange={onGroupingToggleDisabledChange}
    />
  )
}

function BidDemandChartPanel({
  auctionDetails,
  bidTokenInfo,
  tokenColor,
}: {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  tokenColor?: string
}): JSX.Element {
  const userBids = useAuctionStore((state) => state.userBids)

  return (
    <LazyBidDistributionChart
      auctionDetails={auctionDetails}
      bidTokenInfo={bidTokenInfo}
      tokenColor={tokenColor}
      userBids={userBids}
      chartMode="demand"
    />
  )
}
