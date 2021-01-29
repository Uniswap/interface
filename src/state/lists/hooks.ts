import { ChainId, Token, TokenInfo, TokenList } from 'dxswap-sdk'
import { useSelector } from 'react-redux'
import { AppState } from '../index'

/**
 * Token instances created from token info.
 */
export class WrappedTokenInfo extends Token {
  public readonly tokenInfo: TokenInfo
  constructor(tokenInfo: TokenInfo) {
    super(tokenInfo.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)
    this.tokenInfo = tokenInfo
  }
}

export type TokenAddressMap = { [chainId in ChainId]: { [tokenAddress: string]: WrappedTokenInfo } }

/**
 * An empty result, useful as a default.
 */
const EMPTY_LIST: TokenAddressMap = {
  [ChainId.KOVAN]: {},
  [ChainId.RINKEBY]: {},
  [ChainId.ROPSTEN]: {},
  [ChainId.GÖRLI]: {},
  [ChainId.MAINNET]: {},
  [ChainId.ARBITRUM_TESTNET_V3]: {}
}

export function tokenListToTokenMap(list: TokenInfo[]): TokenAddressMap {
  const map = EMPTY_LIST
  list.forEach(tokenInfo => {
    const token = new WrappedTokenInfo(tokenInfo)
    if (!map[token.chainId][token.address]) map[token.chainId][token.address] = token
  })
  return map
}

export function useTokenList(): TokenAddressMap {
  const tokenList: TokenList = useSelector<AppState, AppState['tokenList']>(state => state.tokenList)
  return tokenListToTokenMap(tokenList.tokens)
}
