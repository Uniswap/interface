import { memo, useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { getBadgeBorderRadius, getBadgeOuterSize } from 'uniswap/src/components/CurrencyLogo/badgeSizeUtils'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getNetworkIconListDisplay } from 'uniswap/src/components/network/NetworkIconList/getNetworkIconListDisplay'
import { OverlapIconWrapper } from 'uniswap/src/components/network/NetworkIconList/OverlapIconWrapper'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/** Extra size around the icon; clipped by the container so the ring is transparent and matches any background. */
const RING_RATIO = 1.2
const DEFAULT_OVERLAP_RATIO = 0.3

const CLIP_BORDER_RADIUS_RATIO = 0.42

/** Optical vertical adjustment so the overflow digit sits centered in the pill. */
const OVERFLOW_COUNT_TEXT_NUDGE_Y = 0.75

interface NetworkIconListProps {
  chainIds: UniverseChainId[]
  size?: number
  iconOverlap?: number
  showNumberBadge?: boolean
}

export const NetworkIconList = memo(function NetworkIconList({
  chainIds,
  size = iconSizes.icon12,
  iconOverlap = DEFAULT_OVERLAP_RATIO,
  showNumberBadge,
}: NetworkIconListProps): JSX.Element | null {
  const { chains: enabledChainIds } = useEnabledChains()
  const { visibleChainIds, overflowCount } = useMemo(
    () => getNetworkIconListDisplay(chainIds, enabledChainIds),
    [chainIds, enabledChainIds],
  )

  if (visibleChainIds.length === 0 && overflowCount === 0) {
    return null
  }

  const outerSize = size * RING_RATIO
  const overlapPx = outerSize * iconOverlap
  const clipBorderRadius = outerSize * CLIP_BORDER_RADIUS_RATIO
  /** Matches {@link NetworkLogo} default (borderWidth 0, square squircle). */
  const logoOuterSize = getBadgeOuterSize(size, 0)
  const logoBorderRadius = getBadgeBorderRadius(logoOuterSize, 'square')
  const stackedMarginLeft = (index: number): number => (index > 0 ? -overlapPx : 0)
  const slotCount = visibleChainIds.length + (showNumberBadge && overflowCount > 0 ? 1 : 0)
  const zIndexForSlot = (slotIndex: number): number => slotCount - slotIndex

  return (
    <Flex alignItems="center" flexDirection="row">
      {visibleChainIds.map((chainId, index) => {
        const showOverlapClip = index > 0

        const iconContent = (
          <Flex centered width={outerSize} height={outerSize}>
            <NetworkLogo key={`${chainId}-${index}`} chainId={chainId} size={size} />
          </Flex>
        )

        return (
          <Flex
            key={`${chainId}-${index}`}
            centered
            backgroundColor="$transparent"
            ml={stackedMarginLeft(index)}
            overflow="hidden"
            width={outerSize}
            height={outerSize}
            borderRadius={clipBorderRadius}
            zIndex={zIndexForSlot(index)}
          >
            {showOverlapClip ? (
              <OverlapIconWrapper outerSize={outerSize} overlapPx={overlapPx} clipBorderRadius={clipBorderRadius}>
                {iconContent}
              </OverlapIconWrapper>
            ) : (
              iconContent
            )}
          </Flex>
        )
      })}
      {showNumberBadge && overflowCount > 0 ? (
        <Flex
          key="overflow-count-badge"
          centered
          testID="network-icon-list-overflow-badge"
          backgroundColor="$transparent"
          ml={stackedMarginLeft(visibleChainIds.length)}
          overflow="hidden"
          width={outerSize}
          height={outerSize}
          borderRadius={clipBorderRadius}
          zIndex={zIndexForSlot(visibleChainIds.length)}
        >
          <Flex centered width={outerSize} height={outerSize}>
            <Flex
              centered
              backgroundColor="$surface3"
              borderRadius={logoBorderRadius}
              height={logoOuterSize}
              width={logoOuterSize}
            >
              <Text
                allowFontScaling={false}
                variant="buttonLabel4"
                color="$neutral2"
                $platform-native={{
                  transform: [{ translateY: OVERFLOW_COUNT_TEXT_NUDGE_Y }],
                  includeFontPadding: false,
                }}
                textAlign="center"
              >
                {overflowCount}
              </Text>
            </Flex>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
})
