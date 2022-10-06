import { graphql } from 'babel-plugin-relay/macro'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { PreloadedQuery, usePreloadedQuery } from 'react-relay'
import { useAppSelector } from 'src/app/hooks'
import { SortingGroup } from 'src/components/explore/FilterGroup'
import { useOrderByModal } from 'src/components/explore/Modals'
import { PinnedTokensGrid } from 'src/components/explore/PinnedTokensGrid'
import { ExploreTokensTabQuery } from 'src/components/explore/tabs/__generated__/ExploreTokensTabQuery.graphql'
import { TokenItemData, TokenProjectItem } from 'src/components/explore/TokenProjectItem'
import { Flex } from 'src/components/layout'

import { Text } from 'src/components/Text'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useTokenMetadataDisplayType } from 'src/features/explore/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
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
  const { setOrderByModalIsVisible, orderByModal } = useOrderByModal()
  const [tokenMetadataDisplayType, cycleTokenMetadataDisplayType] = useTokenMetadataDisplayType()

  // Editing pinned tokens
  const [isEditing, setIsEditing] = useState(false)

  // TODO: Support client side search (% change).
  const topTokenItems = useMemo(() => {
    if (!data || !data.topTokenProjects) return EMPTY_ARRAY

    return data.topTokenProjects
      .map((tokenProject) => {
        if (!tokenProject) return null

        const { name, logoUrl, tokens, markets } = tokenProject

        // Only use first chain the token is on
        const token = tokens[0]
        const { chain, address, symbol } = token
        const chainId = fromGraphQLChain(chain)

        if (!name || !logoUrl || !symbol || !chainId) return null

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
      .filter(Boolean)
  }, [data])

  // Monitor the pinned tokens
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<TokenItemData>) => {
      // Disable the row if editing and already pinned.
      // Avoid doing this within TokenProjectItem so we can memoize
      // (referencing favorites within item will cause rerenders for each item as we add/remove favorites)
      const { chainId, address } = item
      const _currencyId = address
        ? buildCurrencyId(chainId, address)
        : buildNativeCurrencyId(chainId)
      const disabled = isEditing && favoriteCurrencyIdsSet.has(_currencyId.toLocaleLowerCase())

      return (
        <TokenProjectItem
          disabled={disabled}
          index={index}
          isEditing={isEditing}
          metadataDisplayType={tokenMetadataDisplayType}
          tokenItemData={item}
          onCycleMetadata={cycleTokenMetadataDisplayType}
        />
      )
    },
    [cycleTokenMetadataDisplayType, favoriteCurrencyIdsSet, isEditing, tokenMetadataDisplayType]
  )

  return (
    <FlatList
      ref={listRef}
      ListHeaderComponent={
        <Flex mt="sm">
          <PinnedTokensGrid isEditing={isEditing} setIsEditing={setIsEditing} />
          <Flex row alignItems="center" justifyContent="space-between" mx="sm">
            <Text color="textSecondary" variant="smallLabel">
              {t('Top Tokens')}
            </Text>
            <SortingGroup onPressOrderBy={() => setOrderByModalIsVisible(true)} />
          </Flex>
          {orderByModal}
        </Flex>
      }
      data={topTokenItems}
      keyExtractor={tokenKey}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      windowSize={3}
    />
  )
}

const tokenKey = (token: TokenItemData) => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}

export default React.memo(ExploreTokensTab)
