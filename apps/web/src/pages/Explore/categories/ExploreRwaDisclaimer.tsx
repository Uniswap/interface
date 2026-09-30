import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { Anchor, Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { RwaDisclaimerText } from 'uniswap/src/features/tokenCategories/RwaDisclaimerText'

export function DisclaimerLearnMoreLink({ href }: { href: string }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Anchor
      href={href}
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

export function renderWebDisclaimerLink(href: string): JSX.Element {
  return <DisclaimerLearnMoreLink href={href} />
}

/** Legal disclaimer shown below Stocks and ETFs explore category tabs (not Commodities or All). */
export function ExploreRwaDisclaimer({ category }: { category: RwaCategory }): JSX.Element {
  return (
    <Flex width="100%" pl="$spacing12" pr="$spacing16">
      <Text variant="body3" color="$neutral2">
        <RwaDisclaimerText category={category} renderLink={renderWebDisclaimerLink} />
      </Text>
    </Flex>
  )
}
