import { LegendList, LegendListRef } from '@legendapp/list'
import { useScrollToTop } from '@react-navigation/native'
import {
  TokenRankingsResponse,
  TokenRankingsStat,
  TokenStats,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { ALL_NETWORKS_ARG } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { AnimatedRef, useAnimatedRef } from 'react-native-reanimated'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { ExploreScreenParams } from 'src/app/navigation/types'
import { FavoritesSection } from 'src/components/explore/ExploreSections/FavoritesSection'
import { NetworkPills, NetworkPillsProps } from 'src/components/explore/ExploreSections/NetworkPillsRow'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem } from 'src/components/explore/TokenItem'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { getTokenMetadataDisplayType } from 'src/features/explore/utils'
import { Flex, Loader, Text } from 'ui/src'
import { AnimatedBottomSheetFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { spacing } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { useEvent } from 'utilities/src/react/hooks'
import { useInitialLoadingState } from 'utilities/src/react/useInitialLoadingState'
import { selectTokensOrderBy } from 'wallet/src/features/wallet/selectors'
import { setTokensOrderBy } from 'wallet/src/features/wallet/slice'
import { ExploreOrderBy, TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

const TOKEN_ITEM_SIZE = 68
const AMOUNT_TO_DRAW = 18

type TokenItemDataWithMetadata = { tokenItemData: TokenItemData; tokenMetadataDisplayType: TokenMetadataDisplayType }

type ExploreSectionsProps = ExploreScreenParams & {
  listRef: AnimatedRef<FlatList>
  setIsAtTopOnScroll?: (isAtTop: boolean) => void
}

const renderItem = ({
  item: { tokenItemData, tokenMetadataDisplayType },
  index,
}: {
  item: TokenItemDataWithMetadata
  index: number
}): JSX.Element => {
  return (
    <TokenItem
      eventName={MobileEventName.ExploreTokenItemSelected}
      index={index}
      metadataDisplayType={tokenMetadataDisplayType}
      tokenItemData={tokenItemData}
    />
  )
}

function _ExploreSections({
  listRef,
  showFavorites = true,
  orderByMetric,
  chainId,
  setIsAtTopOnScroll,
}: ExploreSectionsProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const dimensions = useWindowDimensions()
  const isBottomTabsEnabled = useFeatureFlag(FeatureFlags.BottomTabs)

  // Top tokens sorting
  const { uiOrderBy, orderBy, onOrderByChange } = useOrderBy()

  // Network filtering
  const [selectedNetwork, setSelectedNetwork] = useState<UniverseChainId | null>(null)

  // Track scroll position for double-tap behavior
  const handleScroll = useEvent((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isBottomTabsEnabled || !setIsAtTopOnScroll) {
      return
    }
    const yOffset = event.nativeEvent.contentOffset.y
    const isAtTop = yOffset <= 0
    setIsAtTopOnScroll(isAtTop)
  })

  // Update selectedNetwork and orderBy when chainId prop changes (e.g., from deep links)
  useEffect(() => {
    setSelectedNetwork(chainId ?? null)
    if (orderByMetric) {
      onOrderByChange(orderByMetric)
    }
  }, [chainId, onOrderByChange, orderByMetric])

  const { data, isLoading, error, refetch, isFetching } = useTokenRankingsQuery({
    chainId: selectedNetwork?.toString() ?? ALL_NETWORKS_ARG,
  })
  const isInitialLoading = useInitialLoadingState(isLoading)

  const topTokenItems = useTokenItems(data, orderBy)

  usePerformanceLogger(DDRumManualTiming.RenderExploreSections, [selectedNetwork, orderBy])

  // Need multiple refs until bottom tabs experiment is complete
  const legendListRef = useRef<LegendListRef>(null)
  const scrollRef = useAnimatedRef<ScrollView>()

  useScrollToTop(listRef)
  useScrollToTop(scrollRef)

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

  const contentContainerStyleWithoutBottomTabs = useMemo(() => {
    return {
      paddingBottom: insets.bottom,
    }
  }, [insets.bottom])

  const contentContainerStyleWithBottomTabs = useMemo(() => {
    return {
      paddingBottom: ESTIMATED_BOTTOM_TABS_HEIGHT + spacing.spacing32 + insets.bottom,
    }
  }, [insets.bottom])

  const dataWithBottomTabs = useMemo(
    () => (showFullScreenLoadingState ? [] : (topTokenItems ?? [])),
    [showFullScreenLoadingState, topTokenItems],
  )

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

  if (isBottomTabsEnabled) {
    return (
      <Flex fill animation="100ms">
        <LegendList
          ref={legendListRef}
          refScrollView={scrollRef}
          ListEmptyComponent={ListEmptyComponent}
          ListHeaderComponent={
            <ListHeaderComponent
              listRef={scrollRef}
              orderBy={uiOrderBy}
              showFavorites={showFavorites}
              showLoading={isInitialLoading}
              selectedNetwork={selectedNetwork}
              onSelectNetwork={onSelectNetwork}
              onOrderByChange={onOrderByChange}
            />
          }
          ListHeaderComponentStyle={styles.foreground}
          contentContainerStyle={contentContainerStyleWithBottomTabs}
          data={dataWithBottomTabs}
          keyExtractor={tokenKey}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          estimatedItemSize={TOKEN_ITEM_SIZE}
          drawDistance={TOKEN_ITEM_SIZE * AMOUNT_TO_DRAW}
          estimatedListSize={dimensions}
          onScroll={handleScroll}
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
            showFavorites={showFavorites}
            showLoading={isInitialLoading}
            selectedNetwork={selectedNetwork}
            onSelectNetwork={onSelectNetwork}
            onOrderByChange={onOrderByChange}
          />
        }
        ListHeaderComponentStyle={styles.foreground}
        contentContainerStyle={contentContainerStyleWithoutBottomTabs}
        data={showFullScreenLoadingState ? undefined : topTokenItems}
        keyExtractor={tokenKey}
        scrollEventThrottle={16}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        estimatedItemSize={TOKEN_ITEM_SIZE}
        drawDistance={TOKEN_ITEM_SIZE * AMOUNT_TO_DRAW}
        estimatedListSize={dimensions}
      />
    </Flex>
  )
}

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

const styles = StyleSheet.create({
  foreground: {
    zIndex: 1,
  },
})

function getTokenMetadataDisplayTypeSafe(orderBy: ExploreOrderBy): TokenMetadataDisplayType | null {
  try {
    return getTokenMetadataDisplayType(orderBy)
  } catch {
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

    const processedTokens = processTokens(rankings.tokens, tokenMetadataDisplayType)

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
  listRef: AnimatedRef<FlatList> | AnimatedRef<ScrollView>
  orderBy: ExploreOrderBy
  showLoading: boolean
  showFavorites: boolean
  onOrderByChange: (orderBy: ExploreOrderBy) => void
}

const ListHeader = memo(function ListHeader({
  listRef,
  orderBy,
  showLoading,
  showFavorites,
  onOrderByChange,
}: ListHeaderProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Sortable.Layer>
      {showFavorites && <FavoritesSection showLoading={showLoading} listRef={listRef} />}
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

const ListHeaderComponent = ({
  listRef,
  onSelectNetwork,
  orderBy,
  selectedNetwork,
  showLoading,
  showFavorites,
  onOrderByChange,
}: ListHeaderProps & NetworkPillsProps): JSX.Element => {
  return (
    <>
      <ListHeader
        listRef={listRef}
        orderBy={orderBy}
        showLoading={showLoading}
        showFavorites={showFavorites}
        onOrderByChange={onOrderByChange}
      />
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

export const ExploreSections = memo(_ExploreSections)
