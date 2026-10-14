import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Flex, Text } from '@universe/mycelium'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { RwaDisclaimerText } from 'uniswap/src/features/tokenCategories/RwaDisclaimerText'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { InlineLearnMoreLink } from '~/pages/Explore/categories/InlineLearnMoreLink'

function getRwaDisclaimerHelpUrl(category: RwaCategory): string | undefined {
  switch (category) {
    case RwaCategory.STOCKS:
      return UniswapHelpUrls.articles.rwaExploreDisclaimer
    case RwaCategory.ETFS:
      return UniswapHelpUrls.articles.rwaExploreDisclaimerEtfs
    default:
      return undefined
  }
}

/** Flag-off disclaimer above the Stocks and ETFs explore tables; renders nothing for other categories. */
export function ExploreRwaDisclaimer({ category }: { category: RwaCategory }): JSX.Element | null {
  const href = getRwaDisclaimerHelpUrl(category)
  if (href === undefined) {
    return null
  }

  return (
    <Flex width="100%" maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT} mx="auto" mb="$spacing4">
      <Flex width="100%" pl="$spacing12" pr="$spacing16">
        <Text variant="body3" color="$neutral2">
          <RwaDisclaimerText category={category} link={<InlineLearnMoreLink href={href} />} />
        </Text>
      </Flex>
    </Flex>
  )
}
