import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import {
  Content,
  ContentStyle,
  Notification,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { type InAppNotification, OnClickAction } from '@universe/api'
import { type ReactiveCondition } from '@universe/notifications'
import { type MobileState } from 'src/app/mobileReducer'
import { selectSomeModalOpen } from 'src/features/modals/selectSomeModalOpen'
import { selectFinishedOnboarding } from 'wallet/src/features/wallet/selectors'

/**
 * Unique ID for the offline banner notification.
 * Uses 'local:' prefix to distinguish from backend-generated notifications.
 */
export const OFFLINE_BANNER_NOTIFICATION_ID = 'local:session:offline'

/**
 * State tracked by the offline condition.
 */
interface OfflineConditionState {
  isConnected: boolean | null
  finishedOnboarding: boolean
  isModalOpen: boolean
}

/**
 * Context required to create the offline condition.
 */
interface CreateOfflineConditionContext {
  /** Function to get the current Redux state */
  getState: () => MobileState
}

/**
 * Creates a reactive condition for the offline banner.
 *
 * The banner will show when:
 * - Network connection is explicitly false (not null)
 * - User has finished onboarding
 * - No modal is currently open
 * - NOT in __DEV__ mode (handled at render level to match existing behavior)
 *
 * @see OfflineBanner for the original implementation
 */
export function createOfflineCondition(ctx: CreateOfflineConditionContext): ReactiveCondition<OfflineConditionState> {
  const { getState } = ctx

  return {
    notificationId: OFFLINE_BANNER_NOTIFICATION_ID,

    subscribe: (onStateChange: (state: OfflineConditionState) => void): (() => void) => {
      // Subscribe to network state changes
      const unsubscribe = NetInfo.addEventListener((netInfoState: NetInfoState) => {
        const reduxState = getState()
        onStateChange({
          isConnected: netInfoState.isConnected,
          finishedOnboarding: selectFinishedOnboarding(reduxState) ?? false,
          isModalOpen: selectSomeModalOpen(reduxState),
        })
      })

      return unsubscribe
    },

    shouldShow: (state: OfflineConditionState): boolean => {
      // Needs to explicitly check for false since isConnected may be null
      // Also check that user has finished onboarding and no modal is open
      return state.isConnected === false && state.finishedOnboarding && !state.isModalOpen
    },

    createNotification: (_state: OfflineConditionState): InAppNotification => {
      return new Notification({
        id: OFFLINE_BANNER_NOTIFICATION_ID,
        content: new Content({
          style: ContentStyle.SYSTEM_BANNER,
          title: '', // Title is rendered by the custom renderer using i18n
          version: 0,
          buttons: [],
          // System banners can be dismissed but will reappear in future sessions if the condition persists
          onDismissClick: new OnClick({
            onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
          }),
        }),
      })
    },
  }
}

/**
 * Type guard to check if a notification is the offline banner notification.
 * Used by NotificationContainer to route to the correct renderer.
 */
export function isOfflineBannerNotification(notification: InAppNotification): boolean {
  return notification.id === OFFLINE_BANNER_NOTIFICATION_ID
}
