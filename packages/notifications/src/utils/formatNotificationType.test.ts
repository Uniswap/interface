import { ContentStyle } from '@universe/api'
import { formatNotificationType } from '@universe/notifications/src/utils/formatNotificationType'
import { describe, expect, it } from 'vitest'

describe('formatNotificationType', () => {
  it('should format ContentStyle.MODAL', () => {
    expect(formatNotificationType(ContentStyle.MODAL)).toBe('modal')
  })

  it('should format ContentStyle.LOWER_LEFT_BANNER', () => {
    expect(formatNotificationType(ContentStyle.LOWER_LEFT_BANNER)).toBe('lower_left_banner')
  })

  it('should format ContentStyle.UNSPECIFIED', () => {
    expect(formatNotificationType(ContentStyle.UNSPECIFIED)).toBe('unspecified')
  })

  it('should return "unknown" for undefined', () => {
    expect(formatNotificationType(undefined)).toBe('unknown')
  })

  it('should return "unknown_N" for unrecognized numeric values', () => {
    expect(formatNotificationType(999 as ContentStyle)).toBe('unknown_999')
  })
})
