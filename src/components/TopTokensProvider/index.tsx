import { useWeb3React } from '@web3-react/core'
import { filterTimeAtom } from 'components/Tokens/state'
import { TopTokens100Query } from 'graphql/data/__generated__/TopTokens100Query.graphql'
import { topTokens100Query } from 'graphql/data/TopTokens'
import { chainIdToBackendName, toHistoryDuration } from 'graphql/data/util'
import { useAtomValue } from 'jotai/utils'
import useInterval from 'lib/hooks/useInterval'
import ms from 'ms.macro'
import { createContext, PropsWithChildren } from 'react'
import { PreloadedQuery, useQueryLoader } from 'react-relay'

const TopTokensContext = createContext<PreloadedQuery<TopTokens100Query> | null | undefined>(undefined)

export default function TopTokensProvider({ children }: PropsWithChildren) {
  const [queryReference, loadQuery] = useQueryLoader<TopTokens100Query>(topTokens100Query)
  const chain = chainIdToBackendName(useWeb3React().chainId)
  const duration = toHistoryDuration(useAtomValue(filterTimeAtom))

  useInterval(() => loadQuery({ chain, duration }), ms`60s`)

  return <TopTokensContext.Provider value={queryReference}>{children}</TopTokensContext.Provider>
}
