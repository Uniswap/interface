import { useWeb3React } from '@web3-react/core'
import { filterTimeAtom } from 'components/Tokens/state'
import { TopTokens100Query } from 'graphql/data/__generated__/TopTokens100Query.graphql'
import { topTokens100Query } from 'graphql/data/TopTokens'
import { chainIdToBackendName, toHistoryDuration } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
// import useInterval from 'lib/hooks/useInterval'
// import ms from 'ms.macro'
import { createContext, PropsWithChildren, useContext } from 'react'
import { loadQuery, PreloadedQuery, useRelayEnvironment } from 'react-relay'

const TopTokensContext = createContext<PreloadedQuery<TopTokens100Query> | undefined>(undefined)

export default function TopTokensProvider({ children }: PropsWithChildren) {
  const environment = useRelayEnvironment()
  const chain = chainIdToBackendName(useWeb3React().chainId)
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))
  const queryRef = loadQuery<TopTokens100Query>(environment, topTokens100Query, { chain, duration })

  //useInterval(() => loadQuery({ chain, duration }), ms`60s`)

  return <TopTokensContext.Provider value={queryRef}>{children}</TopTokensContext.Provider>
}

export function usePreloadedTopTokens() {
  const topTokensRef = useContext(TopTokensContext)
  if (topTokensRef === undefined) {
    throw new Error('TopTokens hooks must be wrapped in a <TopTokensProvider>')
  }
  return topTokensRef
}
