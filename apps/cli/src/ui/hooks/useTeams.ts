import { $ } from 'bun'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface GitHubTeam {
  name: string
  slug: string
  description: string | null
  membersCount?: number
}

interface UseTeamsResult {
  teams: GitHubTeam[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

/**
 * Hook to fetch teams from a GitHub organization
 */
export function useTeams(org: string | null): UseTeamsResult {
  const [teams, setTeams] = useState<GitHubTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isFetchingRef = useRef(false)
  const lastFetchedOrgRef = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    if (!org) {
      setLoading(false)
      return
    }

    // Guard: Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      return
    }

    // Guard: Don't re-fetch if we already fetched for this org
    if (lastFetchedOrgRef.current === org) {
      return
    }

    try {
      isFetchingRef.current = true
      setLoading(true)
      setError(null)

      // Fetch teams from GitHub API
      const teamsResult =
        await $`gh api /orgs/${org}/teams --jq '.[] | {name: .name, slug: .slug, description: .description}'`.text()

      const teamLines = teamsResult.trim().split('\n').filter(Boolean)
      const parsedTeams: GitHubTeam[] = teamLines
        .map((line: string) => {
          try {
            const parsed = JSON.parse(line) as GitHubTeam
            return parsed
          } catch {
            return null
          }
        })
        .filter((team: GitHubTeam | null): team is GitHubTeam => team !== null)

      setTeams(parsedTeams)
      lastFetchedOrgRef.current = org
      setLoading(false)
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error(`Failed to fetch teams from org "${org}". Ensure gh CLI is authenticated.`),
      )
      setLoading(false)
    } finally {
      isFetchingRef.current = false
    }
  }, [org])

  useEffect(() => {
    // Only fetch on initial mount or when org changes
    if (org && lastFetchedOrgRef.current !== org) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- Intentionally fire-and-forget promise
      refresh()
    }
  }, [org, refresh])

  return {
    teams,
    loading,
    error,
    refresh,
  }
}
