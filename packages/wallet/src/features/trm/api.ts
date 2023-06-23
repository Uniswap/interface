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
      skip: !address,
    }
  )
}
