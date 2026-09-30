import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { ArrowRight } from '@universe/mycelium/icons/ArrowRight'
import { TestID } from '@universe/test'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export const SearchSectionViewAllButton = memo(function SearchSectionViewAllButtonInner({
  tab,
  onPress,
}: {
  tab: SearchTab
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()

  // px + p line the label up with the section header and row content (20px inset).
  return (
    <Flex row px="$spacing12">
      <Trace logPress element={ElementName.SearchSectionViewAll} properties={{ search_tab: tab }}>
        <TouchableArea
          row
          alignItems="center"
          gap="$spacing6"
          p="$spacing8"
          // Figma sets the label on a 24px line (8 + 24 + 8); buttonLabel2's own line height is shorter.
          minHeight="$spacing40"
          hoverStyle={{ opacity: 0.8 }}
          pressStyle={{ opacity: 0.6 }}
          testID={`${TestID.SearchSectionViewAllPrefix}${tab}`}
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
