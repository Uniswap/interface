import { Token } from '@uniswap/sdk-core'
import { TokenData } from 'src/features/historicalChainData/types'

export function parseTokenData(data?: TokenData[]) {
  return data
    ? data.map(({ open, close, high, low, ...rest }) => ({
        ...rest,
        open: parseFloat(open),
        close: parseFloat(close),
        high: parseFloat(high),
        low: parseFloat(low),
      }))
    : undefined
}

export function getTokenQueryKey({ address, chainId }: Token, additional?: {}) {
  return {
    address: address.toLowerCase(),
    chainId,
    ...additional,
  }
}
