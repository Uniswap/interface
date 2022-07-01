import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeInUp } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { BaseTokensCardProps, GenericTokensCard } from 'src/components/explore/GenericTokensCard'
import { TokenItem } from 'src/components/explore/TokenItem'
import { AnimatedBox } from 'src/components/layout'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { useMarketTokens } from 'src/features/explore/hooks'
import { getOrderByValues } from 'src/features/explore/utils'
import { selectTokensOrderBy } from 'src/features/wallet/selectors'

/** Renders the top X tokens in a card on the Explore page */
export function TopTokensCard(props: BaseTokensCardProps) {
  const { t } = useTranslation()

  const orderBy = useAppSelector(selectTokensOrderBy)

  const { tokens: topTokens, isLoading } = useMarketTokens(
    useMemo(() => getOrderByValues(orderBy), [orderBy])
  )

  const renderItem = useCallback(
    ({ item: coin, index }: ListRenderItemInfo<CoingeckoMarketCoin>) => (
      <TokenItem
        coin={coin}
        gesturesEnabled={false}
        index={index}
        metadataDisplayType={props.metadataDisplayType}
        onCycleMetadata={props.onCycleMetadata}
      />
    ),
    [props.metadataDisplayType, props.onCycleMetadata]
  )

  return (
    <AnimatedBox entering={FadeInUp}>
      <GenericTokensCard
        {...props}
        assets={topTokens}
        id="explore-tokens-header"
        loading={isLoading}
        renderItem={renderItem}
        title={t('Tokens')}
      />
    </AnimatedBox>
  )
}
