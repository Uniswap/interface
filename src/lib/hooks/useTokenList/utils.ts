import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

type TokenMap = Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list?: TokenList } }>
// TODO(INFRA-164): replace usage of the misnomered TokenAddressMap w/ ChainTokenMap from src/hooks/Tokens.ts
export type TokenAddressMap = Readonly<{ [chainId: number]: TokenMap }>

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

const mapCache = typeof WeakMap !== 'undefined' ? new WeakMap<TokenList | TokenInfo[], TokenAddressMap>() : null

export function tokensToChainTokenMap(tokens: TokenList | TokenInfo[]): TokenAddressMap {
  const cached = mapCache?.get(tokens)
  if (cached) return cached

  const [list, infos] = Array.isArray(tokens) ? [undefined, tokens] : [tokens, tokens.tokens]
  const map = infos.reduce<Mutable<TokenAddressMap>>((map, info) => {
    try {
      const token = new WrappedTokenInfo(info, list)
      if (map[token.chainId]?.[token.address] !== undefined) {
        console.warn(`Duplicate token skipped: ${token.address}`)
        return map
      }
      if (!map[token.chainId]) {
        map[token.chainId] = {}
      }
      map[token.chainId][token.address] = { token, list }
      return map
    } catch {
      return map
    }
  }, {}) as TokenAddressMap
  mapCache?.set(tokens, map)
  return map
}
