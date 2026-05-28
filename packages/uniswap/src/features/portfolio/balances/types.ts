import { NetworkStatus } from '@apollo/client'
import { GqlResult } from '@universe/api'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'

export type SortedPortfolioBalances = {
  balances: PortfolioBalance[]
  hiddenBalances: PortfolioBalance[]
}

export type SortedPortfolioBalancesMultichain = {
  balances: PortfolioMultichainBalance[]
  hiddenBalances: PortfolioMultichainBalance[]
}

type SortedPortfolioBalancesResultBase = {
  networkStatus: NetworkStatus
}

export type SortedPortfolioBalancesResult = GqlResult<SortedPortfolioBalances> & SortedPortfolioBalancesResultBase

export type SortedPortfolioBalancesResultMultichain = GqlResult<SortedPortfolioBalancesMultichain> &
  SortedPortfolioBalancesResultBase & {
    balancesById: Record<string, PortfolioMultichainBalance> | undefined
    dataUpdatedAt?: number
  }

export type UseSortedPortfolioBalancesOptions = {
  evmAddress?: Address
  svmAddress?: Address
  pollInterval?: PollingInterval
  onCompleted?: () => void
  chainIds?: UniverseChainId[]
  /** When true, request multichain from backend. Default false. */
  requestMultichainFromBackend?: boolean
}
