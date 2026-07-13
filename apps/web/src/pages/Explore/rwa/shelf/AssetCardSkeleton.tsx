import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { EXPLORE_STOCK_SHELF_COUNT } from 'uniswap/src/data/rest/rwa/useExploreStocks'
import { LoadingBubble } from '~/components/Tokens/loading'
import {
  ASSET_CARD_SPARKLINE_HEIGHT,
  ASSET_CARD_SPARKLINE_WIDTH,
  assetCardShellProps,
} from '~/pages/Explore/rwa/shelf/assetCardConstants'

export function AssetCardSkeleton({ index, cardWidth }: { index: number; cardWidth: number }): JSX.Element {
  const delay = `${index * 0.1}s`

  return (
    <Flex {...assetCardShellProps} width={cardWidth}>
      <Flex row alignItems="center" justifyContent="space-between" width="100%">
        <LoadingBubble
          round
          height={iconSizes.icon32}
          width={iconSizes.icon32}
          delay={delay}
          containerProps={{ width: iconSizes.icon32, height: iconSizes.icon32, flexShrink: 0 }}
        />
        <LoadingBubble
          height={ASSET_CARD_SPARKLINE_HEIGHT}
          width={ASSET_CARD_SPARKLINE_WIDTH}
          delay={delay}
          containerProps={{ width: ASSET_CARD_SPARKLINE_WIDTH, flexShrink: 0 }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
      </Flex>
      <Flex gap="$spacing4" width="100%">
        <LoadingBubble
          height={18}
          width="70%"
          delay={delay}
          containerProps={{ width: '100%' }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
        <LoadingBubble
          height={16}
          width="50%"
          delay={delay}
          containerProps={{ width: '100%' }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
      </Flex>
    </Flex>
  )
}

export function AssetCardSkeletonRow({ cardWidth }: { cardWidth: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: EXPLORE_STOCK_SHELF_COUNT }, (_, index) => (
        <AssetCardSkeleton key={index} index={index} cardWidth={cardWidth} />
      ))}
    </>
  )
}
