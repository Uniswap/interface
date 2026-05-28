import { useTranslation } from 'react-i18next'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'

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
