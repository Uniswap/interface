import { NetworkStatus } from '@apollo/client'
import isEqual from 'lodash/isEqual'
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import {
  sortPortfolioBalances,
  usePortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/dataApi/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { isWarmLoadingStatus } from 'wallet/src/data/utils'

type CurrencyId = string
export const HIDDEN_TOKEN_BALANCES_ROW = 'HIDDEN_TOKEN_BALANCES_ROW' as const
export type TokenBalanceListRow = CurrencyId | typeof HIDDEN_TOKEN_BALANCES_ROW

type TokenBalanceListContextState = {
  balancesById: Record<string, PortfolioBalance> | undefined
  networkStatus: NetworkStatus
  refetch: (() => void) | undefined
  hiddenTokensCount: number
  hiddenTokensExpanded: boolean
  isWarmLoading: boolean
  rows: Array<TokenBalanceListRow>
  setHiddenTokensExpanded: Dispatch<SetStateAction<boolean>>
  onPressToken: (currencyId: CurrencyId) => void
}

export const TokenBalanceListContext = createContext<TokenBalanceListContextState | undefined>(undefined)

export function TokenBalanceListContextProvider({
  owner,
  isExternalProfile,
  children,
  onPressToken,
}: PropsWithChildren<{
  owner: Address
  isExternalProfile: boolean
  onPressToken: (currencyId: CurrencyId) => void
}>): JSX.Element {
  const {
    data: balancesById,
    networkStatus,
    refetch,
  } = usePortfolioBalances({
    address: owner,
    pollInterval: PollingInterval.KindaFast,
    fetchPolicy: 'cache-and-network',
  })

  const { isTestnetModeEnabled } = useEnabledChains()
  // re-order token balances to visible and hidden
  const { shownTokens, hiddenTokens } = useTokenBalancesGroupedByVisibility({
    balancesById,
  })

  const shouldShowHiddenTokens = !shownTokens?.length && !!hiddenTokens?.length

  const [hiddenTokensExpanded, setHiddenTokensExpanded] = useState(shouldShowHiddenTokens)

  const rowsRef = useRef<TokenBalanceListRow[]>()

  const rows = useMemo<TokenBalanceListRow[]>(() => {
    const shownTokensArray = shownTokens ?? []
    const newRowIds = [
      // already sorted when testnet mode is disabled;
      // api uses usd value, which is available for prod tokens
      ...(isTestnetModeEnabled
        ? sortPortfolioBalances({ balances: shownTokensArray, isTestnetModeEnabled })
        : shownTokensArray),
      ...(hiddenTokens?.length ? [HIDDEN_TOKEN_BALANCES_ROW] : []),
      ...(hiddenTokensExpanded && hiddenTokens ? hiddenTokens : []),
    ].map((token) => {
      if (token === HIDDEN_TOKEN_BALANCES_ROW) {
        return token
      }

      return token.currencyInfo.currencyId
    })

    // We do this extra step to make sure we return the same array reference if the currency IDs for each row haven't changed.
    if (!rowsRef.current || !isEqual(rowsRef.current, newRowIds)) {
      rowsRef.current = newRowIds
    }

    return rowsRef.current
  }, [hiddenTokens, hiddenTokensExpanded, shownTokens, isTestnetModeEnabled])

  const isWarmLoading = !!balancesById && isWarmLoadingStatus(networkStatus) && !isExternalProfile

  const state = useMemo<TokenBalanceListContextState>(
    (): TokenBalanceListContextState => ({
      balancesById,
      hiddenTokensCount: hiddenTokens?.length ?? 0,
      hiddenTokensExpanded,
      isWarmLoading,
      networkStatus,
      onPressToken,
      refetch,
      rows,
      setHiddenTokensExpanded,
    }),
    [
      balancesById,
      hiddenTokens?.length,
      hiddenTokensExpanded,
      isWarmLoading,
      networkStatus,
      onPressToken,
      refetch,
      rows,
    ],
  )

  return <TokenBalanceListContext.Provider value={state}>{children}</TokenBalanceListContext.Provider>
}

export const useTokenBalanceListContext = (): TokenBalanceListContextState => {
  const context = useContext(TokenBalanceListContext)

  if (context === undefined) {
    throw new Error('`useTokenBalanceListContext` must be used inside of `TokenBalanceListContextProvider`')
  }

  return context
}
