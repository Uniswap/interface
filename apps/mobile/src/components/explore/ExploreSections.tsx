import { TokenStats } from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItem, ListRenderItemInfo, StyleSheet } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { FavoriteTokensGrid } from 'src/components/explore/FavoriteTokensGrid'
import { FavoriteWalletsGrid } from 'src/components/explore/FavoriteWalletsGrid'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem } from 'src/components/explore/TokenItem'
import { TokenItemData } from 'src/components/explore/TokenItemData'
import { AnimatedBottomSheetFlatList } from 'src/components/layout/AnimatedFlatList'
import { AutoScrollProps } from 'src/components/sortableGrid/types'
import { getTokenMetadataDisplayType } from 'src/features/explore/utils'
import { Flex, Loader, Text, TouchableArea, useSporeColors } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NetworkPill } from 'uniswap/src/components/network/NetworkPill'
import { ALL_NETWORKS_ARG } from 'uniswap/src/data/rest/base'
import { useTokenRankingsQuery } from 'uniswap/src/data/rest/tokenRankings'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { selectHasFavoriteTokens, selectHasWatchedWallets } from 'uniswap/src/features/favorites/selectors'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId, buildNativeCurrencyId } from 'uniswap/src/utils/currencyId'
import { selectTokensOrderBy } from 'wallet/src/features/wallet/selectors'
import { TokenMetadataDisplayType } from 'wallet/src/features/wallet/types'

type ExploreSectionsProps = {
  listRef: React.MutableRefObject<null>
}

type TokenItemDataWithMetadata = { tokenItemData: TokenItemData; tokenMetadataDisplayType: TokenMetadataDisplayType }

export function ExploreSections({ listRef }: ExploreSectionsProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const scrollY = useSharedValue(0)
  const visibleListHeight = useSharedValue(0)

  // Top tokens sorting
  const orderBy = useSelector(selectTokensOrderBy)

  // Network filtering
  const [selectedNetwork, setSelectedNetwork] = useState<UniverseChainId | null>(null)

  const { data, isLoading, error, refetch, isFetching } = useTokenRankingsQuery({
    chainId: selectedNetwork?.toString() ?? ALL_NETWORKS_ARG,
  })

  const [topTokenItems, setTopTokenItems] = useState<TokenItemDataWithMetadata[] | undefined>(undefined)
  useEffect(() => {
    if (!data?.tokenRankings?.[orderBy]) {
      setTopTokenItems(undefined)
      return
    }

    const tokenMetadataDisplayType = getTokenMetadataDisplayType(orderBy)
    const topTokens: TokenItemDataWithMetadata[] | undefined = data.tokenRankings[orderBy]?.tokens?.reduce(
      (acc: TokenItemDataWithMetadata[], tokenStat) => {
        if (tokenStat) {
          const tokenItemData = tokenStatsToTokenItemData(tokenStat)
          if (tokenItemData) {
            acc.push({ tokenItemData, tokenMetadataDisplayType })
          }
        }
        return acc
      },
      [],
    )

    setTopTokenItems(topTokens)
  }, [orderBy, data])

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

  const scrollHandler = useAnimatedScrollHandler((e) => (scrollY.value = e.contentOffset.y), [scrollY])

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
    // Pass onLayout callback to the list wrapper component as it returned
    // incorrect values when it was passed to the list itself
    <Flex
      fill
      onLayout={({
        nativeEvent: {
          layout: { height },
        },
      }): void => {
        visibleListHeight.value = height
      }}
    >
      <AnimatedBottomSheetFlatList
        ref={listRef}
        ListEmptyComponent={
          <Flex mx="$spacing24" my="$spacing12">
            <Loader.Token repeat={5} />
          </Flex>
        }
        ListHeaderComponent={
          <Flex>
            <FavoritesSection
              showLoading={false}
              scrollY={scrollY}
              scrollableRef={listRef}
              visibleHeight={visibleListHeight}
            />
            <Flex row alignItems="center" justifyContent="space-between" px="$spacing20">
              <Text color="$neutral2" flexShrink={0} paddingEnd="$spacing8" variant="subheading1">
                {t('explore.tokens.top.title')}
              </Text>
              <Flex flexShrink={1}>
                <SortButton orderBy={orderBy} />
              </Flex>
            </Flex>
            <NetworkPillsRow
              selectedNetwork={selectedNetwork}
              onSelectNetwork={(network) => setImmediate(() => onSelectNetwork(network))}
            />
          </Flex>
        }
        ListHeaderComponentStyle={styles.foreground}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        data={showFullScreenLoadingState ? undefined : topTokenItems}
        keyExtractor={tokenKey}
        removeClippedSubviews={true}
        renderItem={renderItem}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        onScroll={scrollHandler}
      />
    </Flex>
  )
}

function NetworkPillsRow({
  selectedNetwork,
  onSelectNetwork,
}: {
  selectedNetwork: UniverseChainId | null
  onSelectNetwork: (chainId: UniverseChainId | null) => void
}): JSX.Element {
  const colors = useSporeColors()
  const { chains } = useEnabledChains()

  const renderItem: ListRenderItem<UniverseChainId> = useCallback(
    ({ item }: ListRenderItemInfo<UniverseChainId>) => {
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
        contentContainerStyle={{ alignItems: 'center', gap: spacing.spacing8, paddingRight: spacing.spacing8 }}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
      />
    </Flex>
  )
}

function AllNetworksPill({ onPress, selected }: { onPress: () => void; selected: boolean }): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      centered
      row
      ml="$spacing8"
      backgroundColor={selected ? '$surface3' : '$surface1'}
      borderColor="$surface3"
      borderRadius="$rounded12"
      borderWidth={1}
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
}

const tokenKey = (token: TokenItemDataWithMetadata): string => {
  return token.tokenItemData.address
    ? buildCurrencyId(token.tokenItemData.chainId, token.tokenItemData.address)
    : buildNativeCurrencyId(token.tokenItemData.chainId)
}

function tokenStatsToTokenItemData(tokenStat: TokenStats): TokenItemData | null {
  const formattedChain = fromGraphQLChain(tokenStat.chain)

  if (!formattedChain) {
    return null
  }

  return {
    name: tokenStat.name ?? '',
    logoUrl: tokenStat.logo ?? '',
    chainId: formattedChain,
    address: tokenStat.address,
    symbol: tokenStat.symbol ?? '',
    price: tokenStat.price?.value,
    marketCap: tokenStat.fullyDilutedValuation?.value,
    pricePercentChange24h: tokenStat.pricePercentChange1Day?.value,
    volume24h: tokenStat.volume1Day?.value,
    totalValueLocked: tokenStat.volume1Day?.value,
  }
}

type FavoritesSectionProps = AutoScrollProps & {
  showLoading: boolean
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
