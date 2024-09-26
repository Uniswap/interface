import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Clock } from 'ui/src/components/icons/Clock'
import { Coins } from 'ui/src/components/icons/Coins'
import { Pin } from 'ui/src/components/icons/Pin'
import { Search } from 'ui/src/components/icons/Search'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { Star } from 'ui/src/components/icons/Star'
import { TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'

export type TokenSectionHeaderProps = {
  sectionKey: TokenOptionSection
  rightElement?: JSX.Element
}

export function SectionHeader({ sectionKey, rightElement }: TokenSectionHeaderProps): JSX.Element | null {
  const title = useTokenOptionsSectionTitle(sectionKey)
  const icon = getTokenOptionsSectionIcon(sectionKey)
  if (sectionKey === TokenOptionSection.SuggestedTokens) {
    return null
  }
  return (
    <Flex row backgroundColor="$surface1" justifyContent="space-between" pb="$spacing4" pt="$spacing12" px="$spacing16">
      <Text color="$neutral2" variant="subheading2">
        <Flex row alignItems="center" gap="$spacing8">
          {icon}
          <Text color="$neutral2">{title}</Text>
        </Flex>
      </Text>
      {rightElement}
    </Flex>
  )
}

export function useTokenOptionsSectionTitle(section: TokenOptionSection): string {
  const { t } = useTranslation()
  switch (section) {
    case TokenOptionSection.BridgingTokens:
      return t('tokens.selector.section.bridging')
    case TokenOptionSection.YourTokens:
      return t('tokens.selector.section.yours')
    case TokenOptionSection.PopularTokens:
      return t('common.tokens')
    case TokenOptionSection.RecentTokens:
      return t('tokens.selector.section.recent')
    case TokenOptionSection.FavoriteTokens:
      return t('tokens.selector.section.favorite')
    case TokenOptionSection.SearchResults:
      return t('tokens.selector.section.search')
    case TokenOptionSection.SuggestedTokens:
      return '' // no suggested tokens header
    default:
      return ''
  }
}

function getTokenOptionsSectionIcon(section: TokenOptionSection): JSX.Element | null {
  switch (section) {
    case TokenOptionSection.BridgingTokens:
      return <Shuffle color="$neutral2" size="$icon.16" />
    case TokenOptionSection.YourTokens:
      return <Coins color="$neutral2" size="$icon.16" />
    case TokenOptionSection.PopularTokens:
      return <Star color="$neutral2" size="$icon.16" />
    case TokenOptionSection.RecentTokens:
      return <Clock color="$neutral2" size="$icon.16" />
    case TokenOptionSection.SearchResults:
      return <Search color="$neutral2" size="$icon.16" />
    case TokenOptionSection.FavoriteTokens:
      return <Pin color="$neutral2" size="$icon.16" />
    default:
      return null
  }
}
