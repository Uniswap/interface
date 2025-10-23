import { NetworkStatus } from '@apollo/client'
import { isWarmLoadingStatus } from '@universe/api'
import isEqual from 'lodash/isEqual'
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import {
  sortPortfolioBalances,
  usePortfolioBalances,
  useTokenBalancesGroupedByVisibility,
} from 'uniswap/src/features/dataApi/balances/balances'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { HIDDEN_TOKEN_BALANCES_ROW, TokenBalanceListRow } from 'uniswap/src/features/portfolio/types'
import { CurrencyId } from 'uniswap/src/types/currency'

type TokenBalanceListContextState = {
  balancesById: Record<string, PortfolioBalance> | undefined
  networkStatus: NetworkStatus
  refetch: (() => void) | undefined
  hiddenTokensCount: number
  hiddenTokensExpanded: boolean
  isWarmLoading: boolean
  rows: Array<TokenBalanceListRow>
  setHiddenTokensExpanded: Dispatch<SetStateAction<boolean>>
  onPressToken?: (currencyId: CurrencyId) => void
  evmOwner?: Address
  svmOwner?: Address
}

export const TokenBalanceListContext = createContext<TokenBalanceListContextState | undefined>(undefined)

export function TokenBalanceListContextProvider({
  evmOwner,
  svmOwner,
  isExternalProfile,
  children,
  onPressToken,
}: PropsWithChildren<{
  evmOwner?: Address
  svmOwner?: Address
  isExternalProfile: boolean
  onPressToken?: (currencyId: CurrencyId) => void
}>): JSX.Element {
  const {
    data: balancesById,
    networkStatus,
    refetch,
  } = usePortfolioBalances({
    evmAddress: evmOwner,
    svmAddress: svmOwner,
    pollInterval: PollingInterval.KindaFast,
    fetchPolicy: 'cache-and-network',
  })

  const { isTestnetModeEnabled } = useEnabledChains()
  // re-order token balances to visible and hidden
  const { shownTokens, hiddenTokens } = useTokenBalancesGroupedByVisibility({
    balancesById,
  })
  // Hides balances for spam tokens so sorts them last
  const sortedHiddenTokens = useMemo(
    () =>
      hiddenTokens?.sort((a, b) => {
        if (a.currencyInfo.isSpam && !b.currencyInfo.isSpam) {
          return 1
        } else if (b.currencyInfo.isSpam && !a.currencyInfo.isSpam) {
          return -1
        }
        return 0
      }),
    [hiddenTokens],
  )

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
      ...(sortedHiddenTokens?.length ? [HIDDEN_TOKEN_BALANCES_ROW] : []),
      ...(hiddenTokensExpanded && sortedHiddenTokens ? sortedHiddenTokens : []),
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
  }, [sortedHiddenTokens, hiddenTokensExpanded, shownTokens, isTestnetModeEnabled])

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
      evmOwner,
      svmOwner,
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
      evmOwner,
      svmOwner,
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
