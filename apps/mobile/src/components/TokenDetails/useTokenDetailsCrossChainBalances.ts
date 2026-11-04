import { MultichainTokenDeployment } from 'src/components/TokenDetails/multichainTokensFromAddresses'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useCrossChainBalances } from 'uniswap/src/data/apiClients/dataApiService/balances/hooks/useCrossChainBalances'
import type { DataApiOutageState, PortfolioBalance } from 'uniswap/src/features/dataApi/types'

export function useTokenDetailsCrossChainBalances({ evmAddress }: { evmAddress: string | undefined }): {
  crossChainTokens: MultichainTokenDeployment[]
  currentChainBalance: PortfolioBalance | null
  otherChainBalances: PortfolioBalance[] | null
} & DataApiOutageState {
  const { currencyId, multichainTokens } = useTokenDetailsContext()

  const { currentChainBalance, otherChainBalances, error, dataUpdatedAt } = useCrossChainBalances({
    evmAddress,
    currencyId,
    crossChainTokens: multichainTokens,
  })

  return { crossChainTokens: multichainTokens, currentChainBalance, otherChainBalances, error, dataUpdatedAt }
}
