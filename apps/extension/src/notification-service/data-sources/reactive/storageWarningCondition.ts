import {
  Content,
  Metadata,
  Notification,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { type ReactiveCondition } from '@universe/notifications'
import { GlobalErrorEvent } from 'src/app/events/constants'
import { globalEventEmitter } from 'src/app/events/global'
import { logger } from 'utilities/src/logger/logger'

/**
 * Storage threshold in bytes (500KB).
 * When remaining storage quota falls below this, show warning.
 */
const REMAINING_STORAGE_THRESHOLD_BYTES = 500_000

/**
 * Unique ID for the storage warning notification.
 * Uses 'local:' prefix to distinguish from backend-generated notifications.
 */
const STORAGE_WARNING_NOTIFICATION_ID = 'local:session:storage_warning'

/**
 * State tracked by the storage warning condition.
 */
interface StorageWarningConditionState {
  isLowStorage: boolean
  /** Whether the user is in onboarding flow (affects modal UI) */
  isOnboarding: boolean
}

/**
 * Context required to create the storage warning condition.
 */
interface CreateStorageWarningConditionContext {
  /** Whether this is being used in the onboarding context */
  isOnboarding: boolean
}

/**
 * Creates a reactive condition for the storage warning modal.
 *
 * The warning will show when:
 * - Remaining storage (quota - usage) is below 500KB (checked on mount)
 * - OR a ReduxStorageExceeded event is emitted
 *
 * The warning only shows once per session (like the original implementation).
 *
 * @see useCheckLowStorage for the original implementation
 */
export function createStorageWarningCondition(
  ctx: CreateStorageWarningConditionContext,
): ReactiveCondition<StorageWarningConditionState> {
  const { isOnboarding } = ctx

  // Track if we've already shown the warning this session
  let hasShownWarning = false

  return {
    notificationId: STORAGE_WARNING_NOTIFICATION_ID,

    subscribe: (onStateChange) => {
      // Check storage on initial subscription (if not onboarding)
      if (!isOnboarding) {
        navigator.storage
          .estimate()
          .then(({ quota, usage }) => {
            const remaining = (quota ?? 0) - (usage ?? 0)
            if (remaining < REMAINING_STORAGE_THRESHOLD_BYTES && !hasShownWarning) {
              hasShownWarning = true
              logger.info('storageWarningCondition', 'subscribe', 'Low storage warning triggered by quota check')
              onStateChange({ isLowStorage: true, isOnboarding })
            }
          })
          .catch(() => {
            // Silently ignore storage estimation errors
          })
      }

      // Listen for Redux storage exceeded events
      const listener = (): void => {
        if (!hasShownWarning) {
          hasShownWarning = true
          logger.info('storageWarningCondition', 'subscribe', 'Low storage warning triggered by ReduxStorageExceeded')
          onStateChange({ isLowStorage: true, isOnboarding })
        }
      }

      globalEventEmitter.addListener(GlobalErrorEvent.ReduxStorageExceeded, listener)

      // Return unsubscribe function
      return () => {
        globalEventEmitter.removeListener(GlobalErrorEvent.ReduxStorageExceeded, listener)
      }
    },

    shouldShow: (state) => {
      return state.isLowStorage
    },

    createNotification: (state): InAppNotification => {
      return new Notification({
        id: STORAGE_WARNING_NOTIFICATION_ID,
        content: new Content({
          // Use SYSTEM_BANNER style for system alerts
          style: ContentStyle.SYSTEM_BANNER,
          title: '', // Title is rendered by the custom renderer using i18n
          version: 0,
          buttons: [],
          onDismissClick: new OnClick({
            onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
          }),
        }),
        // Store isOnboarding in metadata business field for the renderer
        metadata: new Metadata({
          owner: 'local',
          business: state.isOnboarding ? 'storage_warning_onboarding' : 'storage_warning',
        }),
      })
    },
  }
}

/**
 * Type guard to check if a notification is the storage warning notification.
 * Used by NotificationContainer to route to the correct renderer.
 */
export function isStorageWarningNotification(notification: InAppNotification): boolean {
  return notification.id === STORAGE_WARNING_NOTIFICATION_ID
}

/**
 * Extract isOnboarding flag from notification metadata.
 * Uses the business field to determine if this is an onboarding notification.
 */
export function getIsOnboardingFromNotification(notification: InAppNotification): boolean {
  return notification.metadata?.business === 'storage_warning_onboarding'
}
