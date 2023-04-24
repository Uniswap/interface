import { Currency } from '@uniswap/sdk-core'
import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedFlex } from 'src/components/layout'
import { useFilterCallbacks } from 'src/components/TokenSelector/hooks'
import { SearchBar } from 'src/components/TokenSelector/SearchBar'
import { TokenSearchResultList } from 'src/components/TokenSelector/TokenSearchResultList'

export enum TokenSelectorVariation {
  // used for Send flow, only show currencies with a balance
  BalancesOnly = 'balances-only',

  // used for Swap input. tokens with balances + popular
  BalancesAndPopular = 'balances-and-popular',

  // used for Swap output. tokens with balances, favorites, common + popular
  SuggestedAndPopular = 'suggested-and-popular',
}

interface TokenSelectorProps {
  onSelectCurrency: (currency: Currency) => void
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  onBack: () => void
  variation: TokenSelectorVariation
}

function _TokenSelector({
  onSelectCurrency,
  otherCurrency,
  onBack,
  variation,
}: TokenSelectorProps): JSX.Element {
  const { onChangeChainFilter, onChangeText, searchFilter, chainFilter } = useFilterCallbacks(
    otherCurrency?.chainId ?? null
  )

  const { t } = useTranslation()

  return (
    <AnimatedFlex
      entering={FadeIn}
      exiting={FadeOut}
      gap="spacing12"
      overflow="hidden"
      px="spacing16"
      width="100%">
      <SearchBar
        autoFocus
        backgroundColor="background2"
        placeholder={t('Search tokens')}
        value={searchFilter ?? ''}
        onBack={onBack}
        onChangeText={onChangeText}
      />
      <TokenSearchResultList
        chainFilter={chainFilter}
        searchFilter={searchFilter}
        variation={variation}
        onChangeChainFilter={onChangeChainFilter}
        onSelectCurrency={onSelectCurrency}
      />
    </AnimatedFlex>
  )
}

export const TokenSelector = memo(_TokenSelector)
