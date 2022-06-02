import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { TokenItem } from 'src/components/TokenList/TokenItem'
import { ChainId } from 'src/constants/chains'
import { Asset } from 'src/features/dataApi/zerion/types'
import {
  BaseTokenSectionProps,
  GenericTokenSection,
} from 'src/features/explore/GenericTokenSection'
import { useTokenInfo } from 'src/features/explore/hooks'
import { Screens } from 'src/screens/Screens'
import { buildCurrencyId } from 'src/utils/currencyId'

/** Renders the top X tokens section on the Explore page */
export function TopTokensSection(props: BaseTokenSectionProps) {
  const { t } = useTranslation()
  const navigation = useExploreStackNavigation()

  const { topTokens, isLoading } = useTokenInfo()

  const renderItem = useCallback(
    ({ item: token }: ListRenderItemInfo<Asset>) => {
      // TODO: make Swipeable (rn-gesture-handler)
      return (
        <TokenItem
          token={token}
          onPress={() => {
            navigation.navigate(Screens.TokenDetails, {
              currencyId: buildCurrencyId(ChainId.Mainnet, token.asset.asset_code),
            })
          }}
        />
      )
    },
    [navigation]
  )

  return (
    <GenericTokenSection
      {...props}
      assets={topTokens?.info}
      id="explore-tokens-header"
      loading={isLoading}
      renderItem={renderItem}
      title={t('Top Tokens')}
    />
  )
}
