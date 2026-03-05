import { colors } from '@universe/cli/src/ui/utils/colors'
import { Box, Text } from 'ink'

interface TextInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  focused?: boolean
  isEditing?: boolean
  editValue?: string
  placeholder?: string
}

export function TextInput({
  label,
  value,
  onChange: _onChange,
  focused = false,
  isEditing = false,
  editValue,
  placeholder = '',
}: TextInputProps): JSX.Element {
  const displayValue = isEditing && editValue !== undefined ? editValue : value || placeholder

  return (
    <Box flexDirection="row">
      <Text color={focused ? colors.primary : undefined}>
        {focused ? '❯ ' : '  '}
        {label}:{' '}
        <Text bold={isEditing} dimColor={!value && !isEditing}>
          {displayValue}
        </Text>
        {isEditing && <Text dimColor> (Enter to save, Esc to cancel, type text)</Text>}
        {focused && !isEditing && <Text dimColor> (Enter to edit)</Text>}
      </Text>
    </Box>
  )
}
