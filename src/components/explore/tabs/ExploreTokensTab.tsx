import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteTokensGrid } from 'src/components/explore/FavoriteTokensGrid'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem, TokenItemData } from 'src/components/explore/TokenItem'
import { Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { TAB_STYLES } from 'src/components/layout/TabHelpers'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import { useExploreTokensTabQuery } from 'src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput, usePersistedError } from 'src/features/dataApi/utils'
import { useTokensMetadataDisplayType } from 'src/features/explore/hooks'
import { getClientTokensOrderByCompareFn, getTokensOrderByValues } from 'src/features/explore/utils'
import { selectFavoriteTokensSet, selectHasFavoriteTokens } from 'src/features/favorites/selectors'
import { selectTokensOrderBy } from 'src/features/wallet/selectors'
import { ExploreTokensTabLoader } from 'src/screens/ExploreScreen'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

type ExploreTokensTabProps = {
  listRef?: React.MutableRefObject<null>
}

function ExploreTokensTab({ listRef }: ExploreTokensTabProps) {
  const { t } = useTranslation()

  // Top tokens sorting
  const orderBy = useAppSelector(selectTokensOrderBy)
  const [tokensMetadataDisplayType, cycleTokensMetadataDisplayType] = useTokensMetadataDisplayType()
  const { clientOrderBy, serverOrderBy } = getTokensOrderByValues(orderBy)

  // Favorite tokens
  const [isEditing, setIsEditing] = useState(false)
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const hasFavoritedTokens = useAppSelector(selectHasFavoriteTokens)

  // Format favorite tokens for data lookup
  const favoriteCurrencyContractInputs = useMemo(
    () =>
      Array.from(favoriteCurrencyIdsSet).map((currencyId) => currencyIdToContractInput(currencyId)),
    [favoriteCurrencyIdsSet]
  )

  const {
    data,
    networkStatus,
    loading: requestLoading,
    error: requestError,
    refetch,
  } = useExploreTokensTabQuery({
    variables: {
      topTokensOrderBy: serverOrderBy,
      favoriteTokenContracts: favoriteCurrencyContractInputs,
    },
    pollInterval: PollingInterval.Fast,
    returnPartialData: true,
  })

  const topTokenItems = useMemo(() => {
    if (!data || !data.topTokens) return EMPTY_ARRAY

    const topTokens = data.topTokens
      .map((token) => {
        if (!token || !token.project) return null

        const { name, symbol, chain, address, project } = token
        const { logoUrl, markets } = project
        const tokenProjectMarket = markets?.[0]

        const chainId = fromGraphQLChain(chain)

        return {
          chainId,
          address,
          name,
          symbol,
          logoUrl,
          price: tokenProjectMarket?.price?.value,
          marketCap: tokenProjectMarket?.marketCap?.value,
          pricePercentChange24h: tokenProjectMarket?.pricePercentChange24h?.value,
        } as TokenItemData
      })
      .filter(Boolean) as TokenItemData[]

    if (!clientOrderBy) return topTokens

    // Apply client side sort order
    const compareFn = getClientTokensOrderByCompareFn(clientOrderBy)
    return topTokens.sort(compareFn)
  }, [data, clientOrderBy])

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

  const nonPollRequestInFlight = isNonPollingRequestInFlight(networkStatus)
  const hasAllData = !!data?.favoriteTokensData && !!data?.topTokens
  const error = usePersistedError(requestLoading, requestError)

  const onRetry = useCallback(() => {
    refetch()
  }, [refetch])

  if ((!hasAllData && nonPollRequestInFlight) || (error && nonPollRequestInFlight)) {
    return <ExploreTokensTabLoader />
  }

  if (!hasAllData && error) {
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
    <FlatList
      ref={listRef}
      ListHeaderComponent={
        <Flex mt="sm">
          {error ? <BaseCard.InlineErrorState retryButtonLabel="Retry" onRetry={onRetry} /> : null}
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
            <SortButton orderBy={orderBy} />
          </Flex>
        </Flex>
      }
      data={topTokenItems}
      keyExtractor={tokenKey}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={TAB_STYLES.tabContentContainerStandard}
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
