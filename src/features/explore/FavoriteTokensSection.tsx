import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { Box } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { Asset } from 'src/features/dataApi/zerion/types'
import { SortingGroup } from 'src/features/explore/FilterGroup'
import {
  BaseTokenSectionProps,
  GenericTokenSection,
} from 'src/features/explore/GenericTokenSection'
import { useFavoriteTokenInfo } from 'src/features/explore/hooks'
import { useOrderByModal } from 'src/features/explore/Modals'
import { TokenItemBox } from 'src/features/explore/TokenItem'
import { Screens } from 'src/screens/Screens'
import { buildCurrencyId } from 'src/utils/currencyId'

/** Renders the favorite tokens section on the Explore page */
export function FavoriteTokensSection(props: BaseTokenSectionProps) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  const { orderBy, toggleModalVisible, orderByModal } = useOrderByModal()
  const { currentData: favorites, isLoading, isFetching } = useFavoriteTokenInfo(orderBy)

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
        horizontal
        assets={favorites?.info}
        id="explore-favorites-header"
        loading={isLoading || isFetching}
        renderItem={renderItem}
        subtitle={props.expanded ? <SortingGroup onPressOrderBy={toggleModalVisible} /> : undefined}
        title={t('Favorites tokens')}
      />
      {orderByModal}
    </Box>
  )
}
