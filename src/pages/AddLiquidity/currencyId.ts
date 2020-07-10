import { Token, ChainId, WETH } from '@uniswap/sdk'

export function currencyId(...args: [ChainId | undefined, string] | [Token]): string {
  if (args.length === 2) {
    const [chainId, tokenAddress] = args
    return chainId && tokenAddress === WETH[chainId].address ? 'ETH' : tokenAddress
  } else if (args.length === 1) {
    const [token] = args
    return currencyId(token.chainId, token.address)
  } else {
    throw new Error('unexpected call signature')
  }
}
