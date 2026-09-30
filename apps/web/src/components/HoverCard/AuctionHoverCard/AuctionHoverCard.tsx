import { SharedEventName } from '@uniswap/analytics-events'
import type { ReactNode } from 'react'
import { useCallback, useMemo } from 'react'
import type { AuctionOption } from 'uniswap/src/components/lists/items/types'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { AuctionHoverCardContent } from '~/components/HoverCard/AuctionHoverCard/AuctionHoverCardContent'
import { useAuctionHoverCardData } from '~/components/HoverCard/AuctionHoverCard/useAuctionHoverCardData'
import {
  HoverCard,
  type HoverCardPlacement,
  useHoverCardMaxContentWidth,
  useHoverCardState,
} from '~/components/HoverCard/HoverCard'
import { useFireOncePerOpen } from '~/components/HoverCard/useFireOncePerOpen'
import { useHoverCardCopyAndClose } from '~/components/HoverCard/useHoverCardCopyAndClose'
import { useNavigateToAuctionDetails } from '~/hooks/useNavigateToAuctionDetails'

export type AuctionHoverCardAuction = Pick<
  AuctionOption,
  | 'chainId'
  | 'auctionAddress'
  | 'tokenAddress'
  | 'tokenSymbol'
  | 'tokenName'
  | 'tokenLogoUrl'
  | 'committedVolumeUsd'
  | 'uniqueBidderCount'
>

interface AuctionHoverCardProps {
  auction: AuctionHoverCardAuction
  children: ReactNode
  placement?: HoverCardPlacement
  offset?: number
  widthOffset?: number
  containerWidth?: number
  onNavigate?: () => void
  /** The child already shrinks on press; opts the trigger's own shrink out so the two don't compound. */
  childOwnsPressFeedback?: boolean
}

export function AuctionHoverCard({
  auction,
  children,
  placement = 'bottom-start',
  offset,
  widthOffset = offset,
  containerWidth,
  onNavigate,
  childOwnsPressFeedback,
}: AuctionHoverCardProps): JSX.Element {
  const { chainId, auctionAddress, tokenAddress, tokenSymbol, tokenName, tokenLogoUrl, uniqueBidderCount } = auction
  const { isOpen, hasOpenIntent, close, onOpenChange } = useHoverCardState()
  const navigateToAuctionDetails = useNavigateToAuctionDetails()
  const trace = useTrace()
  const { isCopied, copyAndClose } = useHoverCardCopyAndClose({ onClose: close })

  const data = useAuctionHoverCardData({
    chainId,
    auctionAddress,
    tokenAddress,
    enabled: hasOpenIntent,
    fetchBidCount: uniqueBidderCount === undefined,
  })

  const analyticsProperties = useMemo(
    () => ({
      ...trace,
      token_symbol: tokenSymbol,
      chain_id: chainId,
      auction_address: auctionAddress,
      token_address: tokenAddress,
    }),
    [trace, tokenSymbol, chainId, auctionAddress, tokenAddress],
  )

  // Fires at open (isOpen already reflects the hover delay); the data event waits for the deferred fetches.
  useFireOncePerOpen({
    isOpen,
    fire: () => sendAnalyticsEvent(InterfaceEventName.AuctionHoverCardOpened, analyticsProperties),
  })
  useFireOncePerOpen({
    isOpen,
    ready: !data.loading,
    fire: () => sendAnalyticsEvent(InterfaceEventName.AuctionHoverCardDataLoaded, analyticsProperties),
  })

  const handleCopy = useCallback((): void => {
    copyAndClose(tokenAddress)
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...analyticsProperties,
      element: ElementName.AuctionHoverCardCopyAddress,
    })
  }, [copyAndClose, tokenAddress, analyticsProperties])

  const handleExpand = useCallback((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...analyticsProperties,
      element: ElementName.AuctionHoverCardExpand,
    })
    onNavigate?.()
    navigateToAuctionDetails({ auctionAddress, chainId })
  }, [analyticsProperties, auctionAddress, chainId, onNavigate, navigateToAuctionDetails])

  const maxContentWidth = useHoverCardMaxContentWidth({ containerWidth, widthOffset })

  return (
    <HoverCard
      isOpen={isOpen}
      placement={placement}
      offset={offset}
      childOwnsPressFeedback={childOwnsPressFeedback}
      onOpenChange={onOpenChange}
      content={
        <AuctionHoverCardContent
          chainId={chainId}
          tokenAddress={tokenAddress}
          tokenSymbol={tokenSymbol}
          tokenName={tokenName}
          tokenLogoUrl={tokenLogoUrl}
          fdvUsd={data.fdvUsd}
          pricePercentChange={data.pricePercentChange}
          priceData={data.priceData}
          committedVolumeUsd={data.committedVolumeUsd ?? auction.committedVolumeUsd}
          bidderCount={uniqueBidderCount}
          bidCount={data.bidCount}
          loading={data.loading}
          isCopied={isCopied}
          onCopy={tokenAddress ? handleCopy : undefined}
          onExpand={handleExpand}
          maxWidth={maxContentWidth}
        />
      }
    >
      {children}
    </HoverCard>
  )
}
