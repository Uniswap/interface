import {
  Background,
  Body,
  BodyItem,
  Notification,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { createNotificationProcessor } from '@universe/notifications/src/notification-processor/implementations/createNotificationProcessor'
import {
  type NotificationProcessor,
  type NotificationProcessorResult,
} from '@universe/notifications/src/notification-processor/NotificationProcessor'
import { type NotificationTracker } from '@universe/notifications/src/notification-tracker/NotificationTracker'
import { MONAD_LOGO_FILLED, MONAD_TEST_BANNER_LIGHT } from 'ui/src/assets'
import { getLogger } from 'utilities/src/logger/logger'

/**
 * Creates a base notification processor that implements style-based deduplication and limiting,
 * as well as separating primary and chained notifications using topological sorting.
 *
 * Processing rules:
 * 1. Builds a dependency graph of notifications based on POPUP actions
 * 2. Uses topological sort to identify root notifications (those with no incoming edges)
 * 3. Filters out notifications that have already been processed (tracked)
 * 4. Limits the number of primary notifications per content style (LOWER_LEFT_BANNER: 3, others: 1)
 * 5. Returns primary notifications for immediate rendering and chained notifications for later
 *
 * This properly handles notification chains of any length (A → B → C → D → ...).
 *
 * @param tracker - The NotificationTracker to check which notifications have been processed
 * @returns A NotificationProcessor that applies these rules
 */
export function createBaseNotificationProcessor(tracker: NotificationTracker): NotificationProcessor {
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

      // Step 3: Filter out notifications that are locally tracked or don't have DISMISS action
      const filteredPrimary = primaryNotifications.filter((notification) => {
        if (processedIds.has(notification.id)) {
          return false
        }
        if (!hasDismissAction(notification)) {
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
        if (!hasDismissAction(notification)) {
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

      // Step 3.5: Process notifications to inject hardcoded images for v1 (before CDN support)
      const processedPrimary = filteredPrimary.map(injectHardcodedImages)
      const processedChained = filteredChained.map(injectHardcodedImages)

      // Step 4: Limit the number of primary notifications per content style
      const limitedPrimary = limitNotifications(processedPrimary)

      // Step 5: Convert chained notifications to a Map for fast lookup
      const chainedMap = new Map<string, InAppNotification>()
      for (const notification of processedChained) {
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
 * Limits the number of notifications per content style.
 * - LOWER_LEFT_BANNER: up to 3 notifications
 * - All other styles: 1 notification each
 */
function limitNotifications(notifications: InAppNotification[]): InAppNotification[] {
  const groupedByStyle = new Map<ContentStyle, InAppNotification[]>()

  for (const notification of notifications) {
    const style = notification.content?.style ?? ContentStyle.UNSPECIFIED
    const group = groupedByStyle.get(style) ?? []
    group.push(notification)
    groupedByStyle.set(style, group)
  }

  const limited: InAppNotification[] = []

  for (const [style, group] of groupedByStyle.entries()) {
    const limit = style === ContentStyle.LOWER_LEFT_BANNER ? 3 : 1
    limited.push(...group.slice(0, limit))
  }

  return limited
}

/**
 * Injects hardcoded images for specific notifications (v1 workaround before CDN support).
 *
 * For Monad notifications:
 * - LOWER_LEFT_BANNER: Adds MONAD_TEST_BANNER_LIGHT as background and MONAD_LOGO_FILLED as icon
 * - MODAL: Adds MONAD_LOGO_FILLED as icon, MONAD_TEST_BANNER_LIGHT as background, and hardcoded feature list
 *
 * This is a temporary solution until remote image uploads and CDN are available.
 */
function injectHardcodedImages(notification: InAppNotification): InAppNotification {
  const notificationId = notification.id.toLowerCase()
  const style = notification.content?.style

  if (!notificationId.includes('monad')) {
    return notification
  }

  // Create a new Notification instance from the plain message and clone it
  const notificationObj = new Notification(notification)
  const cloned = notificationObj.clone()

  if (style === ContentStyle.LOWER_LEFT_BANNER) {
    if (cloned.content) {
      cloned.content.iconLink = MONAD_LOGO_FILLED
      cloned.content.background = new Background({
        backgroundType: BackgroundType.IMAGE,
        link: MONAD_TEST_BANNER_LIGHT,
        backgroundOnClick: cloned.content.background?.backgroundOnClick,
      })
    }
  } else if (style === ContentStyle.MODAL) {
    if (cloned.content) {
      cloned.content.iconLink = MONAD_LOGO_FILLED
      cloned.content.background = new Background({
        backgroundType: BackgroundType.IMAGE,
        link: MONAD_TEST_BANNER_LIGHT,
        backgroundOnClick: cloned.content.background?.backgroundOnClick,
      })

      // Hardcode feature list with temporary icon format
      cloned.content.body = new Body({
        items: [
          new BodyItem({
            text: cloned.content.body?.items[0]?.text,
            iconUrl: 'custom:coin-convert-$neutral2',
          }),
          new BodyItem({
            text: cloned.content.body?.items[1]?.text,
            iconUrl: 'custom:ethereum-$neutral2',
          }),
          new BodyItem({
            text: cloned.content.body?.items[2]?.text,
            iconUrl: 'custom:gas-$neutral2',
          }),
        ],
      })
    }
  }

  return cloned
}
