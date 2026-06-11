import { FeatureFlags } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useExploreStocks } from 'uniswap/src/data/rest/rwa/useExploreStocks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ASSET_CARD_WIDTH_NARROW, ASSET_SHELF_CAROUSEL_FADE_WIDTH } from '~/pages/Explore/rwa/shelf/assetCardConstants'
import { AssetShelfCarousel } from '~/pages/Explore/rwa/shelf/AssetShelfCarousel'
import { useHorizontalSnapCarousel } from '~/pages/Explore/rwa/shelf/useHorizontalSnapCarousel'
import { useRWATokenDetailsMatch } from '~/pages/TokenDetails/hooks/useRWATokenDetailsMatch'

/** Related stocks shelf on the RWA TDP, reusing the Explore stock shelf carousel (gated by `FeatureFlags.RWATdpRelatedTokens`). */
export function RelatedTokens(): JSX.Element | null {
  const { t } = useTranslation()
  const rwaMatch = useRWATokenDetailsMatch(FeatureFlags.RWATdpRelatedTokens)

  const { featured, isLoading } = useExploreStocks([], {
    enabled: Boolean(rwaMatch),
    excludeSymbol: rwaMatch?.asset.symbol,
  })

  const carousel = useHorizontalSnapCarousel({
    cardWidth: ASSET_CARD_WIDTH_NARROW,
    itemCount: featured.length,
    isLoading,
  })

  if (!rwaMatch || (!isLoading && featured.length === 0)) {
    return null
  }

  return (
    <Flex gap="$gap16" testID={TestID.TokenDetailsRWARelatedTokens}>
      <Text variant="heading3">{t('tdp.rwa.relatedTokens')}</Text>
      <AssetShelfCarousel
        featured={featured}
        isLoading={isLoading}
        cardWidth={ASSET_CARD_WIDTH_NARROW}
        fadeWidth={ASSET_SHELF_CAROUSEL_FADE_WIDTH}
        showArrowButtons
        {...carousel}
      />
    </Flex>
  )
}
