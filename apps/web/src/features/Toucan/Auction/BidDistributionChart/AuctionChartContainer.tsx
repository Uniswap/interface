import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useIsDarkMode, useMedia } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import ErrorBoundary from '~/components/ErrorBoundary'
import { BidDistributionChartTab } from '~/features/Toucan/Auction/AuctionChartShared'
import { ChartFooter } from '~/features/Toucan/Auction/BidDistributionChart/BidDistributionChartFooter'
import { BidDistributionChartHeader } from '~/features/Toucan/Auction/BidDistributionChart/BidDistributionChartHeader'
import { BidDistributionChartPlaceholder } from '~/features/Toucan/Auction/BidDistributionChart/BidDistributionChartPlaceholder'
import { WithdrawModal } from '~/features/Toucan/Auction/Bids/WithdrawModal/WithdrawModal'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { useBidFormState } from '~/features/Toucan/Auction/hooks/useBidFormState'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useWithdrawButtonState } from '~/features/Toucan/Auction/hooks/useWithdrawButtonState'
import {
  AuctionDetails,
  AuctionDetailsLoadState,
  AuctionProgressState,
  BidTokenInfo,
} from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getClearingPrice } from '~/features/Toucan/Auction/utils/clearingPrice'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

const PLACEHOLDER_HEIGHT = 400

enum AuctionChartName {
  ClearingPrice = 'ClearingPriceChart',
  BidDistribution = 'BidDistributionChart',
  BidDemand = 'BidDemandChart',
  Combined = 'CombinedAuctionChart',
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
const CombinedChartErrorFallback = createChartErrorFallback(AuctionChartName.Combined)

const LazyClearingPriceChart = lazy(async () => {
  const module = await import('~/features/Toucan/ToucanChart/clearingPrice/ClearingPriceChart')
  return { default: module.ClearingPriceChart }
})

const LazyBidDistributionChart = lazy(async () => {
  const module = await import('~/features/Toucan/Auction/BidDistributionChart/BidDistributionChart')
  return { default: module.BidDistributionChart }
})

const LazyCombinedAuctionChart = lazy(async () => {
  const module = await import('~/features/Toucan/Auction/BidDistributionChart/CombinedAuctionChart')
  return { default: module.CombinedAuctionChart }
})

interface AuctionChartContainerProps {
  activeTab: BidDistributionChartTab
  onTabChange: (tab: BidDistributionChartTab) => void
  onShowBidFormModal?: () => void
  onLearnMorePress?: () => void
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
export function AuctionChartContainer({
  activeTab,
  onTabChange,
  onShowBidFormModal,
  onLearnMorePress,
}: AuctionChartContainerProps) {
  const isV2 = useFeatureFlag(FeatureFlags.AuctionDetailsV2)
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

  const { canPlaceBid, showMobileWithdrawButton } = useBidFormState()

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

  // V2: Combined price + distribution chart
  if (isV2) {
    return (
      <Flex flexDirection="column">
        <BidDistributionChartHeader activeTab={activeTab} onTabChange={onTabChange} combinedMode />
        <Flex flexDirection="column" gap="$spacing16">
          {activeTab === BidDistributionChartTab.Demand ? (
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
          ) : (
            <ErrorBoundary fallback={CombinedChartErrorFallback}>
              <Suspense fallback={renderPlaceholder(t('common.loading'))}>
                <CombinedAuctionChartPanel
                  key={`combined-${isDarkMode}`}
                  auctionDetails={auctionDetails}
                  bidTokenInfo={bidTokenInfo}
                  tokenColor={effectiveTokenColor}
                />
              </Suspense>
            </ErrorBoundary>
          )}
          <ChartFooter
            activeTab={activeTab}
            groupingToggleDisabled={groupingToggleDisabled}
            onLearnMorePress={onLearnMorePress}
            combinedMode
          />
          {/* Mobile action buttons - visible when layout stacks ($xl) */}
          <Flex
            display="none"
            $xl={{ display: 'flex', mt: '$none' }}
            $sm={{ mt: '$spacing8' }}
            gap="$spacing12"
            mt="$spacing16"
          >
            {!media.sm && canPlaceBid && (
              <ToucanActionButton label={t('toucan.bidForm.placeABid')} onPress={() => onShowBidFormModal?.()} />
            )}
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
        </Flex>
        <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
      </Flex>
    )
  }

  return (
    <Flex flexDirection="column">
      <BidDistributionChartHeader activeTab={activeTab} onTabChange={onTabChange} />
      <Flex flexDirection="column" gap="$spacing16">
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
        {/* Mobile action buttons - visible when layout stacks ($xl) */}
        <Flex
          display="none"
          $xl={{ display: 'flex', mt: '$none' }}
          $sm={{ mt: '$spacing8' }}
          gap="$spacing12"
          mt="$spacing16"
        >
          {/* Show Place Bid button during auction ($xl but not $sm) */}
          {!media.sm && canPlaceBid && (
            <ToucanActionButton label={t('toucan.bidForm.placeABid')} onPress={() => onShowBidFormModal?.()} />
          )}
          {/* Show Withdraw button after auction ($xl but not $sm - $sm uses fixed bottom button) */}
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
      </Flex>
      {/* Withdraw modal for $lg inline button */}
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} />
    </Flex>
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

function CombinedAuctionChartPanel({
  auctionDetails,
  bidTokenInfo,
  tokenColor,
}: {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  tokenColor?: string
}): JSX.Element {
  return (
    <LazyCombinedAuctionChart auctionDetails={auctionDetails} bidTokenInfo={bidTokenInfo} tokenColor={tokenColor} />
  )
}
