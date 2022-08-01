import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeInUp } from 'react-native-reanimated'
import { useExploreStackNavigation } from 'src/app/navigation/types'
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

  return (
    <AnimatedBox entering={FadeInUp}>
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
  )
}

export function FavoritesEmptyState() {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  return (
    <BaseCard.EmptyState
      buttonLabel={t('Explore tokens')}
      description={t("When you favorite tokens, they'll appear here.")}
      onPress={() => {
        navigation.navigate(Screens.ExploreTokens)
      }}
    />
  )
}
