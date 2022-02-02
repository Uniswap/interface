import { useTheme } from '@shopify/restyle'
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
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { NetworkButtonGroup, NetworkButtonType } from 'src/components/Network/NetworkButtonGroup'
import { Text } from 'src/components/Text'
import { Pill } from 'src/components/text/Pill'
import { ChainId } from 'src/constants/chains'
import { useAllBalancesByChainId } from 'src/features/balances/hooks'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useTokenPrices } from 'src/features/historicalChainData/useTokenPrices'
import { ElementName } from 'src/features/telemetry/constants'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Theme } from 'src/styles/theme'
import { currencyId } from 'src/utils/currencyId'
import { useDebounce } from 'src/utils/timing'

interface CurrencySearchProps {
  currencies: Currency[]
  onSelectCurrency: (currency: Currency) => void
  otherCurrency?: Currency | null
  selectedCurrency?: Currency | null
  showNonZeroBalancesOnly?: boolean
  showBackButton?: boolean
}

export function CurrencySearch({
  currencies,
  onSelectCurrency,
  otherCurrency,
  selectedCurrency,
  showNonZeroBalancesOnly,
  showBackButton = false,
}: CurrencySearchProps) {
  const [chainFilter, setChainFilter] = useState<ChainId | null>(otherCurrency?.chainId ?? null)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)
  const debouncedSearchFilter = useDebounce(searchFilter)
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
  const theme = useTheme<Theme>()

  const filteredCurrencies = useMemo(
    () => filter(currencies ?? null, chainFilter, debouncedSearchFilter),
    [chainFilter, currencies, debouncedSearchFilter]
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
      <Box mb="md">
        <Flex centered row gap="sm" mb="sm" mx="md">
          {showBackButton ? <BackButton /> : null}
          <Box
            backgroundColor="gray50"
            borderRadius="lg"
            flexDirection="row"
            paddingRight="md"
            style={styles.inputContainer}>
            <TextInput
              backgroundColor="none"
              borderWidth={0}
              fontSize={16}
              fontWeight={'500'}
              placeholder={t('Search token symbols or address')}
              placeholderTextColor="gray400"
              style={styles.input}
              value={searchFilter ?? undefined}
              onChangeText={onChangeText}
            />
            <SearchIcon stroke={theme.colors.gray600} strokeWidth={2} style={styles.inputIcon} />
          </Box>
        </Flex>

        <NetworkButtonGroup
          customButton={
            <Button
              mr="sm"
              name={`${ElementName.NetworkButtonGroupPrefix}-${
                showNonZeroBalancesOnly ? 'your-tokens' : 'all-tokens'
              }`}
              onPress={onClearChainFilter}>
              <Pill
                backgroundColor="gray100"
                borderColor={chainFilter === null ? 'gray600' : 'gray50'}
                foregroundColor={theme.colors.textColor}
                height={36}
                label={showNonZeroBalancesOnly ? t('Your tokens') : t('All tokens')}
              />
            </Button>
          }
          selected={chainFilter}
          type={NetworkButtonType.PILL}
          onPress={onChainPress}
        />
      </Box>
      <FlatList
        ListEmptyComponent={
          <Flex centered gap="sm" padding="lg">
            <Text variant="h4">😔</Text>
            <Text color="gray200" textAlign="center" variant="h4">
              {searchFilter
                ? t('No tokens found for ”{{searchFilter}}”', { searchFilter })
                : t('No tokens found')}
            </Text>
            <TextButton
              name={ElementName.ClearSearch}
              textColor="blue"
              onPress={onClearSearchFilter}>
              {t('Clear Search')}
            </TextButton>
          </Flex>
        }
        data={filteredCurrencies}
        keyExtractor={key}
        renderItem={({ item }: ListRenderItemInfo<Currency>) => {
          const tokenAddress = currencyId(item)
          const cAmount = balances?.[item.chainId as ChainId]?.[tokenAddress]
          return (
            <Option
              currency={item as Currency}
              currencyAmount={cAmount}
              currencyPrice={
                chainIdToPrices?.[item.chainId as ChainId]?.addressToPrice?.[currencyId(item)]
                  ?.priceUSD
              }
              selected={Boolean(selectedCurrency?.equals(item))}
              onPress={() => onSelectCurrency?.(item)}
            />
          )
        }}
      />
    </Box>
  )
}

function key(currency: Currency) {
  return currencyId(currency)
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
  },
  inputContainer: {
    flex: 1,
    fontSize: 17,
    height: 50,
    minHeight: 48,
  },
  inputIcon: {
    alignSelf: 'center',
  },
})
