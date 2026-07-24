import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { BaseResult, PortfolioBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'

export type SortedPortfolioBalances = {
  balances: PortfolioBalance[]
  hiddenBalances: PortfolioBalance[]
}

export type SortedPortfolioBalancesMultichain = {
  balances: PortfolioMultichainBalance[]
  hiddenBalances: PortfolioMultichainBalance[]
}

export type SortedPortfolioBalancesResult = BaseResult<SortedPortfolioBalances>

export type SortedPortfolioBalancesResultMultichain = BaseResult<SortedPortfolioBalancesMultichain> & {
  balancesById: Record<string, PortfolioMultichainBalance> | undefined
  dataUpdatedAt?: number
}

export type UseSortedPortfolioBalancesOptions = {
  evmAddress?: Address
  svmAddress?: Address
  pollInterval?: PollingInterval
  chainIds?: UniverseChainId[]
  /** When true, request multichain from backend. Default false. */
  requestMultichainFromBackend?: boolean
}
