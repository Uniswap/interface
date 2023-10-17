import { Text } from 'ui/src'
import { spacing } from 'ui/src/theme'

const ERROR_MESSAGE_OFFSET = -spacing.spacing24

export function InputError({ error }: { error?: string }): JSX.Element {
  return (
    <Text
      bottom={ERROR_MESSAGE_OFFSET}
      color="$statusCritical"
      minHeight="$spacing24"
      variant="body2">
      {error}
    </Text>
  )
}
