import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { Search } from '@universe/mycelium/icons/Search'
import { TestID } from '@universe/test'
import { Trans, useTranslation } from 'react-i18next'

/** Clearing resets the chips and keeps the query. */
export function CategoryFilterEmptyState({
  searchFilter,
  activeFilterCount,
  onClearFilters,
}: {
  searchFilter: string
  activeFilterCount: number
  onClearFilters: () => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered gap="$spacing8" pt="$spacing48" px="$spacing36">
      <Search color="$neutral3" size="$icon.48" />
      <Text color="$neutral2" mt="$spacing8" textAlign="center" variant="body2">
        <Trans
          components={{ highlight: <Text color="$neutral1" variant="body2" /> }}
          i18nKey="tokens.selector.search.empty"
          values={{ searchText: searchFilter }}
        />
      </Text>
      <TouchableArea testID={TestID.TokenSelectorClearCategoryFilters} onPress={onClearFilters}>
        <Text color="$accent1" textAlign="center" variant="buttonLabel3">
          {t('tokens.selector.categoryFilter.clear', { count: activeFilterCount })}
        </Text>
      </TouchableArea>
    </Flex>
  )
}
