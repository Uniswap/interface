import {
  TokenRankingsResponse,
  TokenRankingsStat,
  TokenStats,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItem, ListRenderItemInfo, StyleSheet, useWindowDimensions } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { AnimatedRef } from 'react-native-reanimated'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { FavoriteTokensGrid } from 'src/components/explore/FavoriteTokensGrid'
import { FavoriteWalletsGrid } from 'src/components/explore/FavoriteWalletsGrid'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem } from 'src/components/explore/TokenItem'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { getTokenMetadataDisplayType } from 'src/features/explore/utils'
import { Flex, Loader, Text, TouchableArea, useSporeColors } from 'ui/src'
import { AnimatedBottomSheetFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { iconSizes, spacing } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkPill } from 'uniswap/src/components/network/NetworkPill'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { selectHasFavoriteTokens, selectHasWatchedWallets } from 'uniswap/src/features/favorites/selectors'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { useInitialLoadingState } from 'utilities/src/react/useInitialLoadingState'
import { selectTokensOrderBy } from 'wallet/src/features/wallet/selectors'
import { setTokensOrderBy } from 'wallet/src/features/wallet/slice'
import { ExploreOrderBy, TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

const TOKEN_ITEM_SIZE = 68
const AMOUNT_TO_DRAW = 18

type ExploreSectionsProps = {
  listRef: AnimatedRef<FlatList>
}

type TokenItemDataWithMetadata = { tokenItemData: TokenItemData; tokenMetadataDisplayType: TokenMetadataDisplayType }

export function ExploreSections({ listRef }: ExploreSectionsProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const dimensions = useWindowDimensions()
  // Top tokens sorting
  const { uiOrderBy, orderBy, onOrderByChange } = useOrderBy()

  // Network filtering
  const [selectedNetwork, setSelectedNetwork] = useState<UniverseChainId | null>(null)

  const { data, isLoading, error, refetch, isFetching } = useTokenRankingsQuery({
    chainId: selectedNetwork?.toString() ?? ALL_NETWORKS_ARG,
  })
  const isInitialLoading = useInitialLoadingState(isLoading)

  const topTokenItems = useTokenItems(data, orderBy)

  usePerformanceLogger(DDRumManualTiming.RenderExploreSections, [selectedNetwork, orderBy])

  const renderItem: ListRenderItem<TokenItemDataWithMetadata> = useCallback(
    ({ item: { tokenItemData, tokenMetadataDisplayType }, index }: ListRenderItemInfo<TokenItemDataWithMetadata>) => {
      return (
        <TokenItem
          eventName={MobileEventName.ExploreTokenItemSelected}
          index={index}
          metadataDisplayType={tokenMetadataDisplayType}
          tokenItemData={tokenItemData}
        />
      )
    },
    [],
  )

  const onRetry = useCallback(async () => {
    await refetch()
  }, [refetch])

  const onSelectNetwork = useCallback((network: UniverseChainId | null) => {
    sendAnalyticsEvent(MobileEventName.ExploreNetworkSelected, {
      networkChainId: network ?? 'all',
    })
    setSelectedNetwork(network)
  }, [])

  const hasAllData = !!data
  const isLoadingOrFetching = isLoading || isFetching
  const showFullScreenLoadingState = (!hasAllData && isLoadingOrFetching) || (!!error && isLoadingOrFetching)

  if (!hasAllData && error) {
    return (
      <Flex height="100%" pb="$spacing60">
        <BaseCard.ErrorState
          retryButtonLabel={t('common.button.retry')}
          title={t('explore.tokens.error')}
          onRetry={onRetry}
        />
      </Flex>
    )
  }

  return (
    <Flex fill animation="100ms">
      <AnimatedBottomSheetFlashList
        ref={listRef}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={
          <ListHeaderComponent
            listRef={listRef}
            orderBy={uiOrderBy}
            showLoading={isInitialLoading}
            selectedNetwork={selectedNetwork}
            onSelectNetwork={onSelectNetwork}
            onOrderByChange={onOrderByChange}
          />
        }
        ListHeaderComponentStyle={styles.foreground}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        data={showFullScreenLoadingState ? undefined : topTokenItems}
        keyExtractor={tokenKey}
        renderItem={renderItem}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={TOKEN_ITEM_SIZE}
        drawDistance={TOKEN_ITEM_SIZE * AMOUNT_TO_DRAW}
        estimatedListSize={dimensions}
      />
    </Flex>
  )
}

const NetworkPillsRow = React.memo(function NetworkPillsRow({
  selectedNetwork,
  onSelectNetwork,
}: {
  selectedNetwork: UniverseChainId | null
  onSelectNetwork: (chainId: UniverseChainId | null) => void
}): JSX.Element {
  const colors = useSporeColors()
  const { chains } = useEnabledChains()

  const renderItem = useCallback(
    ({ item }: { item: UniverseChainId }) => {
      return (
        <TouchableArea onPress={() => onSelectNetwork(item)}>
          <NetworkPill
            key={item}
            showIcon
            backgroundColor={selectedNetwork === item ? '$surface3' : '$surface1'}
            borderColor="$surface3"
            borderRadius="$rounded12"
            chainId={item}
            foregroundColor={colors.neutral1.val}
            iconSize={iconSizes.icon24}
            pl="$spacing4"
            pr="$spacing12"
            py="$spacing4"
            showBackgroundColor={false}
            textVariant="buttonLabel3"
          />
        </TouchableArea>
      )
    },
    [colors.neutral1.val, onSelectNetwork, selectedNetwork],
  )

  return (
    <Flex py="$spacing8">
      <FlatList
        horizontal
        ListHeaderComponent={
          <AllNetworksPill selected={selectedNetwork === null} onPress={() => onSelectNetwork(null)} />
        }
        data={chains}
        keyExtractor={(chainId: UniverseChainId) => chainId.toString()}
        contentContainerStyle={{ alignItems: 'center', gap: spacing.spacing8, paddingHorizontal: spacing.spacing8 }}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </Flex>
  )
})

const AllNetworksPill = React.memo(function AllNetworksPill({
  onPress,
  selected,
}: {
  onPress: () => void
  selected: boolean
}): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      centered
      row
      ml="$spacing8"
      backgroundColor={selected ? '$surface3' : '$surface1'}
      borderColor="$surface3"
      borderRadius="$rounded12"
      borderWidth="$spacing1"
      gap="$spacing8"
      pl="$spacing4"
      pr="$spacing12"
      py="$spacing4"
      onPress={onPress}
    >
      <NetworkLogo chainId={null} size={iconSizes.icon24} />
      <Text variant="buttonLabel3">{t('common.all')}</Text>
    </Flex>
  )
})

