import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Heart } from 'src/components/icons/Heart'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { Asset } from 'src/features/dataApi/zerion/types'
import {
  BaseTokenSectionProps,
  GenericTokenSection,
} from 'src/features/explore/GenericTokenSection'
import { useFavoriteTokenInfo } from 'src/features/explore/hooks'
import { TokenItemBox } from 'src/features/explore/TokenItem'
import { Screens } from 'src/screens/Screens'
import { buildCurrencyId } from 'src/utils/currencyId'

const HEART_SIZE_EXPANDED = 20
const HEART_SIZE_MINIMIZED = 16

/** Renders the favorite tokens section on the Explore page */
export function FavoriteTokensSection(props: BaseTokenSectionProps) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  const { currentData: favorites, isLoading, isFetching } = useFavoriteTokenInfo()

  const renderItem = useCallback(
    ({ item: token, index }: ListRenderItemInfo<Asset>) => {
      return (
        <TokenItemBox
          gesturesEnabled={props.expanded}
          index={index}
          metadataDisplayType={props.metadataDisplayType}
          token={token}
          onCycleMetadata={props.onCycleMetadata}
          onPress={() => {
            navigation.navigate(Screens.TokenDetails, {
              currencyId: buildCurrencyId(ChainId.Mainnet, token.asset.asset_code),
            })
          }}
        />
      )
    },
    [props.expanded, props.metadataDisplayType, props.onCycleMetadata, navigation]
  )

  if (!favorites?.info?.length) return null

  return (
    <Box mb="sm">
      <GenericTokenSection
        {...props}
        displayFavorites
        horizontal
        assets={favorites?.info}
        id="explore-favorites-header"
        loading={isLoading || isFetching}
        renderItem={renderItem}
        title={
          <Flex row alignItems="center" gap="xs">
            <Heart
              active={true}
              size={props.expanded ? HEART_SIZE_EXPANDED : HEART_SIZE_MINIMIZED}
            />
            <Text
              color={props.expanded ? 'neutralTextPrimary' : 'neutralTextSecondary'}
              variant={props.expanded ? 'h3' : 'body2'}>
              {t('Favorite tokens')}
            </Text>
          </Flex>
        }
      />
    </Box>
  )
}
