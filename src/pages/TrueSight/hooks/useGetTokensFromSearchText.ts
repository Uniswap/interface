import { useEffect, useMemo, useState } from 'react'

export default function useGetTagsFromSearchText(searchText: string) {
  const [data, setData] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()

  useEffect(() => {
    const fetchData = async () => {
      if (searchText) {
        try {
          const url = process.env.REACT_APP_TRUESIGHT_API + '/api/v1/tags?search=' + searchText
          setError(undefined)
          setIsLoading(true)
          const response = await fetch(url)
          if (response.ok) {
            const json = await response.json()
            const rawResult = json.data
            setData(rawResult ?? [])
          }
          setIsLoading(false)
        } catch (err) {
          console.error(err)
          setError(err)
          setIsLoading(false)
        }
      }
    }

    fetchData()
  }, [searchText])

  return useMemo(() => ({ isLoading, data, error }), [data, isLoading, error])
}