const tokenKey = (token: TokenItemDataWithMetadata, index: number): string => {
  return `${
    token.tokenItemData.address
      ? buildCurrencyId(token.tokenItemData.chainId, token.tokenItemData.address)
      : buildNativeCurrencyId(token.tokenItemData.chainId)
  }-${index}`
}

function tokenRankingStatsToTokenItemData(tokenRankingStat: TokenRankingsStat): TokenItemData | null {
  const formattedChain = fromGraphQLChain(tokenRankingStat.chain)

  if (!formattedChain) {
    return null
  }

  return {
    name: tokenRankingStat.name ?? '',
    logoUrl: tokenRankingStat.logo ?? '',
    chainId: formattedChain,
    address: tokenRankingStat.address,
    symbol: tokenRankingStat.symbol ?? '',
    price: tokenRankingStat.price?.value,
    marketCap: tokenRankingStat.fullyDilutedValuation?.value,
    pricePercentChange24h: tokenRankingStat.pricePercentChange1Day?.value,
    volume24h: tokenRankingStat.volume1Day?.value,
    totalValueLocked: tokenRankingStat.totalValueLocked?.value,
  }
}

type FavoritesSectionProps = {
  showLoading: boolean
  listRef: AnimatedRef<FlatList>
}

function FavoritesSection(props: FavoritesSectionProps): JSX.Element | null {
  const hasFavoritedTokens = useSelector(selectHasFavoriteTokens)
  const hasFavoritedWallets = useSelector(selectHasWatchedWallets)

  if (!hasFavoritedTokens && !hasFavoritedWallets) {
    return null
  }

  return (
    <Flex gap="$spacing12" pb="$spacing12" px="$spacing12" zIndex={1}>
      {hasFavoritedTokens && <FavoriteTokensGrid {...props} />}
      {hasFavoritedWallets && <FavoriteWalletsGrid {...props} />}
    </Flex>
  )
}

const styles = StyleSheet.create({
  foreground: {
    zIndex: 1,
  },
})

function getTokenMetadataDisplayTypeSafe(orderBy: ExploreOrderBy): TokenMetadataDisplayType | null {
  try {
    return getTokenMetadataDisplayType(orderBy)
  } catch (e) {
    return null
  }
}

function processTokens(
  tokens: TokenStats[],
  tokenMetadataDisplayType: TokenMetadataDisplayType,
): TokenItemDataWithMetadata[] {
  const validTokens = tokens.filter(Boolean)
  const processedTokens: TokenItemDataWithMetadata[] = []

  for (const token of validTokens) {
    const tokenItemData = tokenRankingStatsToTokenItemData(token)
    if (tokenItemData) {
      processedTokens.push({ tokenItemData, tokenMetadataDisplayType })
    }
  }

  return processedTokens
}

