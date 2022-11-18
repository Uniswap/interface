import { NetworkStatus } from '@apollo/client'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteTokensGrid } from 'src/components/explore/FavoriteTokensGrid'
import { FavoriteWalletsGrid } from 'src/components/explore/FavoriteWalletsGrid'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem, TokenItemData } from 'src/components/explore/TokenItem'
import { Box, Flex, Inset } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import {
  Chain,
  ExploreTokensTabQuery,
  useExploreTokensTabQuery,
} from 'src/data/__generated__/types-and-hooks'
import { currencyIdToContractInput, usePersistedError } from 'src/features/dataApi/utils'
import { useTokensMetadataDisplayType } from 'src/features/explore/hooks'
import { getClientTokensOrderByCompareFn, getTokensOrderByValues } from 'src/features/explore/utils'
import {
  selectFavoriteTokensSet,
  selectHasFavoriteTokens,
  selectHasWatchedWallets,
} from 'src/features/favorites/selectors'
import { selectTokensOrderBy } from 'src/features/wallet/selectors'
import { flex } from 'src/styles/flex'
import { areAddressesEqual } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

type ExploreSectionsProps = {
  listRef?: React.MutableRefObject<null>
}

export function ExploreSections({ listRef }: ExploreSectionsProps) {
  const { t } = useTranslation()

  // Top tokens sorting
  const orderBy = useAppSelector(selectTokensOrderBy)
  const [tokensMetadataDisplayType, cycleTokensMetadataDisplayType] = useTokensMetadataDisplayType()
  const { clientOrderBy, serverOrderBy } = getTokensOrderByValues(orderBy)

  // Favorite tokens
  const [isEditingTokens, setIsEditingTokens] = useState(false)
  const favoriteCurrencyIdsSet = useAppSelector(selectFavoriteTokensSet)
  const hasFavoritedTokens = useAppSelector(selectHasFavoriteTokens)

  // Favorite wallets
  const [isEditingWallets, setIsEditingWallets] = useState(false)
  const hasFavoritedWallets = useAppSelector(selectHasWatchedWallets)

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

    // special case to replace weth with eth because the backend does not return eth data
    // eth will be defined only if all the required data is available
    // when eth data is not fully available, we do not replace weth with eth
    const eth = data?.eth && data?.eth.length > 0 && data?.eth?.[0]?.project ? data.eth[0] : null
    const weth = WRAPPED_NATIVE_CURRENCY[ChainId.Mainnet]

    const topTokens = data.topTokens
      .map((token) => {
        if (!token) return

        const isWeth =
          areAddressesEqual(token.address, weth.address) && token?.chain === Chain.Ethereum

        // manually replace eth with eth given backend only returns eth data as a proxy for eth
        // sorting should be maintained given we replace
        if (isWeth && eth) {
          return gqlTokenToTokenItemData(eth)
        }

        return gqlTokenToTokenItemData(token)
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
          isEditing={isEditingTokens}
          isFavorited={isFavorited}
          metadataDisplayType={tokensMetadataDisplayType}
          tokenItemData={item}
          onCycleMetadata={cycleTokensMetadataDisplayType}
        />
      )
    },
    [
      cycleTokensMetadataDisplayType,
      favoriteCurrencyIdsSet,
      isEditingTokens,
      tokensMetadataDisplayType,
    ]
  )

  // Don't want to show full screen loading state when changing tokens sort, which triggers NetworkStatus.setVariable request
  const isLoading =
    networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.refetch
  const hasAllData = !!data?.favoriteTokens && !!data?.topTokens
  const error = usePersistedError(requestLoading, requestError)

  const onRetry = useCallback(() => {
    refetch()
  }, [refetch])

  // Use showLoading for showing full screen loading state
  // Used in each section to ensure loading state layout matches loaded state
  const showLoading = (!hasAllData && isLoading) || (!!error && isLoading)

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
    <VirtualizedList style={flex.fill}>
      {hasFavoritedTokens || hasFavoritedWallets ? (
        <Flex gap="md" mb="md" mt="xs" mx="sm">
          {hasFavoritedTokens ? (
            <FavoriteTokensGrid
              favoriteTokensData={data?.favoriteTokens}
              isEditing={isEditingTokens}
              setIsEditing={setIsEditingTokens}
              showLoading={showLoading}
            />
          ) : null}
          {hasFavoritedWallets ? (
            <FavoriteWalletsGrid
              isEditing={isEditingWallets}
              setIsEditing={setIsEditingWallets}
              showLoading={showLoading}
            />
          ) : null}
        </Flex>
      ) : null}
      <Box bg="background0">
        <FlatList
          ref={listRef}
          ListEmptyComponent={
            <Box mx="lg" my="sm">
              <Loading repeat={5} type="token" />
            </Box>
          }
          ListFooterComponent={<Inset all="sm" />}
          ListHeaderComponent={
            <Flex
              row
              alignItems="center"
              justifyContent="space-between"
              mb="xs"
              ml="xmd"
              mr="sm"
              mt="md">
              <Text color="textSecondary" variant="subheadSmall">
                {t('Top tokens')}
              </Text>
              <SortButton orderBy={orderBy} />
            </Flex>
          }
          data={showLoading ? EMPTY_ARRAY : topTokenItems}
          keyExtractor={tokenKey}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          windowSize={5}
        />
      </Box>
    </VirtualizedList>
  )
}

const tokenKey = (token: TokenItemData) => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}

function gqlTokenToTokenItemData(
  token: NullUndefined<NonNullable<NonNullable<ExploreTokensTabQuery['topTokens']>[0]>>
) {
  if (!token || !token.project) return null

  const { name, symbol, address, chain, project } = token
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
}
