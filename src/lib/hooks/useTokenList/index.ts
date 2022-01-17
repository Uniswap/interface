import { Token } from '@uniswap/sdk-core'
import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { atom } from 'jotai'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useEffect, useMemo, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import fetchTokenList from './fetchTokenList'
import { useQueryTokens } from './querying'
import { ChainTokenMap, tokensToChainTokenMap } from './utils'
import { validateTokens } from './validateTokenList'

export { DEFAULT_TOKEN_LIST } from './fetchTokenList'

const chainTokenMapAtom = atom<ChainTokenMap>({})

export default function useTokenList(list?: string | TokenInfo[]) {
  const { chainId, library } = useActiveWeb3React()
  const setChainTokenMap = useUpdateAtom(chainTokenMapAtom)

  // Error boundaries will not catch (non-rendering) async errors, but it should still be shown
  const [error, setError] = useState<Error>()
  if (error) throw error

  useEffect(() => {
    if (list !== undefined) {
      let tokens: Promise<TokenList | TokenInfo[]>
      if (typeof list === 'string') {
        tokens = fetchTokenList(list, (ensName: string) => {
          if (library && chainId === 1) {
            return resolveENSContentHash(ensName, library)
          }
          throw new Error('Could not construct mainnet ENS resolver')
        })
      } else {
        tokens = validateTokens(list)
      }
      tokens.then(tokensToChainTokenMap).then(setChainTokenMap).catch(setError)
    }
  }, [chainId, library, list, setChainTokenMap])
}

export type TokenMap<T extends Token> = { [address: string]: T }

export function useTokenMap(): TokenMap<WrappedTokenInfo> {
  const { chainId } = useActiveWeb3React()
  const chainTokenMap = useAtomValue(chainTokenMapAtom)
  return useMemo(() => {
    return Object.entries((chainId && chainTokenMap[chainId]) || {}).reduce((map, [address, { token }]) => {
      map[address] = token
      return map
    }, {} as TokenMap<WrappedTokenInfo>)
  }, [chainId, chainTokenMap])
}

export function useQueryTokenList(query: string) {
  const map = useTokenMap()
  const list = useMemo(() => Object.values(map), [map])
  return useQueryTokens(query, list)
}
