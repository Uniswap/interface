import { Flex, fonts, Text } from '@universe/mycelium'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { CategoryDescriptionText } from 'uniswap/src/features/tokenCategories/CategoryDescriptionText'
import { getTokenCategoryIcon } from 'uniswap/src/features/tokenCategories/categoryIcons'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { LoadingBubble } from '~/components/Tokens/loading'
import { InlineLearnMoreLink } from '~/pages/Explore/categories/InlineLearnMoreLink'

const ICON_TILE_SIZE = 64
const DESCRIPTION_MAX_WIDTH = 680

function renderLearnMoreLink(label: string): JSX.Element {
  return <InlineLearnMoreLink href={UniswapHelpUrls.articles.tokenCategoryDefinitions} label={label} />
}

export function CategoryDetailsHeader({ category }: { category: TokenCategory }): JSX.Element {
  const Icon = getTokenCategoryIcon(category)

  return (
    <Flex row gap="$spacing16" alignItems="flex-start" width="100%">
      <Flex
        centered
        flexShrink={0}
        borderRadius="$rounded12"
        backgroundColor="$accent2"
        width={ICON_TILE_SIZE}
        height={ICON_TILE_SIZE}
      >
        <Icon color="$accent1" size="$icon.36" />
      </Flex>
      <Flex gap="$spacing4" flexShrink={1}>
        <Flex row gap="$spacing8" alignItems="center">
          <Text tag="h1" variant="heading3" color="$neutral1" m={0}>
            {category.name}
          </Text>
          <RelativeChange
            change={category.stats?.priceChange24hPct}
            variant="body2"
            arrowSize="$icon.16"
            semanticColor
          />
        </Flex>
        <Text variant="body2" color="$neutral2" maxWidth={DESCRIPTION_MAX_WIDTH}>
          <CategoryDescriptionText category={category} renderLink={renderLearnMoreLink} />
        </Text>
      </Flex>
    </Flex>
  )
}

export function CategoryDetailsHeaderSkeleton(): JSX.Element {
  return (
    <Flex row gap="$spacing16" alignItems="flex-start" width="100%">
      <LoadingBubble
        width={ICON_TILE_SIZE}
        height={ICON_TILE_SIZE}
        containerProps={{ width: ICON_TILE_SIZE, flexShrink: 0 }}
      />
      <Flex gap="$spacing4" flex={1} minWidth={0}>
        <Flex height={fonts.heading3.lineHeight} justifyContent="center">
          <LoadingBubble width={220} height={fonts.heading3.fontSize} />
        </Flex>
        <Flex height={fonts.body2.lineHeight} justifyContent="center">
          <LoadingBubble width={360} height={fonts.body2.fontSize} />
        </Flex>
      </Flex>
    </Flex>
  )
}
