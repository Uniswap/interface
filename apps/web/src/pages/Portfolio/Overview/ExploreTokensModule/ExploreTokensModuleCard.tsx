import { SharedEventName } from '@uniswap/analytics-events'
import { memo } from 'react'
import { useNavigate } from 'react-router'
import { TokenCard } from 'uniswap/src/components/TokenCard/TokenCard'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { ElementName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/data/util'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

export const ExploreTokensModuleCard = memo(function ExploreTokensModuleCard({
  token,
  categoryId,
}: {
  token: RankedTokenCardItem
  categoryId: string
}): JSX.Element {
  const navigate = useNavigate()

  const onPress = useEvent((): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.PortfolioExploreTokensCard,
      section: SectionName.PortfolioOverviewTab,
      token_address: token.address,
      token_symbol: token.symbol,
      category_id: categoryId,
    })
    navigate(
      getTokenDetailsURL({
        address: token.address,
        chainId: token.chainId,
        chainQueryParam: TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
      }),
    )
  })

  return (
    <TokenCard
      layout="vertical"
      width="100%"
      logoUrl={token.logoUrl}
      chainId={token.chainId}
      hideNetworkLogo={token.isMultichain}
      name={token.name}
      symbol={token.symbol}
      issuer={token.issuer}
      priceUsd={token.priceUsd}
      pricePercentChange1d={token.pricePercentChange1d}
      sparkline={token.sparkline}
      onPress={onPress}
    />
  )
})
