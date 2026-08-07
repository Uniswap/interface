import { memo } from 'react'
import { useNavigate } from 'react-router'
import { TokenCard } from 'uniswap/src/components/TokenCard/TokenCard'
import { resolvePrimaryChain } from 'uniswap/src/data/apiClients/dataApiService/rwa/resolvePrimaryChain'
import type { ExploreStockShelfItem } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { useStockTokenCardProps } from 'uniswap/src/data/apiClients/dataApiService/rwa/useStockTokenCardProps'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useEvent } from 'utilities/src/react/hooks'
import { getTokenDetailsURL } from '~/data/util'
import { useAssetShelfChainId } from '~/pages/Explore/hooks/useAssetShelfChainId'
import type { AssetCardClickHandler } from '~/pages/Explore/rwa/shelf/types'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

export function getShelfItemKey(item: ExploreStockShelfItem): string {
  return item.rwa.symbol
}

export const ShelfTokenCard = memo(function ShelfTokenCard({
  rwa,
  issuer,
  cardWidth,
  onAssetClick,
}: ExploreStockShelfItem & { cardWidth: number; onAssetClick?: AssetCardClickHandler }): JSX.Element {
  const navigate = useNavigate()
  const { chains: enabledChainIds } = useEnabledChains()
  const exploreFilterChainId = useAssetShelfChainId()
  const cardProps = useStockTokenCardProps({ rwa, issuer })
  const resolved = resolvePrimaryChain({ issuer, enabledChainIds })
  const link =
    resolved?.chainToken.address &&
    getTokenDetailsURL({
      address: resolved.chainToken.address,
      chain: toGraphQLChain(resolved.chainId),
      chainQueryParam: exploreFilterChainId ? undefined : TDP_MULTICHAIN_CHAIN_QUERY_VALUE,
    })

  const onPress = useEvent((): void => {
    if (!resolved || !link) {
      return
    }
    onAssetClick?.({ tokenAddress: resolved.chainToken.address, tokenSymbol: rwa.symbol })
    navigate(link)
  })

  return <TokenCard {...cardProps} layout="vertical" width={cardWidth} onPress={link ? onPress : undefined} />
})
