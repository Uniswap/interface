import { ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { createNotificationProcessor } from '@universe/notifications/src/notification-processor/implementations/createNotificationProcessor'
import {
  type NotificationProcessor,
  type NotificationProcessorResult,
} from '@universe/notifications/src/notification-processor/NotificationProcessor'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { getLogger } from 'utilities/src/logger/logger'

export interface BaseNotificationProcessorOptions {
  /**
   * Per-style overrides for the maximum number of concurrent primary notifications.
   * Defaults: LOWER_LEFT_BANNER=3, SYSTEM_BANNER=1, all others=1.
   *
   * Platforms with more LOWER_LEFT_BANNER sources (e.g. mobile) can raise the limit
   * so lower-priority banners aren't silently dropped by the style cap.
   */
  notificationTypeLimits?: Partial<Record<ContentStyle, number>>
}

/**
 * Creates a base notification processor that implements style-based deduplication and limiting,
 * as well as separating primary and chained notifications using topological sorting.
 *
 * Processing rules:
 * 1. Builds a dependency graph of notifications based on POPUP actions
 * 2. Uses topological sort to identify root notifications (those with no incoming edges)
 * 3. Filters out notifications that have already been processed (tracked)
 * 4. Limits the number of primary notifications per content style (see `options.notificationTypeLimits`)
 * 5. Returns primary notifications for immediate rendering and chained notifications for later
 *
 * This properly handles notification chains of any length (A → B → C → D → ...).
 *
 * @param tracker - The NotificationTracker to check which notifications have been processed
 * @param options - Optional per-style limit overrides
 * @returns A NotificationProcessor that applies these rules
 */
export function createBaseNotificationProcessor(
  tracker: NotificationTracker,
  options?: BaseNotificationProcessorOptions,
): NotificationProcessor {
  const notificationTypeLimits = options?.notificationTypeLimits
  return createNotificationProcessor({
    process: async (notifications: InAppNotification[]): Promise<NotificationProcessorResult> => {
      const processedIds = await tracker.getProcessedIds()

      // Step 1: Build dependency graph and identify roots using topological analysis
      const { roots, nonRoots } = identifyRootsAndChained(notifications)

      // Step 2: Separate primary (roots) and chained (non-roots) notifications
      const primaryNotifications: InAppNotification[] = []
      const chainedNotifications: InAppNotification[] = []

      for (const notification of notifications) {
        if (roots.has(notification.id)) {
          primaryNotifications.push(notification)
        } else if (nonRoots.has(notification.id)) {
          chainedNotifications.push(notification)
        }
      }

      // Step 3: Filter out notifications that are locally tracked or don't have DISMISS action.
      // Required cards are exempt from the DISMISS check — they self-dismiss when their
      // underlying data condition resolves (e.g. wallet receives funds).
      const filteredPrimary = primaryNotifications.filter((notification) => {
        if (processedIds.has(notification.id)) {
          return false
        }
        if (!isRequiredCard(notification) && !hasDismissAction(notification)) {
          getLogger().warn(
            'createBaseNotificationProcessor',
            'process',
            `Filtering out notification ${notification.id} - no DISMISS action found in any click configuration`,
            { notification },
          )
          return false
        }
        return true
      })

      const filteredChained = chainedNotifications.filter((notification) => {
        if (processedIds.has(notification.id)) {
          return false
        }
        if (!isRequiredCard(notification) && !hasDismissAction(notification)) {
          getLogger().warn(
            'createBaseNotificationProcessor',
            'process',
            `Filtering out notification ${notification.id} - no DISMISS action found in any click configuration`,
            { notification },
          )
          return false
        }
        return true
      })

      // Step 4: Limit the number of primary notifications per content style
      const limitedPrimary = limitNotifications(filteredPrimary, notificationTypeLimits)

      // Step 5: Convert chained notifications to a Map for fast lookup
      const chainedMap = new Map<string, InAppNotification>()
      for (const notification of filteredChained) {
        chainedMap.set(notification.id, notification)
      }

      return {
        primary: limitedPrimary,
        chained: chainedMap,
      }
    },
  })
}

/**
 * Returns true if the notification is a required card — one that self-dismisses when its
 * underlying data condition resolves rather than via explicit user action.
 */
function isRequiredCard(notification: InAppNotification): boolean {
  try {
    const extra = notification.content?.extra ? JSON.parse(notification.content.extra) : {}
    return extra.cardType === 'required'
  } catch {
    return false
  }
}

/**
 * Checks if a notification has at least one DISMISS action in any of its click configurations.
 * Every notification must have a way to be dismissed.
 */
function hasDismissAction(notification: InAppNotification): boolean {
  // Check all buttons for DISMISS action
  const buttons = notification.content?.buttons ?? []
  for (const button of buttons) {
    if (button.onClick?.onClick.includes(OnClickAction.DISMISS)) {
      return true
    }
  }

  // Check background click for DISMISS action
  const backgroundOnClick = notification.content?.background?.backgroundOnClick
  if (backgroundOnClick?.onClick.includes(OnClickAction.DISMISS)) {
    return true
  }

  // Check onDismissClick for DISMISS action (close button)
  const onDismissClick = notification.content?.onDismissClick
  if (onDismissClick?.onClick.includes(OnClickAction.DISMISS)) {
    return true
  }

  return false
}

/**
 * Identifies root notifications and chained notifications using graph analysis.
 *
 * Builds a dependency graph where:
 * - Nodes are notifications
 * - Edges represent POPUP actions (A → B means A has a button/background that pops up B)
 *
 * Root notifications are those with no incoming edges (not referenced by any POPUP action).
 * Chained notifications are those with at least one incoming edge.
 *
 * This properly handles chains of any length: A → B → C → D
 * - A is a root (no incoming edges)
 * - B, C, D are chained (have incoming edges)
 *
 * @returns Object with two sets: roots (primary notifications) and nonRoots (chained notifications)
 */
function identifyRootsAndChained(notifications: InAppNotification[]): { roots: Set<string>; nonRoots: Set<string> } {
  const allIds = new Set<string>(notifications.map((n) => n.id))
  const hasIncomingEdge = new Set<string>()

  for (const notification of notifications) {
    const popupTargets = extractPopupTargets(notification)

    for (const targetId of popupTargets) {
      if (allIds.has(targetId)) {
        hasIncomingEdge.add(targetId)
      }
    }
  }

  const roots = new Set<string>()
  const nonRoots = new Set<string>()

  for (const notification of notifications) {
    if (hasIncomingEdge.has(notification.id)) {
      nonRoots.add(notification.id)
    } else {
      roots.add(notification.id)
    }
  }

  return { roots, nonRoots }
}

/**
 * Extracts all notification IDs that are targeted by POPUP actions in this notification.
 * Checks both button clicks and background clicks.
 */
function extractPopupTargets(notification: InAppNotification): string[] {
  const targets: string[] = []

  const buttons = notification.content?.buttons ?? []
  for (const button of buttons) {
    const target = getPopupTarget(button.onClick)
    if (target) {
      targets.push(target)
    }
  }

  const backgroundTarget = getPopupTarget(notification.content?.background?.backgroundOnClick)
  if (backgroundTarget) {
    targets.push(backgroundTarget)
  }

  return targets
}

/**
 * Gets the target notification ID if this onClick action includes POPUP.
 */
function getPopupTarget(onClick: { onClick: OnClickAction[]; onClickLink?: string } | undefined): string | undefined {
  if (!onClick?.onClick.includes(OnClickAction.POPUP)) {
    return undefined
  }
  return onClick.onClickLink
}

/**
 * Default per-style limits. Platforms can override individual entries via
 * `BaseNotificationProcessorOptions.notificationTypeLimits`.
 *
 * - LOWER_LEFT_BANNER: up to 3 notifications
 * - SYSTEM_BANNER: 1 notification (sticky system alerts)
 * - All other styles: 1 notification each
 */
const DEFAULT_STYLE_LIMITS: Partial<Record<ContentStyle, number>> = {
  [ContentStyle.LOWER_LEFT_BANNER]: 3,
  [ContentStyle.SYSTEM_BANNER]: 1,
}
const FALLBACK_STYLE_LIMIT = 1

/**
 * Limits the number of notifications per content style, applying any caller overrides
 * on top of the defaults.
 */
function limitNotifications(
  notifications: InAppNotification[],
  notificationTypeLimits: Partial<Record<ContentStyle, number>> | undefined,
): InAppNotification[] {
  const groupedByStyle = new Map<number, InAppNotification[]>()

  for (const notification of notifications) {
    const style = notification.content?.style ?? ContentStyle.UNSPECIFIED
    const group = groupedByStyle.get(style) ?? []
    group.push(notification)
    groupedByStyle.set(style, group)
  }

  const limited: InAppNotification[] = []

  for (const [style, group] of groupedByStyle.entries()) {
    const limit = getStyleLimit(style, notificationTypeLimits)
    limited.push(...group.slice(0, limit))
  }

  return limited
}

/**
 * Returns the maximum number of concurrent notifications for a given content style,
 * preferring caller overrides, then defaults, then a generic fallback.
 */
function getStyleLimit(
  style: number,
  notificationTypeLimits: Partial<Record<ContentStyle, number>> | undefined,
): number {
  return (
    notificationTypeLimits?.[style as ContentStyle] ??
    DEFAULT_STYLE_LIMITS[style as ContentStyle] ??
    FALLBACK_STYLE_LIMIT
  )
}
