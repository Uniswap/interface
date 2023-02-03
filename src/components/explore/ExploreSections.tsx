import { NetworkStatus } from '@apollo/client'
import { FlashList, ListRenderItem, ListRenderItemInfo } from '@shopify/flash-list'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import { FavoriteTokensGrid } from 'src/components/explore/FavoriteTokensGrid'
import { FavoriteWalletsGrid } from 'src/components/explore/FavoriteWalletsGrid'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem, TokenItemData } from 'src/components/explore/TokenItem'
import { Box, Flex, Inset } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { VirtualizedList } from 'src/components/layout/VirtualizedList'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY, PollingInterval } from 'src/constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from 'src/constants/tokens'
import {
  Chain,
  ExploreTokensTabQuery,
  useExploreTokensTabQuery,
} from 'src/data/__generated__/types-and-hooks'
import { usePersistedError } from 'src/features/dataApi/utils'
import {
  getClientTokensOrderByCompareFn,
  getTokenMetadataDisplayType,
  getTokensOrderByValues,
} from 'src/features/explore/utils'
import { selectHasFavoriteTokens, selectHasWatchedWallets } from 'src/features/favorites/selectors'
import { selectTokensOrderBy } from 'src/features/wallet/selectors'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'
import { areAddressesEqual } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'
import { usePollOnFocusOnly } from 'src/utils/hooks'

type ExploreSectionsProps = {
  listRef?: React.MutableRefObject<null>
}

const ESTIMATED_TOKEN_ITEM_SIZE = 82 // provided from FlashList

export function ExploreSections({ listRef }: ExploreSectionsProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppTheme()

  // Top tokens sorting
  const orderBy = useAppSelector(selectTokensOrderBy)
  const tokenMetadataDisplayType = getTokenMetadataDisplayType(orderBy)
  const { clientOrderBy, serverOrderBy } = getTokensOrderByValues(orderBy)

  const {
    data,
    networkStatus,
    loading: requestLoading,
    error: requestError,
    refetch,
    startPolling,
    stopPolling,
  } = useExploreTokensTabQuery({
    variables: {
      topTokensOrderBy: serverOrderBy,
    },
    returnPartialData: true,
  })

  usePollOnFocusOnly(startPolling, stopPolling, PollingInterval.Fast)

  const topTokenItems = useMemo(() => {
    if (!data || !data.topTokens) return EMPTY_ARRAY

    // special case to replace weth with eth because the backend does not return eth data
    // eth will be defined only if all the required data is available
    // when eth data is not fully available, we do not replace weth with eth
    const { eth } = data
    const weth = WRAPPED_NATIVE_CURRENCY[ChainId.Mainnet]

    const topTokens = data.topTokens
      .map((token) => {
        if (!token) return

        const isWeth =
          areAddressesEqual(token.address, weth.address) && token?.chain === Chain.Ethereum

        // manually replace weth with eth given backend only returns eth data as a proxy for eth
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

  const renderItem: ListRenderItem<TokenItemData> = useCallback(
    ({ item, index }: ListRenderItemInfo<TokenItemData>) => {
      return (
        <TokenItem
          index={index}
          metadataDisplayType={tokenMetadataDisplayType}
          tokenItemData={item}
        />
      )
    },
    [tokenMetadataDisplayType]
  )

  // Don't want to show full screen loading state when changing tokens sort, which triggers NetworkStatus.setVariable request
  const isLoading =
    networkStatus === NetworkStatus.loading || networkStatus === NetworkStatus.refetch
  const hasAllData = !!data?.topTokens
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
    <VirtualizedList
      ref={listRef}
      contentContainerStyle={{ ...flex.grow, backgroundColor: theme.colors.background0 }}
      style={flex.fill}>
      <FavoritesSection showLoading={showLoading} />
      <FlashList
        ListEmptyComponent={
          <Box mx="lg" my="sm">
            <Loader.Token repeat={5} />
          </Box>
        }
        ListFooterComponent={<Inset all="sm" />}
        ListHeaderComponent={
          <Flex
            row
            alignItems="center"
            justifyContent="space-between"
            mb="xs"
            ml="md"
            mr="sm"
            mt="md"
            pl="xxs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('Top tokens')}
            </Text>
            <SortButton orderBy={orderBy} />
          </Flex>
        }
        data={showLoading ? EMPTY_ARRAY : topTokenItems}
        estimatedItemSize={ESTIMATED_TOKEN_ITEM_SIZE}
        estimatedListSize={{
          width: dimensions.fullWidth,
          height: dimensions.fullHeight,
        }}
        keyExtractor={tokenKey}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </VirtualizedList>
  )
}

const tokenKey = (token: TokenItemData): string => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}

function gqlTokenToTokenItemData(
  token: NullUndefined<NonNullable<NonNullable<ExploreTokensTabQuery['topTokens']>[0]>>
): TokenItemData | null {
  if (!token || !token.project) return null

  const { name, symbol, address, chain, project, market } = token
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
    volume24h: market?.volume?.value,
    totalValueLocked: market?.totalValueLocked?.value,
  } as TokenItemData
}

function FavoritesSection({ showLoading }: { showLoading: boolean }): JSX.Element | null {
  const hasFavoritedTokens = useAppSelector(selectHasFavoriteTokens)
  const hasFavoritedWallets = useAppSelector(selectHasWatchedWallets)

  if (!hasFavoritedTokens && !hasFavoritedWallets) return null

  return (
    <Flex bg="backgroundBranded" gap="md" pb="md" pt="xs" px="sm">
      {hasFavoritedTokens && <FavoriteTokensGrid showLoading={showLoading} />}
      {hasFavoritedWallets && <FavoriteWalletsGrid showLoading={showLoading} />}
    </Flex>
  )
}
