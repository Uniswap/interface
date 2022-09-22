import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo, ViewStyle } from 'react-native'
import { FavoriteTokensCard } from 'src/components/explore/FavoriteTokensCard'
import { SortingGroup } from 'src/components/explore/FilterGroup'
import { useOrderByModal } from 'src/components/explore/Modals'
import { TokenItem } from 'src/components/explore/TokenItem'
import { Box, Flex } from 'src/components/layout'
import {
  TabViewScrollProps,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ClientSideOrderBy, CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { useMarketTokens, useTokenMetadataDisplayType } from 'src/features/explore/hooks'
import { getOrderByValues } from 'src/features/explore/utils'

export default function ExploreTokensTab({
  tabViewScrollProps,
  loadingContainerStyle,
  listRef,
}: {
  tabViewScrollProps: TabViewScrollProps
  loadingContainerStyle?: ViewStyle
  listRef?: React.MutableRefObject<null>
}) {
  const { t } = useTranslation()

  // Sorting and filtering
  const { orderBy, setOrderByModalIsVisible, orderByModal } = useOrderByModal()
  const [tokenMetadataDisplayType, cycleTokenMetadataDisplayType] = useTokenMetadataDisplayType()

  // Token Data
  const { tokens: topTokens, isLoading } = useMarketTokens(
    useMemo(() => getOrderByValues(orderBy), [orderBy])
  )

  const renderItem = useCallback(
    ({ item: coin, index }: ListRenderItemInfo<CoingeckoMarketCoin>) => (
      <TokenItem
        coin={coin}
        gesturesEnabled={false}
        index={index}
        metadataDisplayType={tokenMetadataDisplayType}
        onCycleMetadata={cycleTokenMetadataDisplayType}
      />
    ),
    [cycleTokenMetadataDisplayType, tokenMetadataDisplayType]
  )

  if (isLoading) {
    return (
      <Box my="sm" style={loadingContainerStyle}>
        <Loading />
      </Box>
    )
  }

  return (
    <FlatList
      ref={listRef}
      ListHeaderComponent={
        <Box my="sm">
          <FavoriteTokensCard
            fixedCount={5}
            metadataDisplayType={ClientSideOrderBy.PriceChangePercentage24hDesc}
          />
          <Flex row alignItems="center" justifyContent="space-between" mx="sm" my="md">
            <Text color="textSecondary" variant="smallLabel">
              {t('Top Tokens')}
            </Text>
            <SortingGroup onPressOrderBy={() => setOrderByModalIsVisible(true)} />
          </Flex>
          {orderByModal}
        </Box>
      }
      data={topTokens}
      keyExtractor={({ id }) => id}
      renderItem={renderItem}
      scrollEventThrottle={TAB_VIEW_SCROLL_THROTTLE}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={tabViewScrollProps.contentContainerStyle}
    />
  )
}
