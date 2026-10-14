import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { ArrowUpRight } from '@universe/mycelium/icons/ArrowUpRight'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

/** Where "View all" leads: another search tab, or out of the modal to a category's details page. */
export type SearchSectionViewAllDestination = { type: 'tab'; tab: SearchTab } | { type: 'category'; categoryId: string }

export const SearchSectionViewAllButton = memo(function SearchSectionViewAllButtonInner({
  destination,
  onPress,
}: {
  destination: SearchSectionViewAllDestination
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()

  // Both layouts inset the label 20px to line up with the section header and row content.
  if (destination.type === 'category') {
    return (
      <Flex row px="$spacing20">
        <Trace logPress element={ElementName.SearchSectionViewAll} properties={{ category_id: destination.categoryId }}>
          <TouchableArea
            row
            alignItems="center"
            backgroundColor="$surface3"
            borderRadius="$roundedFull"
            gap="$spacing6"
            px="$spacing8"
            py="$spacing6"
            hoverStyle={{ backgroundColor: '$surface3Hovered' }}
            pressStyle={{ opacity: 0.6 }}
            testID={`${TestID.SearchSectionViewAllPrefix}${destination.categoryId}`}
            onPress={onPress}
          >
            <Text color="$neutral1" variant="buttonLabel3">
              {t('common.viewAll')}
            </Text>
            <ArrowUpRight color="$neutral1" size="$icon.16" />
          </TouchableArea>
        </Trace>
      </Flex>
    )
  }

  return (
    <Flex row px="$spacing12">
      <Trace logPress element={ElementName.SearchSectionViewAll} properties={{ search_tab: destination.tab }}>
        <TouchableArea
          row
          alignItems="center"
          gap="$spacing6"
          p="$spacing8"
          // Figma sets the label on a 24px line (8 + 24 + 8); buttonLabel2's own line height is shorter.
          minHeight="$spacing40"
          hoverStyle={{ opacity: 0.8 }}
          pressStyle={{ opacity: 0.6 }}
          testID={`${TestID.SearchSectionViewAllPrefix}${destination.tab}`}
          onPress={onPress}
        >
          <Text color="$neutral1" variant="buttonLabel2">
            {t('common.viewAll')}
          </Text>
          <ArrowRight color="$neutral1" size="$icon.16" />
        </TouchableArea>
      </Trace>
    </Flex>
  )
})
