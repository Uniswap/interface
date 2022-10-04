import { graphql } from 'babel-plugin-relay/macro'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { OfflineLoadQuery, usePreloadedQuery } from 'react-relay-offline'
import { SortingGroup } from 'src/components/explore/FilterGroup'
import { useOrderByModal } from 'src/components/explore/Modals'
import { PinnedTokensGrid } from 'src/components/explore/PinnedTokensGrid'
import { ExploreTokensTabQuery } from 'src/components/explore/tabs/__generated__/ExploreTokensTabQuery.graphql'
import { TokenItemData, TokenProjectItem } from 'src/components/explore/TokenProjectItem'
import { Flex } from 'src/components/layout'

import { Text } from 'src/components/Text'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useTokenMetadataDisplayType } from 'src/features/explore/hooks'
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
  queryRef: OfflineLoadQuery
  listRef?: React.MutableRefObject<null>
}

function ExploreTokensTab({ queryRef, listRef }: ExploreTokensTabProps) {
  const { t } = useTranslation()

  const { data } = usePreloadedQuery<ExploreTokensTabQuery>(queryRef)

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

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<TokenItemData>) => (
      <TokenProjectItem
        index={index}
        metadataDisplayType={tokenMetadataDisplayType}
        tokenItemData={item}
        onCycleMetadata={cycleTokenMetadataDisplayType}
      />
    ),
    [cycleTokenMetadataDisplayType, tokenMetadataDisplayType]
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
      windowSize={5}
    />
  )
}

const tokenKey = (token: TokenItemData) => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}

export default React.memo(ExploreTokensTab)
