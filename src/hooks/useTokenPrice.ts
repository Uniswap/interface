import { useEffect, useState } from 'react'

enum TimePeriod {
  hour = 'hour',
  day = 'day',
  week = 'week',
  month = 'month',
  year = 'year',
}

type Dictionary<K extends keyof any, T> = Partial<Record<K, T>>

type TokenData = {
  [address: string]: {
    price: number
    delta: Dictionary<TimePeriod, number>
  }
}

interface UseTokenPriceResult {
  data: TokenData | null
  error: string | null
  loading: boolean
}

const FAKE_TOKEN_PRICE_RESULT = {
  '0x03ab458634910aad20ef5f1c8ee96f1d6ac54919': {
    price: 3.05,
    delta: {
      [TimePeriod.hour]: 25_000,
      [TimePeriod.day]: 619_000,
      [TimePeriod.week]: 16_800_000,
      [TimePeriod.month]: 58_920_000,
    },
  },
  '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e': {
    price: 0.66543,
    delta: {
      [TimePeriod.hour]: 5_000,
      [TimePeriod.day]: 100_000,
      [TimePeriod.week]: 800_000,
      [TimePeriod.month]: 4_920_000,
    },
  },
}

const useTokenPrice = (tokenAddresses: Set<string>): UseTokenPriceResult => {
  const [data, setData] = useState<TokenData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTokenPrices = async (addresses: Set<string>): Promise<TokenData | void> => {
    const waitRandom = (min: number, max: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, min + Math.round(Math.random() * Math.max(0, max - min))))
    try {
      setLoading(true)
      setError(null)
      await waitRandom(250, 2000)
      if (Math.random() < 0.05) {
        throw new Error('fake error')
      }
      console.log('fetchTokenPrices', addresses)
      return FAKE_TOKEN_PRICE_RESULT
    } catch (e) {
      setError('something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchTokenPrices(tokenAddresses)
      .then((data) => {
        if (data) setData(data)
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [tokenAddresses])

  return { data, error, loading }
}

export default useTokenPrice
