import { uniswapUrls } from 'wallet/src/constants/urls'
import { useRestQuery } from 'wallet/src/data/rest'
import { ONE_DAY_MS } from 'wallet/src/utils/time'

type ScreenResponse = {
  block: boolean
}

export function useTrmQuery(address?: string): ReturnType<typeof useRestQuery<ScreenResponse>> {
  return useRestQuery<ScreenResponse, { address?: string }>(
    uniswapUrls.trmPath,
    { address },
    ['block'],
    {
      ttlMs: ONE_DAY_MS,
      skip: !address,
    }
  )
}
