import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { BackButton } from 'src/components/buttons/BackButton'
import { FilterGroup } from 'src/components/CurrencySelector/FilterGroup'
import { Option } from 'src/components/CurrencySelector/Option'
import { Flex } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { useAllBalancesByChainId } from 'src/features/balances/hooks'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { currencyId } from 'src/utils/currencyId'
import { useFilteredCurrencies } from './hooks'
import { CurrencySearchTextInput } from './SearchInput'
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
  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()
  const chainIdToTokens = useAllTokens()

  const { balances } = useAllBalancesByChainId(
    currentChains,
    chainIdToTokens,
    activeAccount?.address
  )

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

  const { chainIdToPrices } = useTokenPrices(currencies)

  const { t } = useTranslation()

  return (
    <Flex gap="lg" px="md">
      <Flex centered row gap="sm">
        <BackButton />
        <CurrencySearchTextInput value={searchFilter} onChangeText={onChangeText} />
      </Flex>

      <FilterGroup
        resetButtonLabel={showNonZeroBalancesOnly ? t('Your tokens') : t('All tokens')}
        selected={selected}
        onPressFavorites={onToggleFavoritesFilter}
        onPressNetwork={onChainPress}
        onReset={onClearChainFilter}
      />

      <CurrencySearchResultList
        currencies={filteredCurrencies}
        renderItem={({ item }: ListRenderItemInfo<Currency>) => {
          const tokenAddress = currencyId(item)
          const cAmount = balances?.[item.chainId as ChainId]?.[tokenAddress]
          return (
            <Option
              currency={item as Currency}
              currencyAmount={cAmount}
              currencyPrice={
                chainIdToPrices?.[item.chainId as ChainId]?.addressToPrice?.[tokenAddress]?.priceUSD
              }
              metadataType="balance"
              onPress={() => onSelectCurrency?.(item)}
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
