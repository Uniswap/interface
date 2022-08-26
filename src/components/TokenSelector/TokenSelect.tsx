import { Currency } from '@uniswap/sdk-core'
import React, { Suspense, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Loading } from 'src/components/loading'
import { useFilterCallbacks } from 'src/components/TokenSelector/hooks'
import { SearchBar } from 'src/components/TokenSelector/SearchBar'
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
  const { onChangeChainFilter, onChangeText, onClearSearchFilter, searchFilter, chainFilter } =
    useFilterCallbacks(otherCurrency?.chainId ?? null)

  const { t } = useTranslation()

  const onClearFilters = useCallback(() => {
    onClearSearchFilter()
    onChangeChainFilter(null)
  }, [onChangeChainFilter, onClearSearchFilter])

  return (
    <AnimatedFlex
      entering={FadeIn}
      exiting={FadeOut}
      gap="sm"
      overflow="hidden"
      px="md"
      width="100%">
      <SearchBar
        autoFocus
        backgroundColor="backgroundContainer"
        placeholder={t('Search tokens')}
        value={searchFilter ?? ''}
        onBack={onBack}
        onChangeText={onChangeText}
      />
      <Suspense fallback={<TokenSearchResultsLoading />}>
        <KeyboardAvoidingView behavior="height">
          <TokenSearchResultList
            chainFilter={chainFilter}
            searchFilter={searchFilter}
            variation={variation}
            onChangeChainFilter={onChangeChainFilter}
            onClearSearchFilter={onClearFilters}
            onSelectCurrency={onSelectCurrency}
          />
        </KeyboardAvoidingView>
      </Suspense>
    </AnimatedFlex>
  )
}

function TokenSearchResultsLoading() {
  return (
    <Flex fill>
      <Loading repeat={5} type="token" />
    </Flex>
  )
}
