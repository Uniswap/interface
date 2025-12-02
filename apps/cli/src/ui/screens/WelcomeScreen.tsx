import { Banner } from '@universe/cli/src/ui/components/Banner'
import { Select } from '@universe/cli/src/ui/components/Select'
import { StatusBadge } from '@universe/cli/src/ui/components/StatusBadge'
import { type AnalysisMode, useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import { useRepository } from '@universe/cli/src/ui/hooks/useRepository'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text } from 'ink'
import { useEffect } from 'react'

interface WelcomeScreenProps {
  onContinue: (mode: AnalysisMode) => void
}

export function WelcomeScreen({ onContinue }: WelcomeScreenProps): JSX.Element {
  const { repository, loading, error } = useRepository()
  const { dispatch } = useAppState()

  useEffect(() => {
    if (repository) {
      dispatch({ type: 'SET_REPOSITORY', repository })
    }
  }, [repository, dispatch])

  const options = [
    { label: '📋 Release Changelog - Generate changelog from release tags', value: 'release-changelog' },
    { label: '🐛 Bug Finder - Find which commit introduced a bug', value: 'bug-bisect' },
    { label: '👥 Team Digest - Analyze team activity and contributions', value: 'team-digest' },
    { label: '✏️  Custom Analysis - Time-based analysis with custom prompts', value: 'changelog' },
    { label: 'Quit', value: 'quit' },
  ]

  const handleSelect = (option: { label: string; value: string }): void => {
    if (option.value === 'quit') {
      process.exit(0)
    } else {
      // Set the analysis mode based on selection
      const mode = option.value as AnalysisMode
      dispatch({ type: 'SET_ANALYSIS_MODE', mode })
      onContinue(mode)
    }
  }

  return (
    <Box flexDirection="column" paddingX={2}>
      <Banner />

      <Box flexDirection="column" marginTop={1}>
        {loading && (
          <Box marginBottom={1}>
            <StatusBadge type="info">Detecting repository...</StatusBadge>
          </Box>
        )}

        {error && (
          <Box marginBottom={1}>
            <StatusBadge type="error">Error: {error.message}</StatusBadge>
          </Box>
        )}

        {repository && (
          <Box flexDirection="column" marginBottom={2}>
            <Text dimColor>
              <Text bold>Repository:</Text> {repository.owner}/{repository.name}
            </Text>
            <Text dimColor>
              <Text bold>Platforms:</Text> mobile, extension
            </Text>
          </Box>
        )}

        <Box marginBottom={1}>
          <Text bold color={colors.primary}>
            Choose analysis mode
          </Text>
        </Box>

        <Select items={options} onSelect={handleSelect} />
      </Box>
    </Box>
  )
}
