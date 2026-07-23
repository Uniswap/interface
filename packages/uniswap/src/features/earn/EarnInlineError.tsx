import { Text } from 'ui/src'

export function EarnInlineError({ message }: { message: string }): JSX.Element {
  return (
    <Text color="$statusCritical" textAlign="center" variant="body3">
      {message}
    </Text>
  )
}
