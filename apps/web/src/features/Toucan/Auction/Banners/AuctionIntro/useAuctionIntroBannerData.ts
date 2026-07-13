import { TFunction } from 'i18next'
import { CSSProperties, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { opacifyRaw } from 'ui/src/theme'
import { useActiveAddress } from 'uniswap/src/features/accounts/store/hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAuctionKycStatus } from '~/features/Toucan/Auction/hooks/useAuctionKycStatus'
import { useAuctionTokenColor } from '~/features/Toucan/Auction/hooks/useAuctionTokenColor'
import { useDurationRemaining } from '~/features/Toucan/Auction/hooks/useDurationRemaining'
import { AuctionDetails, AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'

type AuctionIntroBannerVariant = 'not-started' | 'in-progress'

function getAuctionBannerConfig({
  isPreBidPeriod,
  isNotStarted,
  isAllowlistOnlyWindow,
  allowlistEndBlock,
  auctionDetails,
  t,
}: {
  isPreBidPeriod: boolean
  isNotStarted: boolean
  isAllowlistOnlyWindow: boolean
  allowlistEndBlock?: number
  auctionDetails: AuctionDetails | null
  t: TFunction
}): {
  variant: AuctionIntroBannerVariant
  targetBlock: string | bigint | number | undefined
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

  if (isAllowlistOnlyWindow) {
    return {
      variant: 'in-progress',
      targetBlock: allowlistEndBlock,
      durationLabel: t('toucan.auction.introBanner.generalSaleStartsIn'),
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
  backgroundGradientStyle: CSSProperties
  /** True when token color is still loading or not yet available */
  isColorLoading: boolean
}

export function useAuctionIntroBannerData(): UseAuctionIntroBannerDataResult {
  const { t } = useTranslation()

  const { auctionDetails, progressState, currentBlockNumber } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
    progressState: state.progress.state,
    currentBlockNumber: state.currentBlockNumber,
  }))

  const colors = useSporeColors()
  const { tokenColorLoading, effectiveTokenColor } = useAuctionTokenColor()
  const logoUrl = auctionDetails?.token?.logoUrl

  // Lock the first valid token color to prevent style recalculation flicker
  // Once we have a real extracted color, we never update it (prevents gradient flash)
  const lockedTokenColorRef = useRef<string | null>(null)

  // Reset locked color when logoUrl changes (e.g., navigating to a different auction)
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

  const activeAddress = useActiveAddress((auctionDetails?.chainId ?? UniverseChainId.Mainnet) as UniverseChainId)
  const { auctionHasPresale, allowlistEndBlock, isAllowlisted } = useAuctionKycStatus({
    walletAddress: activeAddress,
    auctionAddress: auctionDetails?.address,
    chainId: auctionDetails?.chainId,
    currentBlockNumber,
  })

  const startBlockNumber = auctionDetails?.startBlock ? Number(auctionDetails.startBlock) : undefined
  const preBidEndBlockNumber = auctionDetails?.preBidEndBlock ? Number(auctionDetails.preBidEndBlock) : undefined
  const isPreBidPeriod =
    currentBlockNumber !== undefined &&
    startBlockNumber !== undefined &&
    preBidEndBlockNumber !== undefined &&
    currentBlockNumber > startBlockNumber &&
    currentBlockNumber < preBidEndBlockNumber

  // Auction is live and emitting but bidding is still restricted to allowlisted wallets
  const isAllowlistOnlyWindow =
    isInProgress &&
    auctionHasPresale &&
    !isAllowlisted &&
    allowlistEndBlock !== undefined &&
    currentBlockNumber !== undefined &&
    currentBlockNumber < allowlistEndBlock

  // Determine the variant, target block, and duration label based on progress state
  const { variant, targetBlock, durationLabel } = getAuctionBannerConfig({
    isPreBidPeriod,
    isNotStarted,
    isAllowlistOnlyWindow,
    allowlistEndBlock,
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

  // Background: dark base with a subtle token-colored gradient from the right
  const backgroundGradientStyle: CSSProperties = useMemo(
    () => ({
      backgroundImage: `linear-gradient(270deg, ${opacifyRaw(24, tokenAccentColor)} 0%, ${opacifyRaw(0, tokenAccentColor)} 100%), linear-gradient(90deg, ${colors.surface1.val} 0%, ${colors.surface1.val} 100%)`,
    }),
    [tokenAccentColor, colors.surface1.val],
  )

  return {
    shouldShowBanner,
    variant,
    durationRemaining,
    durationLabel,
    tokenAccentColor,
    backgroundGradientStyle,
    isColorLoading,
  }
}
