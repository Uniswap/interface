import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeInUp } from 'react-native-reanimated'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import {
  BaseTokenSectionProps,
  GenericTokenSection,
} from 'src/components/explore/GenericTokenSection'
import { TokenItemBox } from 'src/components/explore/TokenItem'
import { Heart } from 'src/components/icons/Heart'
import { AnimatedBox, Flex } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { Text } from 'src/components/Text'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'

import { useFavoriteTokenInfo } from 'src/features/explore/hooks'
import { Screens } from 'src/screens/Screens'

const HEART_SIZE_MINIMIZED = 16

/** Renders the favorite tokens section on the Explore page */
export function FavoriteTokensSection(props: BaseTokenSectionProps) {
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

  return (
    <AnimatedBox entering={FadeInUp} mb="sm">
      <GenericTokenSection
        {...props}
        displayFavorites
        horizontal
        ListEmptyComponent={
          <Section.EmptyState
            buttonLabel={t('Explore tokens')}
            description={t("When you favorite tokens, they'll appear here.")}
            onPress={() => {
              navigation.navigate(Screens.ExploreTokens)
            }}
          />
        }
        assets={favorites}
        id="explore-favorites-header"
        loading={isLoading}
        renderItem={renderItem}
        title={
          <Flex row alignItems="center" gap="xs">
            <Heart active={true} size={HEART_SIZE_MINIMIZED} />
            <Text color="textSecondary" variant="body1">
              {t('Favorite tokens')}
            </Text>
          </Flex>
        }
      />
    </AnimatedBox>
  )
}
