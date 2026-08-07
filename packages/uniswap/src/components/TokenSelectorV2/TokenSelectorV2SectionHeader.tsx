import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { Briefcase } from 'ui/src/components/icons/Briefcase'
import { Coins } from 'ui/src/components/icons/Coins'
import { Fire } from 'ui/src/components/icons/Fire'
import { Search } from 'ui/src/components/icons/Search'
import { Shuffle } from 'ui/src/components/icons/Shuffle'
import { Sparkle } from 'ui/src/components/icons/Sparkle'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import { OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

function useSectionTitleV2(sectionKey: OnchainItemSectionName): string {
  const { t } = useTranslation()

  switch (sectionKey) {
    case OnchainItemSectionName.RecentSearches:
      return t('tokens.selectorV2.section.recent')
    case OnchainItemSectionName.SuggestedTokens:
      return t('tokens.selectorV2.section.suggested')
    case OnchainItemSectionName.TrendingTokens:
      return t('tokens.selectorV2.section.trending')
    case OnchainItemSectionName.YourTokens:
      return t('tokens.selector.section.yours')
    case OnchainItemSectionName.BridgingTokens:
      return t('tokens.selector.section.bridging')
    case OnchainItemSectionName.SearchResults:
      return t('tokens.selectorV2.section.results')
    case OnchainItemSectionName.OtherChainsTokens:
      return t('tokens.selector.section.otherNetworksSearchResults')
    case OnchainItemSectionName.Stocks:
      return t('common.stocks')
    case OnchainItemSectionName.HiddenTokens:
      return ''
    default:
      return ''
  }
}

function getSectionIconV2(sectionKey: OnchainItemSectionName): JSX.Element | null {
  switch (sectionKey) {
    case OnchainItemSectionName.RecentSearches:
    case OnchainItemSectionName.SearchResults:
      return <Search color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.SuggestedTokens:
      return <Sparkle color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.TrendingTokens:
      return <Fire color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.YourTokens:
    case OnchainItemSectionName.OtherChainsTokens:
      return <Coins color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.BridgingTokens:
      return <Shuffle color="$neutral2" size="$icon.16" />
    case OnchainItemSectionName.Stocks:
      return <Briefcase color="$neutral2" size="$icon.16" />
    default:
      return null
  }
}

/**
 * V2 section header: icon + title + optional trailing action (Figma 750:13046).
 * V2-local on purpose — the shared lists/SectionHeader stays untouched for the legacy tree.
 */
export const TokenSelectorV2SectionHeader = memo(function TokenSelectorV2SectionHeader({
  sectionKey,
  endElement,
}: {
  sectionKey: OnchainItemSectionName
  endElement?: JSX.Element
}): JSX.Element | null {
  const title = useSectionTitleV2(sectionKey)

  if (!title) {
    return null
  }

  return (
    <Flex
      row
      alignItems="center"
      backgroundColor="$surface1"
      justifyContent="space-between"
      pb="$spacing4"
      pt="$spacing8"
      px="$spacing12"
      width="100%"
      testID={`${TestID.SectionHeaderPrefix}${sectionKey}`}
    >
      <Flex row alignItems="center" gap="$spacing8" flex={1}>
        {getSectionIconV2(sectionKey)}
        <Text color="$neutral2" variant="body3">
          {title}
        </Text>
      </Flex>
      {endElement}
    </Flex>
  )
})

/** Replaces each section's header with the V2-styled one (used by the search lists, whose sections
 *  come from legacy hooks and would otherwise render legacy-styled headers). */
export function useSectionsWithV2Headers<T extends OnchainItemListOption>(
  sections: OnchainItemSection<T>[] | undefined,
): OnchainItemSection<T>[] | undefined {
  return useMemo(
    () =>
      sections?.map((section) => ({
        ...section,
        sectionHeader: <TokenSelectorV2SectionHeader endElement={section.endElement} sectionKey={section.sectionKey} />,
      })),
    [sections],
  )
}
