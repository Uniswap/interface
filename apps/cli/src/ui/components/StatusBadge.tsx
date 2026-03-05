import { colors } from '@universe/cli/src/ui/utils/colors'
import { Text } from 'ink'

type StatusType = 'success' | 'warning' | 'error' | 'info'

interface StatusBadgeProps {
  type: StatusType
  children: React.ReactNode
}

const statusColors: Record<StatusType, string> = {
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.primary,
}

export function StatusBadge({ type, children }: StatusBadgeProps): JSX.Element {
  return <Text color={statusColors[type]}>{children}</Text>
}
