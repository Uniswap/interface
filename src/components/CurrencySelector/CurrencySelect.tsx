import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FilterGroup } from 'src/components/CurrencySelector/FilterGroup'
import { Option } from 'src/components/CurrencySelector/Option'
import { Flex } from 'src/components/layout'
import { SearchBar } from 'src/components/SearchBar'
import { useFilteredCurrencies } from './hooks'
import { CurrencySearchResultList } from './SearchResults'

interface CurrencySearchProps {
  currencies: Currency[]
  onSelectCurrency: (currency: Currency) => void
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  showNonZeroBalancesOnly?: boolean
}

export function CurrencySelect({
  currencies,
  onSelectCurrency,
  otherCurrency,
  showNonZeroBalancesOnly,
}: CurrencySearchProps) {
  const {
    filteredCurrencies,
    onChainPress,
    onChangeText,
    onClearChainFilter,
    onClearSearchFilter,
    onToggleFavoritesFilter,
    searchFilter,
    selected,
  } = useFilteredCurrencies(currencies, otherCurrency?.chainId ?? null)

  const { t } = useTranslation()

  return (
    <Flex gap="lg" px="md">
      <SearchBar
        placeholder={t('Search token symbols or address')}
        value={searchFilter}
        onChangeText={onChangeText}
      />

      <FilterGroup
        resetButtonLabel={showNonZeroBalancesOnly ? t('Your tokens') : t('All tokens')}
        selected={selected}
        onPressFavorites={onToggleFavoritesFilter}
        onPressNetwork={onChainPress}
        onReset={onClearChainFilter}
      />

      <CurrencySearchResultList
        currencies={filteredCurrencies}
        renderItem={({ item }: ListRenderItemInfo<Fuse.FuseResult<Currency>>) => {
          const currency = item.item
          return (
            <Option
              currency={currency}
              matches={item.matches}
              metadataType="balance"
              onPress={() => onSelectCurrency?.(currency)}
            />
          )
        }}
        searchFilter={searchFilter}
        onClearSearchFilter={() => {
          onClearSearchFilter()
          onClearChainFilter()
        }}
      />
    </Flex>
  )
}
