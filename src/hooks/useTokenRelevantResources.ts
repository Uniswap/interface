import { useEffect, useState } from 'react'

interface RelevantResource {
  name: string
  url: string
  displayName: string
}

interface RelevantResourcesMap {
  [address: string]: RelevantResource[]
}

interface useTokenRelevantResourcesResult {
  data: RelevantResourcesMap | null
  error: string | null
  loading: boolean
}

const FAKE_TOKEN_RELEVANT_RESOURCES = {
  '0x03ab458634910aad20ef5f1c8ee96f1d6ac54919': [
    {
      name: 'github',
      url: 'https://github.com/reflexer-labs/',
      displayName: 'Github',
    },
    {
      name: 'website',
      url: 'https://reflexer.finance/',
      displayName: 'reflexer.finance',
    },
  ],
  '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e': [
    {
      name: 'github',
      url: 'https://github.com/pooltogether/',
      displayName: 'Github',
    },
    {
      name: 'website',
      url: 'https://pooltogether.com/',
      displayName: 'pooltogether.com',
    },
  ],
}

const useTokenRelevantResources = (addresses: Set<string>): useTokenRelevantResourcesResult => {
  const [data, setData] = useState<RelevantResourcesMap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchRelevantResources = async (addresses: Set<string>): Promise<RelevantResourcesMap | void> => {
    const waitRandom = (min: number, max: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, min + Math.round(Math.random() * Math.max(0, max - min))))
    try {
      setLoading(true)
      setError(null)
      console.log('useTokenRelevantResources.fetchRelevantResources', addresses)
      await waitRandom(250, 2000)
      if (Math.random() < 0.05) {
        throw new Error('fake error')
      }
      return FAKE_TOKEN_RELEVANT_RESOURCES
    } catch (e) {
      setError('something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchRelevantResources(addresses)
      .then((data) => {
        if (data) setData(data)
      })
      .catch((e) => setError(e))
      .finally(() => setLoading(false))
  }, [addresses])

  return { data, error, loading }
}

export default useTokenRelevantResources
