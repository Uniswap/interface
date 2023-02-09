import React from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { SearchPopularTokens } from 'src/components/explore/search/SearchPopularTokens'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import {
  clearSearchHistory,
  SearchResult,
  SearchResultType,
  selectSearchHistory,
  WalletCategory,
  WalletSearchResult,
} from 'src/features/explore/searchHistorySlice'

export const SUGGESTED_WALLETS: WalletSearchResult[] = [
  {
    type: SearchResultType.Wallet,
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ensName: 'vitalik.eth',
    category: WalletCategory.Builder,
  },
  {
    type: SearchResultType.Wallet,
    address: '0x50EC05ADe8280758E2077fcBC08D878D4aef79C3',
    ensName: 'hayden.eth',
    category: WalletCategory.Builder,
  },
]

export function SearchEmptySection(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const searchHistory = useAppSelector(selectSearchHistory)

  const onPressClearSearchHistory = (): void => {
    dispatch(clearSearchHistory())
  }

  // Show search history (if applicable), trending tokens, and wallets
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="spacing12">
      {searchHistory.length > 0 && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
          <FlatList
            ListHeaderComponent={
              <Flex
                row
                alignItems="center"
                justifyContent="space-between"
                mb="spacing4"
                ml="spacing8">
                <Text color="textSecondary" variant="subheadSmall">
                  {t('Recent searches')}
                </Text>
                <TouchableArea onPress={onPressClearSearchHistory}>
                  <Text color="accentAction" variant="buttonLabelSmall">
                    {t('Clear all')}
                  </Text>
                </TouchableArea>
              </Flex>
            }
            data={searchHistory}
            renderItem={renderSearchHistoryItem}
          />
        </AnimatedFlex>
      )}
      <Flex gap="spacing4">
        <Text color="textSecondary" mx="spacing8" variant="subheadSmall">
          {t('Popular tokens')}
        </Text>
        <SearchPopularTokens />
      </Flex>
      <FlatList
        ListHeaderComponent={
          <Text color="textSecondary" mb="spacing4" mx="spacing8" variant="subheadSmall">
            {t('Suggested wallets')}
          </Text>
        }
        data={SUGGESTED_WALLETS}
        keyExtractor={walletKey}
        listKey="wallets"
        renderItem={renderWalletItem}
      />
    </AnimatedFlex>
  )
}

const renderSearchHistoryItem = ({
  item: searchResult,
}: ListRenderItemInfo<SearchResult>): JSX.Element => {
  if (searchResult.type === SearchResultType.Token) {
    return <SearchTokenItem token={searchResult} />
  } else if (searchResult.type === SearchResultType.Wallet) {
    return <SearchWalletItem wallet={searchResult} />
  } else {
    return <SearchEtherscanItem etherscanResult={searchResult} />
  }
}

const renderWalletItem = ({ item }: ListRenderItemInfo<WalletSearchResult>): JSX.Element => (
  <SearchWalletItem wallet={item} />
)

const walletKey = (wallet: WalletSearchResult): string => {
  return wallet.address
}
