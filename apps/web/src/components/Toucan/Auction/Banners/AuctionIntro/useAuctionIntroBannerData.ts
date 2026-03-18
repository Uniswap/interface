import { TFunction } from 'i18next'
import { CSSProperties, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { useAuctionTokenColor } from '~/components/Toucan/Auction/hooks/useAuctionTokenColor'
import { useDurationRemaining } from '~/components/Toucan/Auction/hooks/useDurationRemaining'
import { AuctionDetails, AuctionProgressState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { createDottedBackgroundStyles } from '~/components/Toucan/utils/createDottedBackgroundStyles'

type AuctionIntroBannerVariant = 'not-started' | 'in-progress'

const DOT_OPACITY_NOT_STARTED = 8
const DOT_OPACITY_IN_PROGRESS = 10

function getAuctionBannerConfig({
  isPreBidPeriod,
  isNotStarted,
  auctionDetails,
  t,
}: {
  isPreBidPeriod: boolean
  isNotStarted: boolean
  auctionDetails: AuctionDetails | null
  t: TFunction
}): {
  variant: AuctionIntroBannerVariant
  targetBlock: string | bigint | undefined
  durationLabel: string
} {
  if (isPreBidPeriod) {
    return {
      variant: 'in-progress',
      targetBlock: auctionDetails?.preBidEndBlock,
      durationLabel: t('toucan.auction.introBanner.preBiddingEndsIn'),
    }
  }

  if (isNotStarted) {
    return {
      variant: 'not-started',
      targetBlock: auctionDetails?.startBlock,
      durationLabel: t('toucan.auction.introBanner.auctionStartsIn'),
    }
  }

  return {
    variant: 'in-progress',
    targetBlock: auctionDetails?.endBlock,
    durationLabel: t('toucan.auction.introBanner.auctionEndsIn'),
  }
}

interface UseAuctionIntroBannerDataResult {
  shouldShowBanner: boolean
  variant: AuctionIntroBannerVariant
  durationRemaining: string | undefined
  durationLabel: string
  /** Token accent color - used for indicator dot */
  tokenAccentColor: string
  dottedBackgroundStyle: CSSProperties
  radialGradientStyle: CSSProperties | undefined
  backgroundColor: string
  /** True when token color is still loading or not yet available */
  isColorLoading: boolean
}

export function useAuctionIntroBannerData(): UseAuctionIntroBannerDataResult {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const { auctionDetails, progressState, currentBlockNumber } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    progressState: state.progress.state,
    currentBlockNumber: state.currentBlockNumber,
  }))

  const { tokenColorLoading, effectiveTokenColor } = useAuctionTokenColor()
  const logoUrl = auctionDetails?.token?.logoUrl

  // Lock the first valid token color to prevent style recalculation flicker
  // Once we have a real extracted color, we never update it (prevents gradient flash)
  const lockedTokenColorRef = useRef<string | null>(null)

  // Reset locked color when logoUrl changes (e.g., navigating to a different auction)
  // biome-ignore lint/correctness/useExhaustiveDependencies: logoUrl is intentionally a dependency to trigger reset on token change
  useEffect(() => {
    lockedTokenColorRef.current = null
  }, [logoUrl])

  // Lock the token color once loading completes (must be in useEffect to avoid ref mutation during render)
  // Use effectiveTokenColor which always has a value (extracted color or neutral3 fallback)
  useEffect(() => {
    if (!tokenColorLoading) {
      lockedTokenColorRef.current = effectiveTokenColor
    }
  }, [tokenColorLoading, effectiveTokenColor])

  // Use locked color for styles (fallback to effectiveTokenColor while loading)
  const tokenAccentColor = lockedTokenColorRef.current ?? effectiveTokenColor

  // isColorLoading: true until we have a locked color
  const isColorLoading = lockedTokenColorRef.current === null

  const isNotStarted = progressState === AuctionProgressState.NOT_STARTED
  const isInProgress = progressState === AuctionProgressState.IN_PROGRESS

  const startBlockNumber = auctionDetails?.startBlock ? Number(auctionDetails.startBlock) : undefined
  const preBidEndBlockNumber = auctionDetails?.preBidEndBlock ? Number(auctionDetails.preBidEndBlock) : undefined
  const isPreBidPeriod =
    currentBlockNumber !== undefined &&
    startBlockNumber !== undefined &&
    preBidEndBlockNumber !== undefined &&
    currentBlockNumber > startBlockNumber &&
    currentBlockNumber < preBidEndBlockNumber

  // Determine the variant, target block, and duration label based on progress state
  const { variant, targetBlock, durationLabel } = getAuctionBannerConfig({
    isPreBidPeriod,
    isNotStarted,
    auctionDetails,
    t,
  })

  const durationRemaining = useDurationRemaining(auctionDetails?.chainId, Number(targetBlock))

  // Show banner when auction is either not started or in progress
  // Only show banner once we have ALL data needed to compute accurate progress state:
  // 1. currentBlockNumber - from RPC/wagmi (must be a positive number)
  // 2. startBlock - from auction API
  // 3. endBlock - from auction API
  const hasAllRequiredData =
    !!currentBlockNumber && !!auctionDetails && !!auctionDetails.startBlock && !!auctionDetails.endBlock
  const shouldShowBanner = hasAllRequiredData && (isNotStarted || isInProgress)

  // Background color: surface3Solid for not-started (solid gray), surface1 for in-progress
  // Note: surface3 is semi-transparent rgba, surface3Solid is a solid color
  const backgroundColor = isNotStarted ? '$surface3Solid' : '$surface1'

  // Dotted background pattern
  // For not-started: use white dots at very low opacity on the gray background
  // For in-progress: use token color dots (which get softened by radial gradient overlay)
  const { dottedBackgroundStyle, radialGradientStyle } = useMemo(() => {
    const dotColor = isNotStarted ? colors.white.val : tokenAccentColor
    const dotOpacity = isNotStarted ? DOT_OPACITY_NOT_STARTED : DOT_OPACITY_IN_PROGRESS

    return createDottedBackgroundStyles({
      dotColor,
      dotOpacity,
      gradientOpacities: isNotStarted ? { center: 8, mid: 4 } : { center: 45, mid: 25 },
    })
  }, [isNotStarted, colors.white.val, tokenAccentColor])

  return {
    shouldShowBanner,
    variant,
    durationRemaining,
    durationLabel,
    tokenAccentColor,
    dottedBackgroundStyle,
    radialGradientStyle,
    backgroundColor,
    isColorLoading,
  }
}
