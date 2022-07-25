import { SupportedChainId } from 'constants/chains'
import { isAddress } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'

// mock data relies on this wip reference:
// https://www.notion.so/uniswaplabs/GraphQL-Schema-eebbd70635ae4acc851e2542cb5de575

enum Currency {
  USD,
}

enum TimePeriod {
  hour = 'hour',
  day = 'day',
  week = 'week',
  month = 'month',
  year = 'year',
  max = 'max',
}

interface HistoricalPrice {
  id: string
  currency: Currency
  priceInCurrency: number
  timestamp: string
}

type TokenDetailPageQueryResult = {
  priceHistory: Partial<Record<SupportedChainId, HistoricalPrice[]>>
  links: {
    name: string
    url: string
    displayable_name: string
  }[]
  marketCap: number
  volume: {
    [TimePeriod.day]: number
  }
}

interface UseTokenDetailPageQueryResult {
  data: TokenDetailPageQueryResult | null
  error: string | null
  loading: boolean
}

const FAKE_TOKEN_DETAIL_PAGE_QUERY_RESULT: TokenDetailPageQueryResult = {
  priceHistory: {
    [SupportedChainId.MAINNET]: [
      {
        id: 'string',
        currency: Currency.USD,
        priceInCurrency: 1000,
        timestamp: 'Sat Jul 23 2022 08:35:30 GMT-0000',
      },
      {
        id: 'string',
        currency: Currency.USD,
        priceInCurrency: 1100,
        timestamp: 'Sat Jul 23 2022 09:35:30 GMT-0000',
      },
      {
        id: 'string',
        currency: Currency.USD,
        priceInCurrency: 900,
        timestamp: 'Sat Jul 23 2022 10:35:30 GMT-0000',
      },
    ],
  },
  links: [
    {
      name: 'github',
      url: 'https://github.com/JFrankfurt',
      displayable_name: 'Github',
    },
    {
      name: 'twitter',
      url: 'https://twitter.com/JordanFrankfurt',
      displayable_name: 'Twitter',
    },
  ],
  marketCap: 1_000_000_000,
  volume: {
    [TimePeriod.day]: 1_000_000,
  },
}

const useTokenDetailPageQuery = (tokenAddress: string | undefined): UseTokenDetailPageQueryResult => {
  const [data, setData] = useState<TokenDetailPageQueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTokenDetails = async (addresses: string): Promise<TokenDetailPageQueryResult | void> => {
    const waitRandom = (min: number, max: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, min + Math.round(Math.random() * Math.max(0, max - min))))
    try {
      setLoading(true)
      setError(null)
      await waitRandom(250, 2000)
      if (Math.random() < 0.05) {
        throw new Error('fake error')
      }
      console.log('fetchTokenDetails', addresses)
      return FAKE_TOKEN_DETAIL_PAGE_QUERY_RESULT
    } catch (e) {
      setError('something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tokenAddress && isAddress(tokenAddress)) {
      setLoading(true)
      setError(null)
      fetchTokenDetails(tokenAddress)
        .then((data) => {
          if (data) setData(data)
        })
        .catch((e) => setError(e))
        .finally(() => setLoading(false))
    }
  }, [tokenAddress])

  return { data, error, loading }
}

export default useTokenDetailPageQuery
