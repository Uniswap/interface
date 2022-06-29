import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { BackButton } from 'src/components/buttons/BackButton'
import { FavoritesEmptyState } from 'src/components/explore/FavoriteTokensSection'
import { TokenItem } from 'src/components/explore/TokenItem'
import { Heart } from 'src/components/icons/Heart'
import { Box, Flex } from 'src/components/layout'
import { HeaderListScreen } from 'src/components/layout/screens/HeaderListScreen'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { useFavoriteTokenInfo, useTokenMetadataDisplayType } from 'src/features/explore/hooks'

const HEART_SIZE = 20

export function ExploreFavoritesScreen() {
  const { t } = useTranslation()

  const [tokenMetadataDisplayType, cycleTokenMetadataDisplayType] = useTokenMetadataDisplayType()

  const { tokens, isLoading } = useFavoriteTokenInfo()

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

  return (
    <HeaderListScreen
      ItemSeparatorComponent={() => <Separator ml="md" />}
      ListEmptyComponent={
        isLoading ? (
          <Box mx="md" my="sm">
            <Loading repeat={8} type="token" />
          </Box>
        ) : (
          <FavoritesEmptyState />
        )
      }
      contentHeader={
        <Flex gap="md" mt="sm">
          <BackButton showButtonLabel />
          <Flex row alignItems="center" gap="xs" my="xs">
            <Text variant="headlineSmall">{t('Favorite tokens')}</Text>
            <Heart active={true} size={HEART_SIZE} />
          </Flex>
        </Flex>
      }
      data={tokens}
      fixedHeader={
        <Flex row alignItems="center" justifyContent="space-between">
          <BackButton />
          <Text variant="subhead">{t('Favorite tokens')}</Text>
          <Box width={18} />
        </Flex>
      }
      keyExtractor={key}
      renderItem={renderItem}
    />
  )
}

function key({ id }: { id: string }) {
  return id
}
