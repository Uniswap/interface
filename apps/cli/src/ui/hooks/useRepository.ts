import { detectRepository } from '@universe/cli/src/lib/team-resolver'
import { useEffect, useState } from 'react'

interface Repository {
  owner: string
  name: string
}

interface UseRepositoryResult {
  repository: Repository | null
  loading: boolean
  error: Error | null
}

export function useRepository(): UseRepositoryResult {
  const [repository, setRepository] = useState<Repository | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function detect(): Promise<void> {
      try {
        setLoading(true)
        setError(null)
        const detected = await detectRepository()
        if (!cancelled) {
          if (detected && detected.owner && detected.name) {
            setRepository({ owner: detected.owner, name: detected.name })
          } else {
            setRepository(null)
          }
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- Intentionally fire-and-forget promise
    detect()

    return () => {
      cancelled = true
    }
  }, [])

  return { repository, loading, error }
}
