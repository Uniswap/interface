import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeInUp } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import {
  BaseTokenSectionProps,
  GenericTokenSection,
} from 'src/components/explore/GenericTokenSection'
import { TokenItem } from 'src/components/explore/TokenItem'
import { AnimatedBox } from 'src/components/layout'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'
import { useMarketTokens } from 'src/features/explore/hooks'
import { getOrderByValues } from 'src/features/explore/utils'
import { selectTokensOrderBy } from 'src/features/wallet/selectors'

/** Renders the top X tokens section on the Explore page */
export function TopTokensSection(props: BaseTokenSectionProps) {
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
      <GenericTokenSection
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
