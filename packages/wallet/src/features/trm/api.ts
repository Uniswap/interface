import { ONE_HOUR_MS } from 'utilities/src/time/time'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useRestQuery } from 'wallet/src/data/rest'

type ScreenResponse = {
  block: boolean
}

export function useTrmQuery(address?: string): ReturnType<typeof useRestQuery<ScreenResponse>> {
  return useRestQuery<ScreenResponse, { address?: string }>(
    uniswapUrls.trmPath,
    { address },
    ['block'],
    {
      ttlMs: ONE_HOUR_MS,
      skip: !address,
    }
  )
}
