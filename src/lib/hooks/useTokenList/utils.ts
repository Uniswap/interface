import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { ChainTokenMap, MutableChainTokenMap } from 'hooks/Tokens'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

const mapCache = typeof WeakMap !== 'undefined' ? new WeakMap<TokenList | TokenInfo[], ChainTokenMap>() : null

export function tokensToChainTokenMap(tokens: TokenList | TokenInfo[]): ChainTokenMap {
  const cached = mapCache?.get(tokens)
  if (cached) return cached

  const [list, infos] = Array.isArray(tokens) ? [undefined, tokens] : [tokens, tokens.tokens]
  const map = infos.reduce<MutableChainTokenMap>((map, info) => {
    try {
      const token = new WrappedTokenInfo(info, list)
      if (map[token.chainId]?.[token.address] !== undefined) {
        console.warn(`Duplicate token skipped: ${token.address}`)
        return map
      }

      const tokenInfoMap = map[token.chainId] || {}
      tokenInfoMap[token.address] = token
      map[token.chainId] = tokenInfoMap

      return map
    } catch {
      return map
    }
  }, {}) as ChainTokenMap
  mapCache?.set(tokens, map)
  return map
}
