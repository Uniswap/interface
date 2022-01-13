import { Currency } from '@uniswap/sdk-core'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, StyleSheet } from 'react-native'
import SearchIcon from 'src/assets/icons/search.svg'
import { BackButton } from 'src/components/buttons/BackButton'
import { Button } from 'src/components/buttons/Button'
import { TextButton } from 'src/components/buttons/TextButton'
import { Option } from 'src/components/CurrencySelector/Option'
import { filter } from 'src/components/CurrencySelector/util'
import { TextInput } from 'src/components/input/TextInput'
import { Flex, Inset } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { NetworkButtonGroup, NetworkButtonType } from 'src/components/Network/NetworkButtonGroup'
import { Text } from 'src/components/Text'
import { Pill } from 'src/components/text/Pill'
import { ChainId } from 'src/constants/chains'
import { useAllBalancesByChainId } from 'src/features/balances/hooks'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { theme } from 'src/styles/theme'
import { currencyId } from 'src/utils/currencyId'

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
  const activeAccount = useActiveAccount()
  const currentChains = useActiveChainIds()
  const chainIdToTokens = useAllTokens()

  const { balances } = useAllBalancesByChainId(
    currentChains,
    chainIdToTokens,
    activeAccount?.address
  )

  const { chainIdToPrices } = useTokenPrices(currencies)

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

  const onClearChainFilter = () => setChainFilter(null)
  const onClearSearchFilter = () => setSearchFilter(null)

  const onChangeText = (newSearchFilter: string) => setSearchFilter(newSearchFilter)

  return (
    <Box flex={1} width="100%">
      <FlatList
        data={filteredCurrencies}
        ListHeaderComponent={
          <Box mb="md">
            <Inset all="sm">
              <Flex gap="sm" flexDirection="row" centered>
                <BackButton />
                <Box
                  style={styles.inputContainer}
                  backgroundColor="gray50"
                  paddingRight="sm"
                  flexDirection="row"
                  borderRadius="lg">
                  <TextInput
                    padding="md"
                    onChangeText={onChangeText}
                    value={searchFilter ?? undefined}
                    placeholder={t('Search token symbols or address')}
                    style={styles.input}
                    borderWidth={0}
                    backgroundColor="none"
                  />
                  <SearchIcon
                    stroke={theme.colors.gray200}
                    strokeWidth={2.2}
                    style={styles.inputIcon}
                  />
                </Box>
              </Flex>
            </Inset>

            <NetworkButtonGroup
              selected={chainFilter}
              onPress={onChainPress}
              type={NetworkButtonType.PILL}
              customButton={
                <Button mr="sm" onPress={onClearChainFilter}>
                  <Pill
                    backgroundColor="gray50"
                    borderColor={chainFilter === null ? 'gray200' : 'gray50'}
                    label={showNonZeroBalancesOnly ? t('Your tokens') : t('All tokens')}
                  />
                </Button>
              }
            />
          </Box>
        }
        renderItem={({ item }: ListRenderItemInfo<Currency>) => {
          const tokenAddress = currencyId(item)
          const cAmount = balances?.[item.chainId as ChainId]?.[tokenAddress]
          return (
            <Option
              currencyPrice={
                chainIdToPrices?.[item.chainId as ChainId]?.addressToPrice?.[currencyId(item)]
                  ?.priceUSD
              }
              currencyAmount={cAmount}
              currency={item as Currency}
              onPress={() => onSelectCurrency?.(item)}
              selected={Boolean(selectedCurrency?.equals(item))}
            />
          )
        }}
        ListEmptyComponent={
          <Flex centered gap="sm" padding="lg">
            <Text variant="h4">😔</Text>
            <Text variant="h4" color="gray200" textAlign="center">
              {searchFilter
                ? t('No tokens found for ”{{searchFilter}}”', { searchFilter })
                : t('No tokens found')}
            </Text>
            <TextButton textColor="blue" onPress={onClearSearchFilter}>
              {t('Clear Search')}
            </TextButton>
          </Flex>
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
  inputContainer: {
    height: 50,
    minHeight: 48,
    fontSize: 17,
    flex: 1,
  },
  inputIcon: {
    alignSelf: 'center',
  },
  input: {
    flex: 1,
  },
})
