import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { FadeInUp } from 'react-native-reanimated'
import { SortingGroup } from 'src/components/explore/FilterGroup'
import { useOrderByModal } from 'src/components/explore/Modals'
import { TokenItem } from 'src/components/explore/TokenItem'
import { AnimatedBox, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { useMarketTokens, useTokenMetadataDisplayType } from 'src/features/explore/hooks'
import { getOrderByValues } from 'src/features/explore/utils'

/** Renders the top X tokens in a card on the Explore page */
export function TopTokensCard() {
  const { t } = useTranslation()
  const { orderBy, setOrderByModalIsVisible, orderByModal } = useOrderByModal()
  const [tokenMetadataDisplayType, cycleTokenMetadataDisplayType] = useTokenMetadataDisplayType()
  const { tokens: topTokens } = useMarketTokens(useMemo(() => getOrderByValues(orderBy), [orderBy]))

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

  return (
    <AnimatedBox entering={FadeInUp}>
      <Flex row alignItems="center" justifyContent="space-between" mx="sm" my="xs">
        <Text color="textSecondary" variant="smallLabel">
          {t('Top Tokens')}
        </Text>
        <SortingGroup onPressOrderBy={() => setOrderByModalIsVisible(true)} />
      </Flex>
      <FlatList
        data={topTokens}
        keyExtractor={({ id }) => id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
      {orderByModal}
    </AnimatedBox>
  )
}
