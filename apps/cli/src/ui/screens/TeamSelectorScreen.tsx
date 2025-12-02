/* eslint-disable complexity */
import { Select } from '@universe/cli/src/ui/components/Select'
import { StatusBadge } from '@universe/cli/src/ui/components/StatusBadge'
import { WindowedSelect } from '@universe/cli/src/ui/components/WindowedSelect'
import { type TeamFilter, useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import { type GitHubTeam, useTeams } from '@universe/cli/src/ui/hooks/useTeams'
import { TeamDetailsScreen } from '@universe/cli/src/ui/screens/TeamDetailsScreen'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useState } from 'react'

interface TeamSelectorScreenProps {
  onSelect: (teamFilter: TeamFilter | null) => void
  onBack: () => void
}

export function TeamSelectorScreen({ onSelect, onBack }: TeamSelectorScreenProps): JSX.Element {
  const { state, dispatch } = useAppState()
  const org = state.repository?.owner || null
  const { teams, loading, error } = useTeams(org)
  const [mode, setMode] = useState<'quick' | 'browse' | 'manual' | 'details'>('quick')

  // Team details state (for details screen)
  const [selectedTeamForDetails, setSelectedTeamForDetails] = useState<GitHubTeam | null>(null)
  const [focusedTeam, setFocusedTeam] = useState<GitHubTeam | null>(null)

  // Manual entry state
  const [manualTeams, setManualTeams] = useState('')
  const [manualUsernames, setManualUsernames] = useState('')
  const [manualEmails, setManualEmails] = useState('')
  const [manualStep, setManualStep] = useState<'teams' | 'usernames' | 'emails' | 'confirm'>('teams')

  const quickOptions = [
    { label: '👥 All Contributors - No team filter', value: 'all' },
    { label: '🔍 Browse Teams - Select from organization teams', value: 'browse' },
    { label: '✏️  Manual Entry - Enter specific teams/users/emails', value: 'manual' },
    { label: 'Back', value: 'back' },
  ]

  const handleQuickSelect = (option: { label: string; value: string }): void => {
    if (option.value === 'back') {
      onBack()
      return
    }

    if (option.value === 'all') {
      // No team filter - all contributors
      dispatch({ type: 'SET_TEAM_FILTER', filter: null })
      onSelect(null)
      return
    }

    if (option.value === 'browse') {
      setMode('browse')
      setFocusedTeam(null)
      return
    }

    if (option.value === 'manual') {
      setMode('manual')
      setFocusedTeam(null)
      return
    }
  }

  const handleBrowseSelect = (team: GitHubTeam): void => {
    // Set team filter with selected team
    const teamFilter: TeamFilter = {
      teams: [`@${org}/${team.slug}`],
    }
    dispatch({ type: 'SET_TEAM_FILTER', filter: teamFilter })
    onSelect(teamFilter)
  }

  // Handle Tab key to open team details screen in browse mode
  useInput(
    (input: string, key: { tab?: boolean }) => {
      if (mode === 'browse' && key.tab && focusedTeam) {
        setSelectedTeamForDetails(focusedTeam)
        setMode('details')
      }
    },
    { isActive: mode === 'browse' },
  )

  const handleManualConfirm = (): void => {
    // Build team filter from manual entries
    const teamFilter: TeamFilter = {
      teams: manualTeams
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      usernames: manualUsernames
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean),
      emails: manualEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean),
    }

    // Only set filter if at least one field is filled
    if (
      (teamFilter.teams?.length ?? 0) > 0 ||
      (teamFilter.usernames?.length ?? 0) > 0 ||
      (teamFilter.emails?.length ?? 0) > 0
    ) {
      dispatch({ type: 'SET_TEAM_FILTER', filter: teamFilter })
      onSelect(teamFilter)
    } else {
      // If all empty, treat as "all contributors"
      dispatch({ type: 'SET_TEAM_FILTER', filter: null })
      onSelect(null)
    }
  }

  // Manual entry mode
  if (mode === 'manual') {
    if (manualStep === 'teams') {
      return (
        <Box flexDirection="column" paddingX={2}>
          <Box marginBottom={2}>
            <Text bold color={colors.primary}>
              Manual Entry - Teams
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text>Enter GitHub teams (comma-separated, e.g., @org/team1,@org/team2):</Text>
            <Text dimColor>Press Enter to continue, leave blank to skip</Text>
            <Box marginTop={1}>
              <Text bold>Teams: </Text>
              <TextInput value={manualTeams} onChange={setManualTeams} onSubmit={() => setManualStep('usernames')} />
            </Box>
          </Box>
        </Box>
      )
    }

    if (manualStep === 'usernames') {
      return (
        <Box flexDirection="column" paddingX={2}>
          <Box marginBottom={2}>
            <Text bold color={colors.primary}>
              Manual Entry - Usernames
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text>Enter GitHub usernames (comma-separated, e.g., alice,bob,charlie):</Text>
            <Text dimColor>Press Enter to continue, leave blank to skip</Text>
            <Box marginTop={1}>
              <Text bold>Usernames: </Text>
              <TextInput
                value={manualUsernames}
                onChange={setManualUsernames}
                onSubmit={() => setManualStep('emails')}
              />
            </Box>
          </Box>
        </Box>
      )
    }

    if (manualStep === 'emails') {
      return (
        <Box flexDirection="column" paddingX={2}>
          <Box marginBottom={2}>
            <Text bold color={colors.primary}>
              Manual Entry - Emails
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text>Enter email addresses (comma-separated):</Text>
            <Text dimColor>Press Enter to confirm</Text>
            <Box marginTop={1}>
              <Text bold>Emails: </Text>
              <TextInput value={manualEmails} onChange={setManualEmails} onSubmit={() => setManualStep('confirm')} />
            </Box>
          </Box>
        </Box>
      )
    }

    // manualStep must be 'confirm' at this point
    {
      const hasAnyInput = manualTeams || manualUsernames || manualEmails

      return (
        <Box flexDirection="column" paddingX={2}>
          <Box marginBottom={2}>
            <Text bold color={colors.primary}>
              Manual Entry - Confirm
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text bold>Review your selections:</Text>
            <Box marginTop={1} flexDirection="column">
              <Text>
                <Text bold>Teams:</Text> {manualTeams || '(none)'}
              </Text>
              <Text>
                <Text bold>Usernames:</Text> {manualUsernames || '(none)'}
              </Text>
              <Text>
                <Text bold>Emails:</Text> {manualEmails || '(none)'}
              </Text>
            </Box>

            {!hasAnyInput && (
              <Box marginTop={1}>
                <Text dimColor>No filters entered - will analyze all contributors</Text>
              </Box>
            )}

            <Box marginTop={1}>
              <Select
                items={[
                  { label: 'Confirm', value: 'confirm' },
                  { label: 'Back to Quick Actions', value: 'back' },
                ]}
                onSelect={(item: { value: string }) => {
                  if (item.value === 'confirm') {
                    handleManualConfirm()
                  } else {
                    setMode('quick')
                    setManualStep('teams')
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      )
    }
  }

  // Team details mode
  if (mode === 'details' && selectedTeamForDetails && org) {
    return (
      <TeamDetailsScreen
        team={selectedTeamForDetails}
        org={org}
        onSelect={onSelect}
        onBack={() => {
          setMode('browse')
          setSelectedTeamForDetails(null)
        }}
      />
    )
  }

  // Browse mode
  if (mode === 'browse') {
    const browseOptions = [
      { label: '← Back to Quick Actions', value: 'back' },
      ...teams.map((team: GitHubTeam) => ({
        label: `@${org}/${team.slug} - ${team.name}${team.description ? ` (${team.description})` : ''}`,
        value: team.slug,
        team,
      })),
    ]

    return (
      <Box flexDirection="column" paddingX={2}>
        <Box marginBottom={2}>
          <Text bold color={colors.primary}>
            Select Team
          </Text>
        </Box>
        <Box flexDirection="column">
          {loading && (
            <Box marginBottom={1}>
              <StatusBadge type="info">Loading teams from {org}...</StatusBadge>
            </Box>
          )}
          {error && (
            <Box marginBottom={1}>
              <StatusBadge type="error">Error: {error.message}</StatusBadge>
            </Box>
          )}

          {!loading && !error && (
            <>
              <Text dimColor>
                Found {teams.length} team{teams.length !== 1 ? 's' : ''} in {org}
              </Text>
              {focusedTeam && <Text dimColor>Press Tab to view team members</Text>}
              <WindowedSelect
                items={browseOptions}
                limit={12}
                onSelect={(item: { value: string; team?: GitHubTeam }) => {
                  if (item.value === 'back') {
                    setMode('quick')
                    setFocusedTeam(null)
                  } else if (item.team) {
                    handleBrowseSelect(item.team)
                  }
                }}
                onFocusChange={(item: { value: string; team?: GitHubTeam } | null) => {
                  setFocusedTeam(item?.team ?? null)
                }}
              />
            </>
          )}
        </Box>
      </Box>
    )
  }

  // Default: Quick actions mode
  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={2}>
        <Text bold color={colors.primary}>
          Team Filter Selection
        </Text>
      </Box>
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text>Choose how to filter contributors:</Text>
        </Box>
        <Select items={quickOptions} onSelect={handleQuickSelect} />
      </Box>
    </Box>
  )
}
