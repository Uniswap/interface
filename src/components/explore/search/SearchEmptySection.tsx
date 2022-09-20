import { default as React, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { CloseIcon } from 'src/components/icons/CloseIcon'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { CoingeckoOrderBy, CoingeckoSearchCoin } from 'src/features/dataApi/coingecko/types'
import { useMarketTokens } from 'src/features/explore/hooks'
import {
  clearSearchHistory,
  EtherscanSearchResult,
  SearchResult,
  SearchResultType,
  selectSearchHistory,
  TokenSearchResult,
  WalletSearchResult,
} from 'src/features/explore/searchHistorySlice'

// TODO: Update fixed trending wallets
const TRENDING_WALLETS: WalletSearchResult[] = [
  {
    type: SearchResultType.Wallet,
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ensName: 'vitalik.eth',
  },
  {
    type: SearchResultType.Wallet,
    address: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
    ensName: 'hayden.eth',
  },
  {
    type: SearchResultType.Wallet,
    address: '0xD387A6E4e84a6C86bd90C158C6028A58CC8Ac459',
    ensName: 'pranksy.eth',
  },
]

const TRENDING_TOKENS_COUNT = 3

export function SearchEmptySection() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const searchHistory = useAppSelector(selectSearchHistory)

  // Fetch trending tokens by top trading volume

  const { tokens: trendingTokens, isLoading: trendingIsLoading } = useMarketTokens({
    remoteOrderBy: CoingeckoOrderBy.VolumeDesc,
  })

  const topTrendingTokens = useMemo(
    () => trendingTokens?.slice(0, TRENDING_TOKENS_COUNT),
    [trendingTokens]
  )

  const onPressClearSearchHistory = () => {
    dispatch(clearSearchHistory())
  }

  // Show search history (if applicable), trending tokens, and wallets
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="sm">
      {searchHistory.length > 0 && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
          <BaseCard.List
            ItemSeparatorComponent={() => <Separator mx="xs" />}
            ListHeaderComponent={
              <Flex row justifyContent="space-between" mb="xxs" mx="xs">
                <Text color="textSecondary" variant="subheadSmall">
                  {t('Recent searches')}
                </Text>
                <Button onPress={onPressClearSearchHistory}>
                  <Flex centered row gap="xxs">
                    <Text color="textSecondary" variant="subheadSmall">
                      {t('Clear all')}
                    </Text>
                    <CloseIcon color="textSecondary" size={18} />
                  </Flex>
                </Button>
              </Flex>
            }
            data={searchHistory}
            renderItem={renderSearchHistoryItem}
          />
        </AnimatedFlex>
      )}
      {trendingIsLoading ? (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="none">
          <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
            {t('Popular Tokens')}
          </Text>
          <Loading repeat={TRENDING_TOKENS_COUNT} type="token" />
        </AnimatedFlex>
      ) : (
        trendingTokens?.length && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
            <BaseCard.List
              ItemSeparatorComponent={() => <Separator mx="xs" />}
              ListHeaderComponent={
                <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
                  {t('Popular Tokens')}
                </Text>
              }
              data={topTrendingTokens}
              keyExtractor={coinKey}
              listKey="tokens"
              renderItem={renderTokenItem}
            />
          </AnimatedFlex>
        )
      )}
      <BaseCard.List
        ItemSeparatorComponent={() => <Separator mx="xs" />}
        ListHeaderComponent={
          <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
            {t('Wallets')}
          </Text>
        }
        data={TRENDING_WALLETS}
        keyExtractor={walletKey}
        listKey="wallets"
        renderItem={renderWalletItem}
      />
    </AnimatedFlex>
  )
}

const renderSearchHistoryItem = ({ item: searchResult }: ListRenderItemInfo<SearchResult>) => {
  if (searchResult.type === SearchResultType.Token) {
    return <SearchTokenItem coin={searchResult as TokenSearchResult} />
  } else if (searchResult.type === SearchResultType.Wallet) {
    return <SearchWalletItem wallet={searchResult as WalletSearchResult} />
  } else {
    return <SearchEtherscanItem etherscanResult={searchResult as EtherscanSearchResult} />
  }
}

const renderTokenItem = ({ item: coin }: ListRenderItemInfo<CoingeckoSearchCoin>) => (
  <SearchTokenItem coin={coin} />
)

const renderWalletItem = ({ item: wallet }: ListRenderItemInfo<WalletSearchResult>) => (
  <SearchWalletItem wallet={wallet} />
)

function coinKey(coin: CoingeckoSearchCoin) {
  return coin.id
}

function walletKey(wallet: WalletSearchResult) {
  return wallet.address
}
