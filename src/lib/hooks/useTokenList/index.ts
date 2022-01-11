import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { atom, useAtom } from 'jotai'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useEffect, useMemo, useState } from 'react'

import fetchTokenList from './fetchTokenList'
import { ChainTokenMap, TokenMap, tokensToChainTokenMap } from './utils'
import { validateTokens } from './validateTokenList'

export { DEFAULT_TOKEN_LIST } from './fetchTokenList'

const chainTokenMapAtom = atom<ChainTokenMap>({})

export default function useTokenList(list?: string | TokenInfo[]): TokenMap {
  const { chainId, library } = useActiveWeb3React()
  const [chainTokenMap, setChainTokenMap] = useAtom(chainTokenMapAtom)

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

  return useMemo(() => {
    return (chainId && chainTokenMap[chainId]) || {}
  }, [chainId, chainTokenMap])
}
