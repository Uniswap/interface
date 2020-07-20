import { ChainId, Token, WETH } from '@uniswap/sdk'
import KOVAN_TOKENS from './kovan'
import MAINNET_TOKENS from './mainnet'
import RINKEBY_TOKENS from './rinkeby'
import ROPSTEN_TOKENS from './ropsten'

type AllTokens = Readonly<{ [chainId in ChainId]: Readonly<{ [tokenAddress: string]: Token }> }>
export const ALL_TOKENS: AllTokens = [
  // WETH on all chains
  ...Object.values(WETH),
  // chain-specific tokens
  ...MAINNET_TOKENS,
  ...RINKEBY_TOKENS,
  ...KOVAN_TOKENS,
  ...ROPSTEN_TOKENS
]
  // put into an object
  .reduce<AllTokens>(
    (tokenMap, token) => {
      if (tokenMap[token.chainId][token.address] !== undefined) throw Error('Duplicate tokens.')
      return {
        ...tokenMap,
        [token.chainId]: {
          ...tokenMap[token.chainId],
          [token.address]: token
        }
      }
    },
    {
      [ChainId.MAINNET]: {},
      [ChainId.RINKEBY]: {},
      [ChainId.GÖRLI]: {},
      [ChainId.ROPSTEN]: {},
      [ChainId.KOVAN]: {}
    }
  )
