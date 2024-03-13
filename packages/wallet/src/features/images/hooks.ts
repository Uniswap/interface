import { ApolloClient, from } from '@apollo/client'
import { RetryLink } from '@apollo/client/link/retry'
import { RestLink } from 'apollo-link-rest'
import { useMemo } from 'react'
import { config } from 'uniswap/src/config'
import { createNewInMemoryCache } from 'uniswap/src/data/cache'
import { useRestQuery } from 'uniswap/src/data/rest'
import { GqlResult } from 'uniswap/src/data/types'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { SvgData, fetchSVG } from 'wallet/src/features/images/utils'

const restLink = new RestLink({
  uri: `${config.simpleHashApiUrl}/api/v0`,
  headers: {
    'X-API-KEY': config.simpleHashApiKey,
  },
})

const retryLink = new RetryLink()

const apolloClient = new ApolloClient({
  link: from([retryLink, restLink]),
  cache: createNewInMemoryCache(),
  defaultOptions: {
    watchQuery: {
      // ensures query is returning data even if some fields errored out
      errorPolicy: 'all',
      fetchPolicy: 'cache-first',
    },
  },
})

type PreviewsResponse = {
  previews: {
    image_small_url: string | null
    image_medium_url: string | null
    image_large_url: string | null
    image_opengraph_url: string | null
    blurhash: string | null
    predominant_color: string | null
  } | null
}

export function useNftPreviewUri(
  contractAddress: string,
  tokenId: string
): GqlResult<PreviewsResponse> {
  return useRestQuery<PreviewsResponse>(
    `/nfts/ethereum/${contractAddress}/${tokenId}`,
    { contractAddress, tokenId },
    ['previews'],
    { ttlMs: 5 * ONE_MINUTE_MS },
    'GET',
    apolloClient
  )
}

export function useSvgData(uri: string, autoplay = false): SvgData | undefined {
  const { fetchSvgData, abortRequest } = useMemo(() => {
    const controller = new AbortController()

    const fetchData = async (): Promise<SvgData | undefined> => {
      try {
        return await fetchSVG(uri, autoplay, controller.signal)
      } catch (error) {
        logger.error(error, { tags: { file: 'WebSvgUri', function: 'fetchSvg' }, extra: { uri } })
      }
    }

    return {
      fetchSvgData: fetchData,
      abortRequest: () => controller.abort(),
    }
  }, [autoplay, uri])

  return useAsyncData(fetchSvgData, abortRequest).data
}
