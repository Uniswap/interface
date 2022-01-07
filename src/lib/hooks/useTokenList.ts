import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { atom, useAtom } from 'jotai'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import fetchTokenList, { getTokenInfo } from 'lib/utils/fetchTokenList'
import resolveENSContentHash from 'lib/utils/resolveENSContentHash'
import { useEffect, useMemo, useState } from 'react'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

export type TokenMap = Readonly<{ [tokenAddress: string]: WrappedTokenInfo }>
type ChainTokenMap = Readonly<{ [chainId: number]: TokenMap }>
type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

const chainTokenMapAtom = atom<ChainTokenMap>({})

function tokensToTokenMap(tokens: TokenList | TokenInfo[]) {
  const [list, infos] = Array.isArray(tokens) ? [undefined, tokens] : [tokens, tokens.tokens]
  return infos.reduce<Mutable<ChainTokenMap>>((map, info) => {
    const token = new WrappedTokenInfo(info, list)
    if (map[token.chainId]?.[token.address] !== undefined) {
      console.warn(`Duplicate token skipped: ${token.address}`)
      return map
    }
    if (!map[token.chainId]) {
      map[token.chainId] = {}
    }
    map[token.chainId][token.address] = token
    return map
  }, {}) as ChainTokenMap
}

const listCache = new Map<string, TokenList>()

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
        const cached = listCache?.get(list) // avoid spurious re-fetches from web3 thrashing
        if (cached) {
          tokens = Promise.resolve(cached)
        } else {
          const tokenlist = (tokens = fetchTokenList(list, (ensName: string) => {
            if (library && chainId === 1) {
              return resolveENSContentHash(ensName, library)
            }
            throw new Error('Could not construct mainnet ENS resolver')
          }))
          tokenlist.then((tokens) => listCache?.set(list, tokens))
        }
      } else {
        tokens = getTokenInfo(list)
      }
      tokens.then(tokensToTokenMap).then(setChainTokenMap).catch(setError)
    }
  }, [chainId, library, list, setChainTokenMap])

  return useMemo(() => {
    return (chainId && chainTokenMap[chainId]) || {}
  }, [chainId, chainTokenMap])
}
