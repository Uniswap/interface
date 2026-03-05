import { colors } from '@universe/cli/src/ui/utils/colors'
import { Text } from 'ink'

interface ToggleProps {
  label: string
  checked: boolean
  onToggle: () => void
  focused?: boolean
}

/**
 * Toggle component - does not handle its own input
 * Parent component should handle Enter/Space when this is focused
 */
export function Toggle({ label, checked, onToggle: _onToggle, focused = false }: ToggleProps): JSX.Element {
  return (
    <Text color={focused ? colors.primary : undefined}>
      {focused ? '❯ ' : '  '}
      {checked ? '◉' : '○'} {label}
    </Text>
  )
}
