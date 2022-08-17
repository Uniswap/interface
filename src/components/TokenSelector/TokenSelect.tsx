import { Currency } from '@uniswap/sdk-core'
import React, { Suspense, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { SearchBar } from 'src/components/SearchBar'
import { useFilterCallbacks } from 'src/components/TokenSelector/hooks'
import { NetworkFilter } from 'src/components/TokenSelector/NetworkFilter'
import {
  TokenSearchResultList,
  TokenSelectorVariation,
} from 'src/components/TokenSelector/SearchResults'

interface TokenSearchProps {
  onSelectCurrency: (currency: Currency) => void
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  onBack: () => void
  variation: TokenSelectorVariation
}

export function TokenSelect({
  onSelectCurrency,
  otherCurrency,
  onBack,
  variation,
}: TokenSearchProps) {
  const { onChainPress, onChangeText, onClearSearchFilter, searchFilter, chainFilter } =
    useFilterCallbacks(otherCurrency?.chainId ?? null)

  const { t } = useTranslation()

  const onClearFilters = useCallback(() => {
    onClearSearchFilter()
    onChainPress(null)
  }, [onChainPress, onClearSearchFilter])

  return (
    <Flex gap="sm" overflow="hidden" px="md" width="100%">
      <SearchBar
        placeholder={t('Search token symbols or address')}
        value={searchFilter}
        onBack={onBack}
        onChangeText={onChangeText}
      />
      <NetworkFilter selectedChain={chainFilter} onPressChain={onChainPress} />
      <Suspense fallback={<TokenSearchResultsLoading />}>
        <TokenSearchResultList
          chainFilter={chainFilter}
          searchFilter={searchFilter}
          variation={variation}
          onClearSearchFilter={onClearFilters}
          onSelectCurrency={onSelectCurrency}
        />
      </Suspense>
    </Flex>
  )
}

function TokenSearchResultsLoading() {
  return (
    <Flex fill>
      <Loading repeat={5} type="token" />
    </Flex>
  )
}
