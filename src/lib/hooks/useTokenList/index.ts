import { NativeCurrency, Token } from '@uniswap/sdk-core'
import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import fetchTokenList from './fetchTokenList'
import { useQueryTokens } from './querying'
import { ChainTokenMap, tokensToChainTokenMap } from './utils'
import { validateTokens } from './validateTokenList'

export const DEFAULT_TOKEN_LIST = 'https://gateway.ipfs.io/ipns/tokens.uniswap.org'

const chainTokenMapAtom = atom<ChainTokenMap | undefined>(undefined)

export function useIsTokenListLoaded() {
  return Boolean(useAtomValue(chainTokenMapAtom))
}

export function useSyncTokenList(list: string | TokenInfo[] = DEFAULT_TOKEN_LIST): void {
  const { chainId, library } = useActiveWeb3React()
  const setChainTokenMap = useUpdateAtom(chainTokenMapAtom)

  // Error boundaries will not catch (non-rendering) async errors, but it should still be shown
  const [error, setError] = useState<Error>()
  if (error) throw error

  const resolver = useCallback(
    (ensName: string) => {
      if (library && chainId === 1) {
        // TODO(zzmp): Use network resolver when wallet is not on chainId === 1.
        return resolveENSContentHash(ensName, library)
      }
      throw new Error('Could not construct mainnet ENS resolver')
    },
    [chainId, library]
  )
  useEffect(() => {
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
        const tokenMap = tokensToChainTokenMap(tokens) // also caches the fetched tokens, so it is invoked even if stale
        if (!stale) {
          setChainTokenMap(tokenMap)
          setError(undefined)
        }
      } catch (e: unknown) {
        if (!stale) {
          setChainTokenMap(undefined)
          setError(e as Error)
        }
      }
    }
  }, [list, resolver, setChainTokenMap])
}

export default function useTokenList(): WrappedTokenInfo[] {
  const { chainId } = useActiveWeb3React()
  const chainTokenMap = useAtomValue(chainTokenMapAtom)
  const tokenMap = chainId && chainTokenMap?.[chainId]
  return useMemo(() => {
    if (!tokenMap) return []
    return Object.values(tokenMap).map(({ token }) => token)
  }, [tokenMap])
}

export type TokenMap = { [address: string]: Token }

export function useTokenMap(): TokenMap {
  const { chainId } = useActiveWeb3React()
  const chainTokenMap = useAtomValue(chainTokenMapAtom)
  const tokenMap = chainId && chainTokenMap?.[chainId]
  return useMemo(() => {
    if (!tokenMap) return {}
    return Object.entries(tokenMap).reduce((map, [address, { token }]) => {
      map[address] = token
      return map
    }, {} as TokenMap)
  }, [tokenMap])
}

export function useQueryCurrencies(query = ''): (WrappedTokenInfo | NativeCurrency)[] {
  return useQueryTokens(query, useTokenList())
}
