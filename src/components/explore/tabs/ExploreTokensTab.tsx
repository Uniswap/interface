import { graphql } from 'babel-plugin-relay/macro'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteTokensGrid } from 'src/components/explore/FavoriteTokensGrid'
import { useOrderByModal } from 'src/components/explore/Modals'
import { SortButton } from 'src/components/explore/SortButton'
import { ExploreTokensTabQuery } from 'src/components/explore/tabs/__generated__/ExploreTokensTabQuery.graphql'
import { TokenItemData, TokenProjectItem } from 'src/components/explore/TokenProjectItem'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useTokensMetadataDisplayType } from 'src/features/explore/hooks'
import { getOrderByCompareFn, getOrderByValues } from 'src/features/explore/utils'
import { selectFavoriteTokensSet, selectHasFavoriteTokens } from 'src/features/favorites/selectors'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

export const exploreTokensTabQuery = graphql`
  query ExploreTokensTabQuery($topTokensOrderBy: MarketSortableField!) {
    topTokenProjects(orderBy: $topTokensOrderBy, page: 1, pageSize: 100) {
      name
      logoUrl
      tokens {
        chain
        address
        # HACK: Decimals included so Token Selector's top tokens query can reuse cached data
        decimals
        symbol
      }
      markets(currencies: USD) {
        price {
          currency
          value
        }
        marketCap {
          currency
          value
        }
        pricePercentChange24h {
          currency
          value
        }
      }
    }
  }
`

type ExploreTokensTabProps = {
  queryRef: PreloadedQuery<ExploreTokensTabQuery>
  listRef?: React.MutableRefObject<null>
}

function ExploreTokensTab({ queryRef, listRef }: ExploreTokensTabProps) {
  const { t } = useTranslation()

  const data = usePreloadedQuery<ExploreTokensTabQuery>(exploreTokensTabQuery, queryRef)

  // Sorting and filtering
  const { orderBy, setOrderByModalIsVisible, orderByModal } = useOrderByModal()
  const [tokensMetadataDisplayType, cycleTokensMetadataDisplayType] = useTokensMetadataDisplayType()
  const { localOrderBy } = getOrderByValues(orderBy)

  // Editing favorite tokens
  const [isEditing, setIsEditing] = useState(false)
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const hasFavoritedTokens = useAppSelector(selectHasFavoriteTokens)

  // TODO(spencer): Handle reloading query with remote sort order
  const topTokenItems = useMemo(() => {
    if (!data || !data.topTokenProjects) return EMPTY_ARRAY

    const topTokens = data.topTokenProjects
      .map((tokenProject) => {
        if (!tokenProject) return null

        const { name, logoUrl, tokens, markets } = tokenProject

        // Only use first chain the token is on
        const token = tokens[0]
        const { chain, address, symbol } = token
        const chainId = fromGraphQLChain(chain)

        // Only show tokens on Mainnet
        if (!name || !logoUrl || !symbol || !chainId || chainId !== ChainId.Mainnet) return null

        return {
          chainId,
          address,
          name,
          symbol,
          logoUrl,
          price: markets?.[0]?.price?.value ?? undefined,
          marketCap: markets?.[0]?.marketCap?.value ?? undefined,
          pricePercentChange24h: markets?.[0]?.pricePercentChange24h?.value ?? undefined,
        } as TokenItemData
      })
      .filter(Boolean) as TokenItemData[]

    if (!localOrderBy) return topTokens

    // Apply local sort order
    const compareFn = getOrderByCompareFn(localOrderBy)
    return topTokens.sort(compareFn)
  }, [data, localOrderBy])

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<TokenItemData>) => {
      // Disable the row if editing and already favorited.
      // Avoid doing this within TokenProjectItem so we can memoize
      // (referencing favorites within item will cause rerenders for each item as we add/remove favorites)
      const { chainId, address } = item
      const _currencyId = address
        ? buildCurrencyId(chainId, address)
        : buildNativeCurrencyId(chainId)
      const isFavorited = favoriteCurrencyIdsSet.has(_currencyId.toLocaleLowerCase())

      return (
        <TokenProjectItem
          index={index}
          isEditing={isEditing}
          isFavorited={isFavorited}
          metadataDisplayType={tokensMetadataDisplayType}
          tokenItemData={item}
          onCycleMetadata={cycleTokensMetadataDisplayType}
        />
      )
    },
    [cycleTokensMetadataDisplayType, favoriteCurrencyIdsSet, isEditing, tokensMetadataDisplayType]
  )

  const onPressSortButton = useCallback(
    () => setOrderByModalIsVisible(true),
    [setOrderByModalIsVisible]
  )

  return (
    <>
      <FlatList
        ref={listRef}
        ListHeaderComponent={
          <Flex mt="sm">
            {hasFavoritedTokens ? (
              <FavoriteTokensGrid isEditing={isEditing} setIsEditing={setIsEditing} />
            ) : null}
            <Flex row alignItems="center" justifyContent="space-between" mx="none">
              <Text color="textSecondary" variant="smallLabel">
                {t('Top Tokens')}
              </Text>
              <SortButton orderBy={orderBy} onPress={onPressSortButton} />
            </Flex>
          </Flex>
        }
        data={topTokenItems}
        keyExtractor={tokenKey}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        windowSize={5}
      />
      {orderByModal}
    </>
  )
}

const tokenKey = (token: TokenItemData) => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}

export default React.memo(ExploreTokensTab)
