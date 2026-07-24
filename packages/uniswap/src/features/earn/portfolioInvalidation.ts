import type { QueryClient } from '@tanstack/react-query'
import { getPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { logger } from 'utilities/src/logger/logger'

export function invalidateEarnPortfolioQuery({
  caller,
  evmAddress,
  queryClient,
}: {
  caller: string
  evmAddress: Address | undefined
  queryClient: QueryClient
}): void {
  if (!evmAddress) {
    return
  }

  const queryKey = getPortfolioQuery({ input: { evmAddress } }).queryKey

  queryClient
    .cancelQueries({ queryKey })
    .then(() => queryClient.invalidateQueries({ queryKey }))
    .catch((error) => {
      logger.error(error, {
        tags: {
          file: 'portfolioInvalidation.ts',
          function: caller,
        },
      })
    })
}
