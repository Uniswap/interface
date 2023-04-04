import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

type TokenInfoMap = Readonly<{ [tokenAddress in string]?: { token: WrappedTokenInfo; list?: TokenList } }>
export type ChainTokenInfoMap = Readonly<{ [chainId in number]?: TokenInfoMap }>

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

const mapCache = typeof WeakMap !== 'undefined' ? new WeakMap<TokenList | TokenInfo[], ChainTokenInfoMap>() : null

export function tokensToChainTokenInfoMap(tokens: TokenList | TokenInfo[]): ChainTokenInfoMap {
  const cached = mapCache?.get(tokens)
  if (cached) return cached

  const [list, infos] = Array.isArray(tokens) ? [undefined, tokens] : [tokens, tokens.tokens]
  const map = infos.reduce<Mutable<ChainTokenInfoMap>>((map, info) => {
    try {
      const token = new WrappedTokenInfo(info, list)
      if (map[token.chainId]?.[token.address] !== undefined) {
        console.warn(`Duplicate token skipped: ${token.address}`)
        return map
      }

      const tokenInfoMap = map[token.chainId] || {}
      tokenInfoMap[token.address] = { token, list }
      map[token.chainId] = tokenInfoMap

      return map
    } catch {
      return map
    }
  }, {}) as ChainTokenInfoMap
  mapCache?.set(tokens, map)
  return map
}
