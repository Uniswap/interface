import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteTokensGrid } from 'src/components/explore/FavoriteTokensGrid'
import { useOrderByModal } from 'src/components/explore/Modals'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem, TokenItemData } from 'src/components/explore/TokenItem'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import {
  MarketSortableField,
  useExploreTokensTabQuery,
} from 'src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput } from 'src/features/dataApi/utils'
import { useTokensMetadataDisplayType } from 'src/features/explore/hooks'
import { getOrderByCompareFn, getOrderByValues } from 'src/features/explore/utils'
import { selectFavoriteTokensSet, selectHasFavoriteTokens } from 'src/features/favorites/selectors'
import { ExploreTokensTabLoader } from 'src/screens/ExploreScreen'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

type ExploreTokensTabProps = {
  listRef?: React.MutableRefObject<null>
}

function ExploreTokensTab({ listRef }: ExploreTokensTabProps) {
  const { t } = useTranslation()

  // Favorite tokens
  const [isEditing, setIsEditing] = useState(false)
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const hasFavoritedTokens = useAppSelector(selectHasFavoriteTokens)

  // format favorite tokens for data lookup
  const favoriteCurrencyContractInputs = useMemo(
    () =>
      Array.from(favoriteCurrencyIdsSet).map((currencyId) => currencyIdToContractInput(currencyId)),
    [favoriteCurrencyIdsSet]
  )

  const {
    data,
    networkStatus,
    error: requestError,
    refetch,
  } = useExploreTokensTabQuery({
    variables: {
      topTokensOrderBy: MarketSortableField.MarketCap,
      favoriteTokenContracts: favoriteCurrencyContractInputs,
    },
    pollInterval: PollingInterval.Fast,
    returnPartialData: true,
  })

  // Sorting and filtering
  const { orderBy, setOrderByModalIsVisible, orderByModal } = useOrderByModal()
  const [tokensMetadataDisplayType, cycleTokensMetadataDisplayType] = useTokensMetadataDisplayType()
  const { localOrderBy } = getOrderByValues(orderBy)

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
      // Avoid doing this within TokenItem so we can memoize
      // (referencing favorites within item will cause rerenders for each item as we add/remove favorites)
      const { chainId, address } = item
      const _currencyId = address
        ? buildCurrencyId(chainId, address)
        : buildNativeCurrencyId(chainId)
      const isFavorited = favoriteCurrencyIdsSet.has(_currencyId.toLocaleLowerCase())

      return (
        <TokenItem
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

  const loading = isNonPollingRequestInFlight(networkStatus)
  const hasAllData = !!data?.favoriteTokensData && !!data.topTokenProjects

  const onRetry = useCallback(() => {
    refetch()
  }, [refetch])

  if (loading) {
    return <ExploreTokensTabLoader />
  }

  if (!hasAllData && requestError) {
    return (
      <Box height="100%" pb="xxxl">
        <BaseCard.ErrorState
          retryButtonLabel={t('Retry')}
          title={t('Couldn’t load tokens')}
          onRetry={onRetry}
        />
      </Box>
    )
  }

  return (
    <>
      <FlatList
        ref={listRef}
        ListHeaderComponent={
          <Flex mt="sm">
            {requestError ? (
              <BaseCard.InlineErrorState retryButtonLabel="Retry" onRetry={onRetry} />
            ) : null}
            {hasFavoritedTokens ? (
              <FavoriteTokensGrid
                favoriteTokensData={data?.favoriteTokensData}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
              />
            ) : null}
            <Flex row alignItems="center" justifyContent="space-between">
              <Text color="textSecondary" variant="subheadSmall">
                {t('Top tokens')}
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
