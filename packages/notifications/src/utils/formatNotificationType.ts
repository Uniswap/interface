import { ContentStyle } from '@universe/api'

/**
 * Converts a ContentStyle enum value to a human-readable string for logging/telemetry
 * @param style - The ContentStyle enum value (numeric)
 * @returns A human-readable string representation of the notification type
 */
export function formatNotificationType(style: ContentStyle | undefined): string {
  if (style === undefined) {
    return 'unknown'
  }

  switch (style) {
    case ContentStyle.MODAL:
      return 'modal'
    case ContentStyle.LOWER_LEFT_BANNER:
      return 'lower_left_banner'
    case ContentStyle.UNSPECIFIED:
      return 'unspecified'
    default:
      return `unknown_${style}`
  }
}
