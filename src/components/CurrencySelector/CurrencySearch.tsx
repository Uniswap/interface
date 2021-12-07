import { Currency } from '@uniswap/sdk-core'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { Option } from 'src/components/CurrencySelector/Option'
import { filter } from 'src/components/CurrencySelector/util'
import { TextInput } from 'src/components/input/TextInput'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { NetworkButtonGroup } from 'src/components/Network/NetworkButtonGroup'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { useAllCurrencies } from 'src/features/tokens/useTokens'

interface CurrencySearchProps {
  onSelectCurrency: (currency: Currency) => void
}

export function CurrencySearch({ onSelectCurrency }: CurrencySearchProps) {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(null)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  const { t } = useTranslation()

  const currencies = useAllCurrencies()

  const filteredCurrencies = useMemo(
    () => filter(currencies, chainFilter, searchFilter),
    [chainFilter, currencies, searchFilter]
  )

  const onChainPress = (newChainFilter: typeof chainFilter) => {
    if (chainFilter === newChainFilter) {
      setChainFilter(null)
    } else {
      setChainFilter(newChainFilter)
    }
  }

  const onChangeText = (newSearchFilter: string) => setSearchFilter(newSearchFilter)

  return (
    <CenterBox flex={1}>
      <Box mb="md" mx="lg">
        <TextInput
          borderRadius="lg"
          mx="lg"
          onChangeText={onChangeText}
          placeholder="Search token symbols or address"
          style={styles.input}
          borderWidth={0}
          backgroundColor="gray50"
        />
        <NetworkButtonGroup selected={chainFilter} onPress={onChainPress} />
      </Box>
      <Box flex={1}>
        {filteredCurrencies.length > 0 ? (
          <FlatList
            data={filteredCurrencies}
            renderItem={({ item }: ListRenderItemInfo<Currency>) => (
              <Option currency={item as Currency} onPress={() => onSelectCurrency?.(item)} />
            )}
            keyExtractor={getKey}
          />
        ) : (
          <Text>{t`No tokens found`}</Text>
        )}
      </Box>
    </CenterBox>
  )
}

function getKey(currency: Currency) {
  return `${currency.chainId}-${currency.isNative ? 'ETH' : currency.wrapped.address}`
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    minHeight: 48,
    minWidth: '100%',
    fontSize: 17,
  },
})
