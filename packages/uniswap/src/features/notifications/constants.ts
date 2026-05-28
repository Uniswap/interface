import { borderRadii, iconSizes, spacing } from 'ui/src/theme'
import { ONE_MINUTE_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

// Timing
export const STALE_TRANSACTION_TIME_MS = ONE_MINUTE_MS * 30
export const DEFAULT_TOAST_HIDE_DELAY = 5 * ONE_SECOND_MS // 5 seconds

// Animation
export const SPRING_ANIMATION_DELAY = 100
export const HIDE_OFFSET_Y = -150
export const SPRING_ANIMATION = { damping: 30, stiffness: 150 }

// UI
export const TOAST_BORDER_WIDTH = spacing.spacing1
export const LARGE_TOAST_RADIUS = borderRadii.rounded24
export const SMALL_TOAST_RADIUS = borderRadii.roundedFull

export const NOTIFICATION_HEIGHT = 64
export const MAX_TEXT_LENGTH = 20
export const NOTIFICATION_ICON_SIZE = iconSizes.icon36
