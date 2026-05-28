import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

export const priceKeys = {
  all: [ReactQueryCacheKey.TokenPrice] as const,
  token: (chainId: number, address: string) => [ReactQueryCacheKey.TokenPrice, chainId, address.toLowerCase()] as const,
} as const
