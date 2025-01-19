import { useCallback, useEffect, useState } from 'react'
import { StatsResponse, fetchEFPStats } from 'utils/fetchEFPStats'

export default function useEFPStats(nameOrAddress: string | Address) {
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    const fetchedStats = await fetchEFPStats(nameOrAddress)
    setStats(fetchedStats)
    setIsLoading(false)
  }, [nameOrAddress])

  useEffect(() => {
    setIsLoading(true)
    fetchStats()
  }, [fetchStats])

  const getStatLink = useCallback(
    (stat: string) => {
      return `https://ethfollow.xyz/${nameOrAddress}?tab=${stat}`
    },
    [nameOrAddress],
  )

  return { stats, isLoading, getStatLink }
}
