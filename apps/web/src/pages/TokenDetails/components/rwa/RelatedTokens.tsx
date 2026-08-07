import { FeatureFlags } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import {
  EXPLORE_STOCK_SHELF_COUNT,
  useExploreStocks,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreStocks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CAROUSEL_FADE_WIDTH } from '~/components/TokenCardCarousel/constants'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { getShelfItemKey, ShelfTokenCard } from '~/pages/Explore/rwa/shelf/ShelfTokenCard'
import { useRWATokenDetailsMatch } from '~/pages/TokenDetails/hooks/useRWATokenDetailsMatch'

const RELATED_TOKENS_CARD_WIDTH = 176

/** Related stocks shelf on the RWA TDP, reusing the token card carousel (gated by `FeatureFlags.RWATdpRelatedTokens`). */
export function RelatedTokens(): JSX.Element | null {
  const { t } = useTranslation()
  const rwaMatch = useRWATokenDetailsMatch(FeatureFlags.RWATdpRelatedTokens)

  const { featured, isLoading } = useExploreStocks([], {
    enabled: Boolean(rwaMatch),
    excludeSymbol: rwaMatch?.asset.symbol,
  })

  const carousel = useHorizontalSnapCarousel({
    cardWidth: RELATED_TOKENS_CARD_WIDTH,
    itemCount: featured.length,
    isLoading,
  })

  if (!rwaMatch || (!isLoading && featured.length === 0)) {
    return null
  }

  return (
    <Flex gap="$gap16" testID={TestID.TokenDetailsRWARelatedTokens}>
      <Text variant="heading3">{t('tdp.rwa.relatedTokens')}</Text>
      <TokenCardCarousel
        items={featured}
        getItemKey={getShelfItemKey}
        renderItem={(item) => (
          <ShelfTokenCard rwa={item.rwa} issuer={item.issuer} cardWidth={RELATED_TOKENS_CARD_WIDTH} />
        )}
        isLoading={isLoading}
        skeletonCount={EXPLORE_STOCK_SHELF_COUNT}
        carousel={carousel}
        cardWidth={RELATED_TOKENS_CARD_WIDTH}
        fadeWidth={CAROUSEL_FADE_WIDTH}
        showArrowButtons
      />
    </Flex>
  )
}
