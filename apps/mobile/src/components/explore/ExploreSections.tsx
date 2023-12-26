import { NetworkStatus } from '@apollo/client'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItem, ListRenderItemInfo } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteTokensGrid } from 'src/components/explore/FavoriteTokensGrid'
import { FavoriteWalletsGrid } from 'src/components/explore/FavoriteWalletsGrid'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem, TokenItemData } from 'src/components/explore/TokenItem'
import { Loader } from 'src/components/loading'
import {
  getClientTokensOrderByCompareFn,
  getTokenMetadataDisplayType,
  getTokensOrderByValues,
} from 'src/features/explore/utils'
import { usePollOnFocusOnly } from 'src/utils/hooks'
import { Flex, Text, useDeviceInsets } from 'ui/src'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { getWrappedNativeAddress } from 'wallet/src/constants/addresses'
import { ChainId } from 'wallet/src/constants/chains'
import { PollingInterval } from 'wallet/src/constants/misc'
import {
  Chain,
  ExploreTokensTabQuery,
  useExploreTokensTabQuery,
} from 'wallet/src/data/__generated__/types-and-hooks'
import { fromGraphQLChain } from 'wallet/src/features/chains/utils'
import { usePersistedError } from 'wallet/src/features/dataApi/utils'
import {
  selectHasFavoriteTokens,
  selectHasWatchedWallets,
} from 'wallet/src/features/favorites/selectors'
import { selectTokensOrderBy } from 'wallet/src/features/wallet/selectors'
import { areAddressesEqual } from 'wallet/src/utils/addresses'
import { buildCurrencyId, buildNativeCurrencyId } from 'wallet/src/utils/currencyId'

type ExploreSectionsProps = {
  listRef?: React.MutableRefObject<null>
}

export function ExploreSections({ listRef }: ExploreSectionsProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useDeviceInsets()

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
    if (!data || !data.topTokens) return

    // special case to replace weth with eth because the backend does not return eth data
    // eth will be defined only if all the required data is available
    // when eth data is not fully available, we do not replace weth with eth
    const { eth } = data
    const wethAddress = getWrappedNativeAddress(ChainId.Mainnet)

    const topTokens = data.topTokens
      .map((token) => {
        if (!token) return

        const isWeth =
          areAddressesEqual(token.address, wethAddress) && token?.chain === Chain.Ethereum

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

  const onRetry = useCallback(async () => {
    await refetch()
  }, [refetch])

  // Use showLoading for showing full screen loading state
  // Used in each section to ensure loading state layout matches loaded state
  const showLoading = (!hasAllData && isLoading) || (!!error && isLoading)

  if (!hasAllData && error) {
    return (
      <Flex height="100%" pb="$spacing60">
        <BaseCard.ErrorState
          retryButtonLabel={t('Retry')}
          title={t('Couldn’t load tokens')}
          onRetry={onRetry}
        />
      </Flex>
    )
  }

  return (
    <BottomSheetFlatList
      ref={listRef}
      ListEmptyComponent={
        <Flex mx="$spacing24" my="$spacing12">
          <Loader.Token repeat={5} />
        </Flex>
      }
      ListHeaderComponent={
        <>
          <FavoritesSection showLoading={showLoading} />
          <Flex
            row
            alignItems="center"
            justifyContent="space-between"
            mb="$spacing8"
            ml="$spacing16"
            mr="$spacing12"
            mt="$spacing16"
            pl="$spacing4">
            <Text color="$neutral2" variant="subheading2">
              {t('Top tokens')}
            </Text>
            <SortButton orderBy={orderBy} />
          </Flex>
        </>
      }
      contentContainerStyle={{ paddingBottom: insets.bottom }}
      data={showLoading ? undefined : topTokenItems}
      keyExtractor={tokenKey}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
    />
  )
}

const tokenKey = (token: TokenItemData): string => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}

function gqlTokenToTokenItemData(
  token: Maybe<NonNullable<NonNullable<ExploreTokensTabQuery['topTokens']>[0]>>
): TokenItemData | null {
  if (!token || !token.project) return null

  const { symbol, address, chain, project, market } = token
  const { logoUrl, markets, name } = project
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
    <Flex bg="$transparent" gap="$spacing12" pb="$spacing12" pt="$spacing8" px="$spacing12">
      {hasFavoritedTokens && <FavoriteTokensGrid showLoading={showLoading} />}
      {hasFavoritedWallets && <FavoriteWalletsGrid showLoading={showLoading} />}
    </Flex>
  )
}
