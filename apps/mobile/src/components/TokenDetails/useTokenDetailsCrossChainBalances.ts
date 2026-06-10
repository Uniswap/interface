import { GraphQLApi } from '@universe/api'
import { useMemo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useCrossChainBalances } from 'uniswap/src/data/balances/hooks/useCrossChainBalances'
import { useTokenBasicProjectPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import type { DataApiOutageState, PortfolioBalance } from 'uniswap/src/features/dataApi/types'

type CrossChainToken = { address: string | null; chain: GraphQLApi.Chain }

export function useTokenDetailsCrossChainBalances({ evmAddress }: { evmAddress: string | undefined }): {
  crossChainTokens: CrossChainToken[]
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
} & DataApiOutageState {
  const { currencyId } = useTokenDetailsContext()
  const projectTokens = useTokenBasicProjectPartsFragment({ currencyId }).data.project?.tokens

  const crossChainTokens = useMemo<CrossChainToken[]>(() => {
    return (projectTokens ?? []).flatMap((token) => {
      if (!token || !token.chain || token.address === undefined) {
        return []
      }
      return [{ address: token.address, chain: token.chain }]
    })
  }, [projectTokens])

  const { currentChainBalance, otherChainBalances, error, dataUpdatedAt } = useCrossChainBalances({
    evmAddress,
    currencyId,
    crossChainTokens,
  })

  return { crossChainTokens, currentChainBalance, otherChainBalances, error, dataUpdatedAt }
}
