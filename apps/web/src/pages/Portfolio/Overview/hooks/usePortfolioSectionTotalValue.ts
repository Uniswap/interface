import { UniverseChainId } from '@universe/chains'
import { PortfolioBalancePart } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { usePortfolioBalanceBreakdown } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'

interface UsePortfolioSectionTotalValueParams {
  part: PortfolioBalancePart.Tokens | PortfolioBalancePart.Pools
  chainId?: UniverseChainId
}

interface PortfolioSectionTotalValue {
  totalValueFormatted?: string
  totalValueNumeric?: number
  totalValueLoading: boolean
  /** Item count for the part (for Pools: open, non-spam positions). */
  count?: number
}

export function usePortfolioSectionTotalValue({
  part,
  chainId,
}: UsePortfolioSectionTotalValueParams): PortfolioSectionTotalValue {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const portfolioAddresses = usePortfolioAddresses()

  const { data: portfolioBreakdown, loading } = usePortfolioBalanceBreakdown({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
    chainIds: chainId ? [chainId] : undefined,
  })

  const partBreakdown = portfolioBreakdown?.[part]
  const balanceUSD = partBreakdown?.balanceUSD

  return {
    totalValueFormatted:
      balanceUSD !== undefined ? convertFiatAmountFormatted(balanceUSD, NumberType.PortfolioBalance) : undefined,
    totalValueNumeric: balanceUSD,
    totalValueLoading: loading && balanceUSD === undefined,
    count: partBreakdown?.count,
  }
}
