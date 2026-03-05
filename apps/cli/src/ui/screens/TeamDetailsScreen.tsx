import { fetchTeamMembers, type TeamMember } from '@universe/cli/src/lib/team-members'
import { resolveTeam } from '@universe/cli/src/lib/team-resolver'
import { Select } from '@universe/cli/src/ui/components/Select'
import { StatusBadge } from '@universe/cli/src/ui/components/StatusBadge'
import { type TeamFilter, useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import type { GitHubTeam } from '@universe/cli/src/ui/hooks/useTeams'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import { useEffect, useState } from 'react'

interface TeamDetailsScreenProps {
  team: GitHubTeam
  org: string
  onSelect: (teamFilter: TeamFilter) => void
  onBack: () => void
}

export function TeamDetailsScreen({ team, org, onSelect, onBack }: TeamDetailsScreenProps): JSX.Element {
  const { dispatch } = useAppState()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadMembers = async (): Promise<void> => {
      try {
        setLoading(true)
        setError(null)

        // Fetch members for display
        const fetchedMembers = await fetchTeamMembers(org, team.slug)

        if (!cancelled) {
          setMembers(fetchedMembers)

          // Also resolve to emails/usernames and cache for later use
          const teamSlug = `@${org}/${team.slug}`
          try {
            const { emails, usernames } = await resolveTeam(teamSlug)
            dispatch({
              type: 'CACHE_TEAM_MEMBERS',
              teamSlug,
              members: { emails, usernames },
            })
          } catch {
            // If resolveTeam fails, continue with display but don't cache
            // The user can still see members, just won't be cached
          }

          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to fetch team members'))
          setLoading(false)
        }
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises -- Intentionally fire-and-forget promise
    loadMembers()

    return () => {
      cancelled = true
    }
  }, [org, team.slug, dispatch])

  const handleSelectTeam = (): void => {
    const teamFilter: TeamFilter = {
      teams: [`@${org}/${team.slug}`],
    }
    dispatch({ type: 'SET_TEAM_FILTER', filter: teamFilter })
    onSelect(teamFilter)
  }

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={2}>
        <Text bold color={colors.primary}>
          Team Details
        </Text>
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold>
          @{org}/{team.slug}
        </Text>
        <Text>{team.name}</Text>
        {team.description && <Text dimColor>{team.description}</Text>}
      </Box>

      <Box flexDirection="column" marginBottom={2}>
        <Text bold color={colors.primary}>
          Members
        </Text>

        {loading && (
          <Box marginTop={1}>
            <Text color={colors.primary}>
              <Spinner type="dots" />
            </Text>
            <Text> Loading members...</Text>
          </Box>
        )}

        {error && (
          <Box marginTop={1}>
            <StatusBadge type="error">{error.message}</StatusBadge>
          </Box>
        )}

        {!loading && !error && members.length === 0 && (
          <Box marginTop={1}>
            <Text dimColor>No members found</Text>
          </Box>
        )}

        {!loading && !error && members.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text dimColor>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </Text>
            <Box flexDirection="column" marginTop={1} paddingLeft={2}>
              {members.map((member) => (
                <Text key={member.login}>
                  • {member.name ? `${member.name} (@${member.login})` : `@${member.login}`}
                </Text>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Select
        items={[
          { label: '✓ Select This Team', value: 'select' },
          { label: '← Back to Teams', value: 'back' },
        ]}
        onSelect={(item: { value: string }) => {
          if (item.value === 'select') {
            handleSelectTeam()
          } else {
            onBack()
          }
        }}
      />
    </Box>
  )
}
