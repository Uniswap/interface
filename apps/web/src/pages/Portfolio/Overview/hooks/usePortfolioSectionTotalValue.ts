import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { usePortfolioBalanceBreakdown } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'

interface UsePortfolioSectionTotalValueParams {
  part: PortfolioBalancePart.Tokens | PortfolioBalancePart.Pools
  chainId?: UniverseChainId
  enabled: boolean
}

interface PortfolioSectionTotalValue {
  totalValueFormatted?: string
  totalValueNumeric?: number
  totalValueLoading: boolean
}

export function usePortfolioSectionTotalValue({
  part,
  chainId,
  enabled,
}: UsePortfolioSectionTotalValueParams): PortfolioSectionTotalValue {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const portfolioAddresses = usePortfolioAddresses()

  const { data: portfolioBreakdown, loading } = usePortfolioBalanceBreakdown({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
    chainIds: chainId ? [chainId] : undefined,
    enabled,
  })

  const balanceUSD = enabled ? portfolioBreakdown?.[part].balanceUSD : undefined

  return {
    totalValueFormatted:
      balanceUSD !== undefined ? convertFiatAmountFormatted(balanceUSD, NumberType.PortfolioBalance) : undefined,
    totalValueNumeric: balanceUSD,
    totalValueLoading: enabled && loading && balanceUSD === undefined,
  }
}
