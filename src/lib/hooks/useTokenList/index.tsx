import { Token } from '@uniswap/sdk-core'
import { TokenInfo, TokenList } from '@uniswap/token-lists'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import fetchTokenList from './fetchTokenList'
import { ChainTokenMap, tokensToChainTokenMap } from './utils'
import { validateTokens } from './validateTokenList'

export { useQueryTokens } from './useQueryTokens'

export const DEFAULT_TOKEN_LIST = 'https://gateway.ipfs.io/ipns/tokens.uniswap.org'

const MISSING_PROVIDER = Symbol()
const ChainTokenMapContext = createContext<ChainTokenMap | undefined | typeof MISSING_PROVIDER>(MISSING_PROVIDER)

function useChainTokenMapContext() {
  const chainTokenMap = useContext(ChainTokenMapContext)
  if (chainTokenMap === MISSING_PROVIDER) {
    throw new Error('TokenList hooks must be wrapped in a <TokenListProvider>')
  }
  return chainTokenMap
}

export function useIsTokenListLoaded() {
  return Boolean(useChainTokenMapContext())
}

export default function useTokenList(): WrappedTokenInfo[] {
  const { chainId } = useActiveWeb3React()
  const chainTokenMap = useChainTokenMapContext()
  const tokenMap = chainId && chainTokenMap?.[chainId]
  return useMemo(() => {
    if (!tokenMap) return []
    return Object.values(tokenMap).map(({ token }) => token)
  }, [tokenMap])
}

export type TokenMap = { [address: string]: Token }

export function useTokenMap(): TokenMap {
  const { chainId } = useActiveWeb3React()
  const chainTokenMap = useChainTokenMapContext()
  const tokenMap = chainId && chainTokenMap?.[chainId]
  return useMemo(() => {
    if (!tokenMap) return {}
    return Object.entries(tokenMap).reduce((map, [address, { token }]) => {
      map[address] = token
      return map
    }, {} as TokenMap)
  }, [tokenMap])
}

export function TokenListProvider({
  list = DEFAULT_TOKEN_LIST,
  children,
}: PropsWithChildren<{ list?: string | TokenInfo[] }>) {
  // Error boundaries will not catch (non-rendering) async errors, but it should still be shown
  const [error, setError] = useState<Error>()
  if (error) throw error

  const [chainTokenMap, setChainTokenMap] = useState<ChainTokenMap>()

  useEffect(() => setChainTokenMap(undefined), [list])

  const { chainId, library } = useActiveWeb3React()
  const resolver = useCallback(
    (ensName: string) => {
      if (library && chainId === 1) {
        return resolveENSContentHash(ensName, library)
      }
      throw new Error('Could not construct mainnet ENS resolver')
    },
    [chainId, library]
  )

  useEffect(() => {
    // If the list was already loaded, don't reload it.
    if (chainTokenMap) return

    let stale = false
    activateList(list)
    return () => {
      stale = true
    }

    async function activateList(list: string | TokenInfo[]) {
      try {
        let tokens: TokenList | TokenInfo[]
        if (typeof list === 'string') {
          tokens = await fetchTokenList(list, resolver)
        } else {
          tokens = await validateTokens(list)
        }
        // tokensToChainTokenMap also caches the fetched tokens, so it must be invoked even if stale.
        const map = tokensToChainTokenMap(tokens)
        if (!stale) {
          setChainTokenMap(map)
          setError(undefined)
        }
      } catch (e: unknown) {
        if (!stale) {
          // Do not update the token map, in case the map was already resolved without error on mainnet.
          setError(e as Error)
        }
      }
    }
  }, [chainTokenMap, list, resolver])

  return <ChainTokenMapContext.Provider value={chainTokenMap}>{children}</ChainTokenMapContext.Provider>
}
