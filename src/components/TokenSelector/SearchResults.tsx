import Fuse from 'fuse.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItem, StyleSheet } from 'react-native'
import { CurrencyWithMetadata } from 'src/components/TokenSelector/types'
import { ElementName } from 'src/features/telemetry/constants'
import { currencyId } from 'src/utils/currencyId'
import { TextButton } from '../buttons/TextButton'
import { Flex, Inset } from '../layout'
import { Text } from '../Text'

interface TokenSearchResultListProps {
  currenciesWithMetadata: Fuse.FuseResult<CurrencyWithMetadata>[]
  onClearSearchFilter: () => void
  renderItem: ListRenderItem<Fuse.FuseResult<CurrencyWithMetadata>> | null | undefined
  searchFilter: string | null
}

export function TokenSearchResultList({
  currenciesWithMetadata,
  onClearSearchFilter,
  renderItem,
  searchFilter,
}: TokenSearchResultListProps) {
  const { t } = useTranslation()

  return (
    <FlatList
      ListEmptyComponent={
        <Flex centered gap="sm" px="lg">
          <Text variant="mediumLabel">😔</Text>
          <Text color="textTertiary" textAlign="center" variant="mediumLabel">
            {searchFilter
              ? t('No tokens found for ”{{searchFilter}}”', { searchFilter })
              : t('No tokens found')}
          </Text>
          <TextButton
            name={ElementName.ClearSearch}
            textColor="accentActive"
            onPress={onClearSearchFilter}>
            {t('Clear search')}
          </TextButton>
        </Flex>
      }
      ListFooterComponent={Footer}
      data={currenciesWithMetadata}
      keyExtractor={key}
      renderItem={renderItem}
      style={styles.list}
      windowSize={1}
    />
  )
}

function Footer() {
  return (
    <Inset all="xxl">
      <Inset all="md" />
    </Inset>
  )
}

function key(item: Fuse.FuseResult<CurrencyWithMetadata>) {
  return currencyId(item.item.currency)
}

const styles = StyleSheet.create({
  list: {
    height: '100%',
    width: '100%',
  },
})
