import { graphql } from 'babel-plugin-relay/macro'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useFragment } from 'react-relay-offline'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { SearchEmptySection_popularTokens$key } from 'src/components/explore/search/__generated__/SearchEmptySection_popularTokens.graphql'
import { CloseIcon } from 'src/components/icons/CloseIcon'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Text } from 'src/components/Text'
import {
  clearSearchHistory,
  EtherscanSearchResult,
  SearchResult,
  SearchResultType,
  selectSearchHistory,
  TokenSearchResult,
  WalletSearchResult,
} from 'src/features/explore/searchHistorySlice'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

// TODO: Update fixed trending wallets
export const TRENDING_WALLETS: WalletSearchResult[] = [
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

const searchEmptySectionTopTokensFragment = graphql`
  fragment SearchEmptySection_popularTokens on TokenProject @relay(plural: true) {
    logoUrl
    tokens {
      chain
      address
      name
      symbol
    }
  }
`

type SearchEmptySectionProps = {
  popularTokens: SearchEmptySection_popularTokens$key | null
}

export function SearchEmptySection({ popularTokens }: SearchEmptySectionProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const searchHistory = useAppSelector(selectSearchHistory)
  // Load popular tokens by top trading volume
  const popularTokensData = useFragment(searchEmptySectionTopTokensFragment, popularTokens ?? [])

  const popularTokenResults = useMemo(() => {
    return popularTokensData
      .map((tokenProject) => {
        if (!tokenProject) return null

        // Only use first chain the token is on
        const token = tokenProject.tokens[0]
        const { chain, address, symbol, name } = token
        const chainId = fromGraphQLChain(chain)

        if (!chainId || !symbol || !name) return null

        return {
          type: SearchResultType.Token,
          chainId,
          address,
          name,
          symbol,
          logoUrl: tokenProject.logoUrl,
        } as TokenSearchResult
      })
      .filter(Boolean) as TokenSearchResult[]
  }, [popularTokensData])

  const onPressClearSearchHistory = () => {
    dispatch(clearSearchHistory())
  }

  // Show search history (if applicable), trending tokens, and wallets
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="sm">
      {searchHistory.length > 0 && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
          <FlatList
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
      {popularTokenResults.length > 0 && (
        <FlatList
          ItemSeparatorComponent={() => <Separator mx="xs" />}
          ListHeaderComponent={
            <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
              {t('Popular Tokens')}
            </Text>
          }
          data={popularTokenResults}
          keyExtractor={tokenKey}
          listKey="tokens"
          renderItem={renderTokenItem}
        />
      )}
      <FlatList
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
    return <SearchTokenItem token={searchResult as TokenSearchResult} />
  } else if (searchResult.type === SearchResultType.Wallet) {
    return <SearchWalletItem wallet={searchResult as WalletSearchResult} />
  } else {
    return <SearchEtherscanItem etherscanResult={searchResult as EtherscanSearchResult} />
  }
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>) => (
  <SearchTokenItem token={item} />
)

const renderWalletItem = ({ item }: ListRenderItemInfo<WalletSearchResult>) => (
  <SearchWalletItem wallet={item} />
)

const tokenKey = (token: TokenSearchResult) => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}

const walletKey = (wallet: WalletSearchResult) => {
  return wallet.address
}
