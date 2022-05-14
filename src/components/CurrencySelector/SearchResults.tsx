import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItem, StyleSheet } from 'react-native'
import { ElementName } from 'src/features/telemetry/constants'
import { currencyId } from 'src/utils/currencyId'
import { TextButton } from '../buttons/TextButton'
import { Flex, Inset } from '../layout'
import { Text } from '../Text'

interface CurrencySearchResultListProps {
  currencies: Fuse.FuseResult<Currency>[]
  onClearSearchFilter: () => void
  renderItem: ListRenderItem<Fuse.FuseResult<Currency>> | null | undefined
  searchFilter: string | null
}

export function CurrencySearchResultList({
  currencies,
  onClearSearchFilter,
  renderItem,
  searchFilter,
}: CurrencySearchResultListProps) {
  const { t } = useTranslation()

  return (
    <FlatList
      ListEmptyComponent={
        <Flex centered gap="sm" px="lg">
          <Text variant="h4">😔</Text>
          <Text color="deprecated_gray200" textAlign="center" variant="h4">
            {searchFilter
              ? t('No tokens found for ”{{searchFilter}}”', { searchFilter })
              : t('No tokens found')}
          </Text>
          <TextButton
            name={ElementName.ClearSearch}
            textColor="deprecated_blue"
            onPress={onClearSearchFilter}>
            {t('Clear Search')}
          </TextButton>
        </Flex>
      }
      ListFooterComponent={
        <Inset all="xxl">
          <Inset all="md" />
        </Inset>
      }
      data={currencies}
      keyExtractor={(item) => currencyId(item.item)}
      renderItem={renderItem}
      style={styles.list}
      windowSize={2}
    />
  )
}

const styles = StyleSheet.create({
  list: {
    height: '100%',
    width: '100%',
  },
})
