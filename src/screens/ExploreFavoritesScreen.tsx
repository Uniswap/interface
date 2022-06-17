import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { TokenItem } from 'src/components/explore/TokenItem'
import { Heart } from 'src/components/icons/Heart'
import { Box, Flex } from 'src/components/layout'
import { ListDetailScreen } from 'src/components/layout/ListDetailScreen'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { useFavoriteTokenInfo, useTokenMetadataDisplayType } from 'src/features/explore/hooks'

const HEART_SIZE = 20

export function ExploreFavoritesScreen() {
  const { t } = useTranslation()

  const [tokenMetadataDisplayType, cycleTokenMetadataDisplayType] = useTokenMetadataDisplayType()

  const { tokens } = useFavoriteTokenInfo()

  const renderItem = useCallback(
    ({ item: coin, index }: ListRenderItemInfo<CoingeckoMarketCoin>) => (
      <TokenItem
        coin={coin}
        gesturesEnabled={true}
        index={index}
        metadataDisplayType={tokenMetadataDisplayType}
        onCycleMetadata={cycleTokenMetadataDisplayType}
      />
    ),
    [tokenMetadataDisplayType, cycleTokenMetadataDisplayType]
  )

  const ContentHeader = (
    <Flex row alignItems="center" gap="xs" my="xs">
      <Text variant="h3">{t('Favorite tokens')}</Text>
      <Heart active={true} size={HEART_SIZE} />
    </Flex>
  )

  return (
    <ListDetailScreen
      ItemSeparatorComponent={() => <Separator ml="md" />}
      ListEmptyComponent={
        <Box mx="md" my="sm">
          <Loading repeat={8} type="token" />
        </Box>
      }
      contentHeader={ContentHeader}
      data={tokens}
      keyExtractor={key}
      renderItem={renderItem}
      title={t('Favorite tokens')}
    />
  )
}

function key({ id }: { id: string }) {
  return id
}
