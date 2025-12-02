import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text } from 'ink'

interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  focused?: boolean
  isEditing?: boolean
  editValue?: string
  min?: number
  max?: number
  step?: number
}

export function NumberInput({
  label,
  value,
  onChange: _onChange,
  focused = false,
  isEditing = false,
  editValue,
  min: _min,
  max: _max,
  step: _step = 1,
}: NumberInputProps): JSX.Element {
  const displayValue = isEditing && editValue !== undefined ? editValue : value

  return (
    <Box flexDirection="row">
      <Text color={focused ? colors.primary : undefined}>
        {focused ? '❯ ' : '  '}
        {label}: <Text bold={isEditing}>{displayValue}</Text>
        {isEditing && <Text dimColor> (Enter to save, Esc to cancel, type digits)</Text>}
        {focused && !isEditing && <Text dimColor> (↑↓←→ to adjust, Enter to edit)</Text>}
      </Text>
    </Box>
  )
}