function processTokenRankings(
  tokenRankings: TokenRankingsResponse['tokenRankings'] | undefined,
): Record<ExploreOrderBy, TokenItemDataWithMetadata[]> {
  if (!tokenRankings) {
    return {} as Record<ExploreOrderBy, TokenItemDataWithMetadata[]>
  }

  const result: Record<string, TokenItemDataWithMetadata[]> = {}

  for (const [orderByKey, rankings] of Object.entries(tokenRankings)) {
    const tokenMetadataDisplayType = getTokenMetadataDisplayTypeSafe(orderByKey as ExploreOrderBy)
    if (tokenMetadataDisplayType === null) {
      continue
    }

    const tokens = rankings?.tokens ?? []
    const processedTokens = processTokens(tokens, tokenMetadataDisplayType)

    if (processedTokens.length > 0) {
      result[orderByKey] = processedTokens
    }
  }

  return result
}

function useTokenItems(
  data: TokenRankingsResponse | undefined,
  orderBy: ExploreOrderBy,
): TokenItemDataWithMetadata[] | undefined {
  // process all the token rankings into a map of orderBy to token items (only do this once)
  const allTokenItemsByOrderBy = useMemo(() => processTokenRankings(data?.tokenRankings), [data])
  // return the token items for the given orderBy
  return useMemo(() => allTokenItemsByOrderBy[orderBy], [allTokenItemsByOrderBy, orderBy])
}

type ListHeaderProps = {
  listRef: AnimatedRef<FlatList>
  orderBy: ExploreOrderBy
  showLoading: boolean
  onOrderByChange: (orderBy: ExploreOrderBy) => void
}

const ListHeader = React.memo(function ListHeader({
  listRef,
  orderBy,
  showLoading,
  onOrderByChange,
}: ListHeaderProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Sortable.Layer>
      <FavoritesSection showLoading={showLoading} listRef={listRef} />
      <Flex row alignItems="center" justifyContent="space-between" px="$spacing20">
        <Text color="$neutral2" flexShrink={0} paddingEnd="$spacing8" variant="subheading1">
          {t('explore.tokens.top.title')}
        </Text>
        <Flex flexShrink={1}>
          <SortButton orderBy={orderBy} onOrderByChange={onOrderByChange} />
        </Flex>
      </Flex>
    </Sortable.Layer>
  )
})

type NetworkPillsProps = {
  selectedNetwork: UniverseChainId | null
  onSelectNetwork: (chainId: UniverseChainId | null) => void
}

const NetworkPills = React.memo(function NetworkPills({ selectedNetwork, onSelectNetwork }: NetworkPillsProps) {
  const handleOnSelectNetwork = useCallback(
    (network: UniverseChainId | null) => {
      setImmediate(() => onSelectNetwork(network))
    },
    [onSelectNetwork],
  )

  return <NetworkPillsRow selectedNetwork={selectedNetwork} onSelectNetwork={handleOnSelectNetwork} />
})

const ListHeaderComponent = ({
  listRef,
  onSelectNetwork,
  orderBy,
  selectedNetwork,
  showLoading,
  onOrderByChange,
}: ListHeaderProps & NetworkPillsProps): JSX.Element => {
  return (
    <>
      <ListHeader listRef={listRef} orderBy={orderBy} showLoading={showLoading} onOrderByChange={onOrderByChange} />
      <NetworkPills selectedNetwork={selectedNetwork} onSelectNetwork={onSelectNetwork} />
    </>
  )
}

const ListEmptyComponent = (): JSX.Element => (
  <Flex mx="$spacing24" my="$spacing12">
    <Loader.Token repeat={5} />
  </Flex>
)

function useOrderBy(): {
  uiOrderBy: ExploreOrderBy
  orderBy: ExploreOrderBy
  onOrderByChange: (orderBy: ExploreOrderBy) => void
} {
  const dispatch = useDispatch()
  const orderBy = useSelector(selectTokensOrderBy)

  // local state for immediate UI feedback
  const [uiOrderBy, setUiOrderBy] = useState<ExploreOrderBy>(orderBy)

  // When Redux orderBy changes, sync UI
  useEffect(() => {
    setUiOrderBy(orderBy)
  }, [orderBy])

  const onOrderByChange = useCallback(
    (newTokensOrderBy: ExploreOrderBy) => {
      setUiOrderBy(newTokensOrderBy)
      requestAnimationFrame(() => {
        dispatch(setTokensOrderBy({ newTokensOrderBy }))
      })
    },
    [dispatch],
  )

  return { uiOrderBy, orderBy, onOrderByChange }
}
