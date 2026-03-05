import { useAppState } from '@universe/cli/src/ui/hooks/useAppState'
import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import { useCallback, useState } from 'react'

interface BugInputScreenProps {
  onContinue: () => void
  onBack: () => void
}

export function BugInputScreen({ onContinue, onBack }: BugInputScreenProps): JSX.Element {
  const { state, dispatch } = useAppState()
  const [bugDescription, setBugDescription] = useState(state.bugDescription || '')

  const handleSubmit = useCallback(() => {
    if (bugDescription.trim()) {
      dispatch({ type: 'SET_BUG_DESCRIPTION', description: bugDescription.trim() })
      onContinue()
    }
  }, [bugDescription, dispatch, onContinue])

  useInput(
    useCallback(
      (_input, key) => {
        if (key.escape) {
          onBack()
        }
      },
      [onBack],
    ),
  )

  return (
    <Box flexDirection="column" paddingX={2}>
      <Box marginBottom={2}>
        <Text bold color={colors.primary}>
          Bug Description
        </Text>
      </Box>

      {state.selectedRelease && (
        <Box flexDirection="column" marginBottom={2}>
          <Text dimColor>
            <Text bold>Release:</Text> {state.selectedRelease.platform}/{state.selectedRelease.version}
          </Text>
          {state.comparisonRelease && (
            <Text dimColor>
              <Text bold>Comparing with:</Text> {state.comparisonRelease.platform}/{state.comparisonRelease.version}
            </Text>
          )}
        </Box>
      )}

      <Box flexDirection="column" marginBottom={1}>
        <Text>Describe the bug you&apos;re trying to find:</Text>
        <Text dimColor>Include details about what&apos;s broken, when it occurs, and any error messages.</Text>
      </Box>

      <Box marginBottom={1}>
        <TextInput
          value={bugDescription}
          placeholder="e.g., Users can't connect wallet on mobile app after update..."
          onChange={setBugDescription}
          onSubmit={handleSubmit}
        />
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          Press Enter to continue{bugDescription.trim() ? '' : ' (enter a description first)'}, Esc to go back
        </Text>
      </Box>
    </Box>
  )
}
