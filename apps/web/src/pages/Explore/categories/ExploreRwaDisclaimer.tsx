import { Trans, useTranslation } from 'react-i18next'
import { Anchor, Flex, Text } from 'ui/src'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import type { RankedRwaExploreCategory } from '~/pages/Explore/categories/exploreRwaCategory'

function DisclaimerLearnMoreLink(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Anchor
      href={UniswapHelpUrls.articles.rwaExploreDisclaimer}
      target="_blank"
      rel="noopener noreferrer"
      textDecorationLine="none"
      color="$neutral1"
      fontWeight="$medium"
      fontSize="$small"
      lineHeight="$small"
      hoverStyle={{ opacity: 0.6 }}
      $platform-web={{ cursor: 'pointer' }}
    >
      <Text variant="buttonLabel3" color="$neutral1">
        {t('common.button.learn')}
      </Text>
    </Anchor>
  )
}

/** Legal disclaimer shown below Stocks and ETFs explore category tabs (not Commodities or Popular). */
export function ExploreRwaDisclaimer({ category }: { category: RankedRwaExploreCategory }): JSX.Element {
  const link = <DisclaimerLearnMoreLink />

  return (
    <Flex width="100%" pl="$spacing12" pr="$spacing16">
      <Text variant="body3" color="$neutral2">
        {category === 'stocks' ? (
          <Trans i18nKey="explore.rwa.table.disclaimer.stocks" components={{ link }} />
        ) : (
          <Trans i18nKey="explore.rwa.table.disclaimer.etfs" components={{ link }} />
        )}
      </Text>
    </Flex>
  )
}
