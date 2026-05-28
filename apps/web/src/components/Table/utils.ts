import { Column, RowData } from '@tanstack/react-table'
import { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { padding, zIndexes } from 'ui/src/theme'

/**
 * Displays the time as a human-readable string.
 *
 * @param {number} timestamp - Transaction timestamp in milliseconds.
 * @param {number} locale - BCP 47 language tag (e.g. en-US).
 * @returns {string} Message to display.
 */
export function useAbbreviatedTimeString(timestamp: number) {
  const { t } = useTranslation()
  const now = Date.now()
  const timeSince = now - timestamp
  const secondsPassed = Math.floor(timeSince / 1000)
  const minutesPassed = Math.floor(secondsPassed / 60)
  const hoursPassed = Math.floor(minutesPassed / 60)
  const daysPassed = Math.floor(hoursPassed / 24)
  const monthsPassed = Math.floor(daysPassed / 30)

  if (monthsPassed > 0) {
    return t(`common.time.past.months.short`, { months: monthsPassed })
  } else if (daysPassed > 0) {
    return t(`common.time.past.days.short`, { days: daysPassed })
  } else if (hoursPassed > 0) {
    return t(`common.time.past.hours.short`, { hours: hoursPassed })
  } else if (minutesPassed > 0) {
    return t(`common.time.past.minutes.short`, { minutes: minutesPassed })
  } else {
    return t(`common.time.past.seconds.short`, { seconds: secondsPassed })
  }
}

export function getCommonPinningStyles<Data extends RowData>(
  column: Column<Data, unknown>,
  colors: ReturnType<typeof useSporeColors>,
): CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastPinnedColumn = column.getIsLastColumn('left')

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : 0,
    position: isPinned ? 'sticky' : 'relative',
    zIndex: isPinned ? zIndexes.default : zIndexes.background,
    background: isPinned ? `${colors.surface2.val}F2` : 'transparent', // F2 = 95% opacity
    width: column.getSize(),
    borderRight: isLastPinnedColumn ? `1px solid ${colors.surface3.val}` : undefined,
    paddingLeft: column.getIsFirstColumn() ? `${padding.padding8}px` : 0,
    paddingRight: column.getIsLastColumn() || isLastPinnedColumn ? `${padding.padding8}px` : 0,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
  }
}
