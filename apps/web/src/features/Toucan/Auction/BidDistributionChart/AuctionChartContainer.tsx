import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useIsDarkMode, useMedia } from 'ui/src'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { ErrorBoundary } from '~/components/ErrorBoundary'
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
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { ToucanActionButton } from '~/features/Toucan/Shared/ToucanActionButton'

const PLACEHOLDER_HEIGHT = 400

enum AuctionChartName {
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

const BidDemandChartErrorFallback = createChartErrorFallback(AuctionChartName.BidDemand)
const CombinedChartErrorFallback = createChartErrorFallback(AuctionChartName.Combined)

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
 * AuctionChartContainer is the wrapper component for the auction charts.
 * It handles:
 * - Shared state from auction store (tokenColor, auctionDetails, userBids, load states, etc.)
 * - Bid token info fetching (shared between charts)
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

  const auctionTokenDecimals = getAuctionTokenDecimals(auctionDetails?.token)

  const isLoadingSharedDeps =
    auctionDetailsLoadState !== AuctionDetailsLoadState.Success ||
    bidTokenLoading ||
    !auctionDetails ||
    !bidTokenInfo ||
    auctionTokenDecimals === undefined

  if (isLoadingSharedDeps) {
    return renderPlaceholder(t('common.loading'))
  }

  return (
    <Flex flexDirection="column">
      <BidDistributionChartHeader activeTab={activeTab} onTabChange={onTabChange} />
      <Flex flexDirection="column" gap="$spacing16">
        {activeTab === BidDistributionChartTab.Demand ? (
          <ErrorBoundary fallback={BidDemandChartErrorFallback}>
            <Suspense fallback={renderPlaceholder(t('common.loading'))}>
              <BidDemandChartPanel
                key={`demand-${isDarkMode}`}
                auctionDetails={auctionDetails}
                bidTokenInfo={bidTokenInfo}
                auctionTokenDecimals={auctionTokenDecimals}
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
                auctionTokenDecimals={auctionTokenDecimals}
                tokenColor={effectiveTokenColor}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        <ChartFooter activeTab={activeTab} onLearnMorePress={onLearnMorePress} />
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

function BidDemandChartPanel({
  auctionDetails,
  bidTokenInfo,
  auctionTokenDecimals,
  tokenColor,
}: {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  auctionTokenDecimals: number
  tokenColor?: string
}): JSX.Element {
  const userBids = useAuctionStore((state) => state.userBids)

  return (
    <LazyBidDistributionChart
      auctionDetails={auctionDetails}
      bidTokenInfo={bidTokenInfo}
      auctionTokenDecimals={auctionTokenDecimals}
      tokenColor={tokenColor}
      userBids={userBids}
      chartMode="demand"
    />
  )
}

function CombinedAuctionChartPanel({
  auctionDetails,
  bidTokenInfo,
  auctionTokenDecimals,
  tokenColor,
}: {
  auctionDetails: AuctionDetails
  bidTokenInfo: BidTokenInfo
  auctionTokenDecimals: number
  tokenColor?: string
}): JSX.Element {
  return (
    <LazyCombinedAuctionChart
      auctionDetails={auctionDetails}
      bidTokenInfo={bidTokenInfo}
      auctionTokenDecimals={auctionTokenDecimals}
      tokenColor={tokenColor}
    />
  )
}
