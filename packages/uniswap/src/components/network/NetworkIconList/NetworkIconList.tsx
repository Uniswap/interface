import { memo, useMemo } from 'react'
import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { getDisplayChainIds } from 'uniswap/src/components/network/NetworkIconList/getDisplayChainIds'
import { OverlapIconWrapper } from 'uniswap/src/components/network/NetworkIconList/OverlapIconWrapper'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/** Extra size around the icon; clipped by the container so the ring is transparent and matches any background. */
const RING_RATIO = 1.2
const DEFAULT_OVERLAP_RATIO = 0.3

const CLIP_BORDER_RADIUS_RATIO = 0.42

interface NetworkIconListProps {
  chainIds: UniverseChainId[]
  size?: number
  /** Horizontal overlap when stacked, as a ratio of outer size (e.g. 0.4 = 40%) */
  iconOverlap?: number
}

export const NetworkIconList = memo(function NetworkIconList({
  chainIds,
  size = iconSizes.icon12,
  iconOverlap = DEFAULT_OVERLAP_RATIO,
}: NetworkIconListProps): JSX.Element | null {
  const { chains: enabledChainIds } = useEnabledChains()
  const displayChainIds = useMemo(() => getDisplayChainIds(chainIds, enabledChainIds), [chainIds, enabledChainIds])

  if (displayChainIds.length === 0) {
    return null
  }

  const outerSize = size * RING_RATIO
  const overlapPx = outerSize * iconOverlap
  const clipBorderRadius = outerSize * CLIP_BORDER_RADIUS_RATIO
  const stackedMarginLeft = (index: number): number => (index > 0 ? -overlapPx : 0)

  return (
    <Flex alignItems="center" flexDirection="row">
      {displayChainIds.map((chainId, index) => {
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
            zIndex={displayChainIds.length - index}
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
    </Flex>
  )
})
