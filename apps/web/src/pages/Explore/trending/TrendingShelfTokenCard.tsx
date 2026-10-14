import { memo } from 'react'
import { useNavigate } from 'react-router'
import { TokenCard } from 'uniswap/src/components/TokenCard/TokenCard'
import type { RankedTokenCardItem } from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/data/util'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

export const TrendingShelfTokenCard = memo(function TrendingShelfTokenCard({
  token,
  cardWidth,
  onTokenClick,
}: {
  token: RankedTokenCardItem
  cardWidth: number
  onTokenClick: (token: RankedTokenCardItem) => void
}): JSX.Element {
  const navigate = useNavigate()
  const link = getTokenDetailsURL({
    address: token.address,
    chain: toGraphQLChain(token.chainId),
    chainQueryParam: TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
  })

  const onPress = useEvent((): void => {
    onTokenClick(token)
    navigate(link)
  })

  return (
    <TokenCard
      layout="horizontal"
      width={cardWidth}
      logoUrl={token.logoUrl}
      chainId={token.chainId}
      hideNetworkLogo={token.isMultichain}
      name={token.name}
      symbol={token.symbol}
      pricePercentChange1d={token.pricePercentChange1d}
      sparkline={token.sparkline}
      onPress={onPress}
    />
  )
})
