import { useTranslation } from 'react-i18next'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'

/**
 * Hook to get the formatted time ago string with "ago" suffix
 * Returns a bare "-" placeholder if timestamp is missing or unparseable
 */
export function useTimeAgo(timestamp: string | number | undefined): string {
  const { t } = useTranslation()

  // Convert to milliseconds if needed
  const timestampMs = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp
  const timeAgo = useAbbreviatedTimeString(timestampMs ?? 0)

  if (timestampMs === undefined || !Number.isFinite(timestampMs)) {
    return '-'
  }

  return `${timeAgo} ${t('common.ago')}`
}
