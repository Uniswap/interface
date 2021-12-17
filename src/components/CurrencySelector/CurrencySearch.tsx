import { Currency } from '@uniswap/sdk-core'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { Option } from 'src/components/CurrencySelector/Option'
import { filter } from 'src/components/CurrencySelector/util'
import { TextInput } from 'src/components/input/TextInput'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { NetworkButtonGroup } from 'src/components/Network/NetworkButtonGroup'
import { Text } from 'src/components/Text'
import { Pill } from 'src/components/text/Pill'
import { ChainId } from 'src/constants/chains'

interface CurrencySearchProps {
  currencies: Currency[]
  onSelectCurrency: (currency: Currency) => void
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  showNonZeroBalancesOnly?: boolean
}

export function CurrencySearch({
  currencies,
  onSelectCurrency,
  otherCurrency,
  selectedCurrency,
  showNonZeroBalancesOnly,
}: CurrencySearchProps) {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(otherCurrency?.chainId ?? null)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  const { t } = useTranslation()

  const filteredCurrencies = useMemo(
    () => filter(currencies ?? null, chainFilter, searchFilter),
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
    <Box flex={1} width="100%">
      <FlatList
        data={filteredCurrencies}
        ListHeaderComponent={
          <Box mb="md">
            <TextInput
              borderRadius="lg"
              mx="lg"
              onChangeText={onChangeText}
              placeholder={t('Search token symbols or address')}
              style={styles.input}
              borderWidth={0}
              backgroundColor="gray50"
            />
            <NetworkButtonGroup
              selected={chainFilter}
              onPress={onChainPress}
              customButton={
                showNonZeroBalancesOnly ? (
                  <Button mr="sm" onPress={() => onChainPress(null)}>
                    <Pill borderColor="black" label={t('Your tokens')} />
                  </Button>
                ) : undefined
              }
            />
          </Box>
        }
        renderItem={({ item }: ListRenderItemInfo<Currency>) => (
          <Option
            currency={item as Currency}
            onPress={() => onSelectCurrency?.(item)}
            selected={Boolean(selectedCurrency?.equals(item))}
          />
        )}
        ListEmptyComponent={
          <CenterBox my="sm">
            <Text variant="h4" color="gray200">{t`No tokens found`}</Text>
          </CenterBox>
        }
        keyExtractor={getKey}
      />
    </Box>
  )
}

function getKey(currency: Currency) {
  return `${currency.chainId}-${currency.isNative ? 'ETH' : currency.wrapped.address}`
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    minHeight: 48,
    fontSize: 17,
  },
})
