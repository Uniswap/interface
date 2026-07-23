import { useTranslation } from 'react-i18next'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getPoolsUnavailableMessage } from 'uniswap/src/features/portfolio/pools/getPoolsFailedNetworks'
import { usePoolsFailedNetworks } from 'uniswap/src/features/portfolio/pools/usePoolsFailedNetworks'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'

interface UsePoolsSectionWarningParams {
  chainId?: UniverseChainId
  enabled: boolean
}

export function usePoolsSectionWarning({ chainId, enabled }: UsePoolsSectionWarningParams): {
  warningMessage?: string
} {
  const { t } = useTranslation()
  const portfolioAddresses = usePortfolioAddresses()
  const { failedChainIds } = usePoolsFailedNetworks({
    evmAddress: portfolioAddresses.evmAddress,
    svmAddress: portfolioAddresses.svmAddress,
    chainId,
    enabled,
  })

  return {
    warningMessage: failedChainIds.length > 0 ? getPoolsUnavailableMessage({ chainIds: failedChainIds, t }) : undefined,
  }
}
