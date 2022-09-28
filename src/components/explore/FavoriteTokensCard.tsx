import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { ExploreTokenCardEmptyState } from 'src/components/explore/ExploreTokenCardEmptyState'
import { BaseTokensCardProps, GenericTokensCard } from 'src/components/explore/GenericTokensCard'
import { TokenItemBox } from 'src/components/explore/TokenItem'
import { AnimatedBox } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'

import { useFavoriteTokenInfo } from 'src/features/explore/hooks'
import { Screens } from 'src/screens/Screens'

/** Renders the favorite tokens card on the Explore page */
export function FavoriteTokensCard(props: BaseTokensCardProps) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  const { tokens: favorites, isLoading } = useFavoriteTokenInfo()

  const renderItem = useCallback(
    ({ item: token, index }: ListRenderItemInfo<CoingeckoMarketCoin>) => {
      return (
        <TokenItemBox
          coin={token}
          gesturesEnabled={false}
          index={index}
          metadataDisplayType={props.metadataDisplayType}
        />
      )
    },
    [props.metadataDisplayType]
  )

  const hasFavoriteTokens = favorites?.length > 0

  return hasFavoriteTokens ? (
    <AnimatedBox entering={FadeIn}>
      <GenericTokensCard
        {...props}
        displayFavorites
        horizontal
        ListEmptyComponent={<FavoritesEmptyState />}
        assets={favorites}
        id="explore-favorites-header"
        loading={isLoading}
        renderItem={renderItem}
        title={t('Favorite tokens')}
      />
    </AnimatedBox>
  ) : (
    <ExploreTokenCardEmptyState
      buttonLabel={t('Explore tokens')}
      description={t('Favorite tokens to monitor their prices.')}
      type="favorite"
      onPress={() => {
        navigation.navigate(Screens.ExploreTokens)
      }}
    />
  )
}

export function FavoritesEmptyState() {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  return (
    <BaseCard.EmptyState
      buttonLabel={t('Explore tokens')}
      description={t('Favorite tokens to monitor their prices.')}
      onPress={() => {
        navigation.navigate(Screens.ExploreTokens)
      }}
    />
  )
}
