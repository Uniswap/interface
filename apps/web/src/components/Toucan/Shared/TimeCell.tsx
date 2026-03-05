import { useTranslation } from 'react-i18next'
import { Text } from 'ui/src'
import { useAbbreviatedTimeString } from '~/components/Table/utils'

interface TimeCellProps {
  /** Timestamp - either ISO string or milliseconds */
  timestamp: string | number | undefined
}

/**
 * Hook to get the formatted time ago string with "ago" suffix
 * Returns undefined placeholder if timestamp is undefined
 */
export function useTimeAgo(timestamp: string | number | undefined): string {
  const { t } = useTranslation()

  // Convert to milliseconds if needed
  const timestampMs = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp
  const timeAgo = useAbbreviatedTimeString(timestampMs ?? 0)

  if (timestamp === undefined || timestampMs === undefined) {
    return '-'
  }

  return `${timeAgo} ${t('common.ago')}`
}

/**
 * Renders a relative time display (e.g., "5m ago", "2h ago")
 * Uses the shared useAbbreviatedTimeString hook for consistent formatting
 */
export function TimeCell({ timestamp }: TimeCellProps): JSX.Element {
  const timeAgo = useTimeAgo(timestamp)

  return (
    <Text variant="body4" color="$neutral2">
      {timeAgo}
    </Text>
  )
}
