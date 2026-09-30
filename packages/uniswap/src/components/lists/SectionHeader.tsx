import { isAndroid } from '@universe/environment'
import { ElementAfterText, Flex, Text, TouchableArea } from '@universe/mycelium'
import { Briefcase } from '@universe/mycelium/icons/Briefcase'
import { Clock } from '@universe/mycelium/icons/Clock'
import { Coins } from '@universe/mycelium/icons/Coins'
import { EarnSparkle } from '@universe/mycelium/icons/EarnSparkle'
import { Heart } from '@universe/mycelium/icons/Heart'
import { Person } from '@universe/mycelium/icons/Person'
import { Pools } from '@universe/mycelium/icons/Pools'
import { Search } from '@universe/mycelium/icons/Search'
import { Shuffle } from '@universe/mycelium/icons/Shuffle'
import { TrendUp } from '@universe/mycelium/icons/TrendUp'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'

export const SECTION_HEADER_LAYOUT = { pt: '$spacing12', pb: '$spacing4', px: '$spacing20', gap: '$spacing8' } as const
export const SECTION_HEADER_TITLE_VARIANT = 'subheading2'

export type SectionHeaderProps = {
  sectionKey: OnchainItemSectionName
  /** Resolved `getSectionRowId`; namespaces the testID the same way as the row keys. */
  sectionRowId?: string
  onPress?: () => void
  rightElement?: JSX.Element
  endElement?: JSX.Element
  name?: string
  sectionHeader?: JSX.Element
  /** Overrides the default section icon (from `getSectionIcon`) when provided. */
  icon?: JSX.Element
}

export const SectionHeader = memo(function SectionHeaderInner({
  sectionKey,
  sectionRowId,
  onPress,
  rightElement,
  endElement,
  name,
  sectionHeader,
  icon,
}: SectionHeaderProps): JSX.Element | null {
  const title = useSectionTitle(sectionKey)

  if (sectionKey === OnchainItemSectionName.SuggestedTokens) {
    return null
  }

  if (sectionHeader) {
    return sectionHeader
  }

  const iconElement = icon ?? getSectionIcon(sectionKey)
  const titleText = name ?? title

  return (
    <Flex
      row
      backgroundColor="$surface1"
      width="100%"
      justifyContent="space-between"
      pb={SECTION_HEADER_LAYOUT.pb}
      pt={SECTION_HEADER_LAYOUT.pt}
      px={SECTION_HEADER_LAYOUT.px}
      alignItems={isAndroid ? 'flex-end' : 'center'}
      testID={`${TestID.SectionHeaderPrefix}${sectionRowId ?? sectionKey}`}
    >
      <Flex row alignItems="center" gap={SECTION_HEADER_LAYOUT.gap} flex={1}>
        {onPress ? (
          <>
            <TouchableArea
              row
              alignItems="center"
              flexShrink={1}
              gap={SECTION_HEADER_LAYOUT.gap}
              hoverStyle={{ opacity: 0.8 }}
              pressStyle={{ opacity: 0.6 }}
              onPress={onPress}
            >
              {iconElement}
              <Text color="$neutral2" variant={SECTION_HEADER_TITLE_VARIANT}>
                {titleText}
              </Text>
            </TouchableArea>
            {rightElement}
          </>
        ) : (
          <>
            {iconElement}
            <ElementAfterText
              text={titleText}
              textProps={{ color: '$neutral2', variant: SECTION_HEADER_TITLE_VARIANT }}
              wrapperProps={{ flex: 1 }}
              element={rightElement}
            />
          </>
        )}
      </Flex>
      {endElement}
    </Flex>
  )
})

function useSectionTitle(section: OnchainItemSectionName): string {
  const { t } = useTranslation()

  switch (section) {
    case OnchainItemSectionName.BridgingTokens:
      return t('tokens.selector.section.bridging')
    case OnchainItemSectionName.YourTokens:
      return t('tokens.selector.section.yours')
    case OnchainItemSectionName.OtherChainsTokens:
      return t('tokens.selector.section.otherNetworksSearchResults')
    case OnchainItemSectionName.TrendingTokens:
      return t('tokens.selector.section.trending')
    case OnchainItemSectionName.RecentSearches:
      return t('tokens.selector.section.recent')
    case OnchainItemSectionName.FavoriteTokens:
      return t('tokens.selector.section.favorite')
    case OnchainItemSectionName.SearchResults:
      return t('tokens.selector.section.search')
    case OnchainItemSectionName.Earn:
      return t('explore.earn.title')
    case OnchainItemSectionName.Tokens:
      return t('common.token.plural')
    case OnchainItemSectionName.Pools:
      return t('common.pools')
    case OnchainItemSectionName.TrendingPools:
      return t('pool.top.volume')
    case OnchainItemSectionName.Wallets:
      return t('explore.search.section.wallets')
    case OnchainItemSectionName.FavoriteWallets:
      return t('explore.wallets.favorite.title.default')
    case OnchainItemSectionName.TopAuctions:
      return t('explore.search.section.topAuctions')
    case OnchainItemSectionName.Auctions:
      return t('explore.search.section.auctions')
    case OnchainItemSectionName.SuggestedTokens: // no suggested tokens header
      return ''
    case OnchainItemSectionName.Stocks:
      return t('common.stocks')
    default:
      return section
  }
}

function getSectionIcon(section: OnchainItemSectionName): JSX.Element | null {
  switch (section) {
    case OnchainItemSectionName.BridgingTokens:
      return <Shuffle color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.Tokens:
    case OnchainItemSectionName.YourTokens:
    case OnchainItemSectionName.OtherChainsTokens:
      return <Coins color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.TrendingPools:
    case OnchainItemSectionName.TrendingTokens:
      return <TrendUp color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.RecentSearches:
      return <Clock color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.SearchResults:
      return <Search color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.FavoriteTokens:
      return <Coins color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.Earn:
      return <EarnSparkle color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.Pools:
      return <Pools color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.Wallets:
      return <Person color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.FavoriteWallets:
      return <Heart color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.Stocks:
      return <Briefcase color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.TopAuctions:
      return <TrendUp color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.Auctions:
      return <Coins color="$neutral2" size="$icon.16" />
    default:
      return null
  }
}
