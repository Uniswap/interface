import useSWR from 'swr'

import { VERSION } from 'constants/v2'

interface APRResponse {
  max_apr: {
    value: number
    id: string
    chain_id: number
    is_farm: boolean
    type?: VERSION.CLASSIC | VERSION.ELASTIC
  }
  total_earnings: number
}

export default function useAggregatorAPR(): APRResponse {
  const fetcher = (url: string) => fetch(url).then(r => r.json())

  const url = `${process.env.REACT_APP_AGGREGATOR_STATS_API}/api/max-apr-and-total-earning`

  const { data, error } = useSWR(url, fetcher, {
    refreshInterval: 10000,
    onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
      // Never retry on 404.
      if (error.status === 404) return

      // Only retry up to 10 times.
      if (retryCount >= 10) return

      if (error.status === 403) {
        // If API return 403, retry after 30 seconds.
        setTimeout(() => revalidate({ retryCount }), 30000)
        return
      }

      // Retry after 5 seconds.
      setTimeout(() => revalidate({ retryCount }), 5000)
    },
  })

  if (error) {
    console.error(error.message)
  }

  return data
}
