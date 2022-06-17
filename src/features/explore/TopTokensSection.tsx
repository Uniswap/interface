import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeInUp } from 'react-native-reanimated'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { AnimatedBox } from 'src/components/layout'
import { useCoinIdAndCurrencyIdMappings } from 'src/features/dataApi/coingecko/hooks'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { SortingGroup } from 'src/features/explore/FilterGroup'
import {
  BaseTokenSectionProps,
  GenericTokenSection,
} from 'src/features/explore/GenericTokenSection'
import { useMarketTokens } from 'src/features/explore/hooks'
import { useOrderByModal } from 'src/features/explore/Modals'
import { TokenItem } from 'src/features/explore/TokenItem'
import { getOrderByValues } from 'src/features/explore/utils'
import { useCurrencyIdFromCoingeckoId } from 'src/features/tokens/useCurrency'
import { Screens } from 'src/screens/Screens'

/** Renders the top X tokens section on the Explore page */
export function TopTokensSection(props: BaseTokenSectionProps) {
  const { t } = useTranslation()

  const { orderBy, toggleModalVisible, orderByModal } = useOrderByModal()

  const { isLoading: mappingLoading } = useCoinIdAndCurrencyIdMappings()
  const { tokens: topTokens, isLoading } = useMarketTokens(
    useMemo(() => ({ ...getOrderByValues(orderBy), category: 'ethereum-ecosystem' }), [orderBy])
  )

  const renderItem = useCallback(
    ({ item: coin, index }: ListRenderItemInfo<CoingeckoMarketCoin>) => (
      <TokenRow coin={coin} index={index} {...props} />
    ),
    [props]
  )

  return (
    <AnimatedBox entering={FadeInUp}>
      <GenericTokenSection
        {...props}
        assets={topTokens}
        id="explore-tokens-header"
        loading={isLoading || mappingLoading}
        renderItem={renderItem}
        subtitle={
          props.expanded ? (
            <SortingGroup orderBy={orderBy} onPressOrderBy={toggleModalVisible} />
          ) : undefined
        }
        title={t('Tokens')}
      />
      {orderByModal}
    </AnimatedBox>
  )
}

function TokenRow({
  coin,
  expanded,
  index,
  metadataDisplayType,
  onCycleMetadata,
}: {
  coin: CoingeckoMarketCoin
  expanded?: BaseTokenSectionProps['expanded']
  index: number
  metadataDisplayType: BaseTokenSectionProps['metadataDisplayType']
  onCycleMetadata: BaseTokenSectionProps['onCycleMetadata']
}) {
  const { navigate } = useExploreStackNavigation()

  const _currencyId = useCurrencyIdFromCoingeckoId(coin.id)
  if (!_currencyId) return null

  return (
    <TokenItem
      coin={coin}
      currencyId={_currencyId}
      gesturesEnabled={!!expanded}
      index={index}
      metadataDisplayType={metadataDisplayType}
      onCycleMetadata={onCycleMetadata}
      onPress={() => {
        navigate(Screens.TokenDetails, {
          currencyId: _currencyId,
        })
      }}
    />
  )
}
