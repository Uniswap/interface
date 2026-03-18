import {
  Content,
  Metadata,
  Notification,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { type TriggerCondition } from '@universe/notifications/src/notification-data-source/implementations/createLocalTriggerDataSource'
import { type ExtensionState } from 'src/store/extensionReducer'
import { appRatingStateSelector } from 'wallet/src/features/appRating/selectors'
import { setAppRating } from 'wallet/src/features/wallet/slice'

/**
 * Unique ID for the app rating notification.
 * Uses 'local:' prefix to distinguish from backend-generated notifications.
 */
export const APP_RATING_NOTIFICATION_ID = 'local:app_rating_modal'

/**
 * Context required to create the app rating trigger.
 */
interface CreateAppRatingTriggerContext {
  /** Function to get the current Redux state */
  getState: () => ExtensionState
  /** Redux dispatch function */
  dispatch: (action: ReturnType<typeof setAppRating>) => void
}

/**
 * Creates a trigger condition for the app rating modal.
 *
 * The trigger will show the modal when:
 * - User has completed 2+ consecutive successful swaps within 1 minute
 * - Either user has never been prompted, or enough time has passed since last prompt
 *   (120 days without feedback, 180 days with feedback)
 *
 * @see appRatingStateSelector for the full logic
 */
export function createAppRatingTrigger(ctx: CreateAppRatingTriggerContext): TriggerCondition {
  const { getState, dispatch } = ctx

  return {
    id: APP_RATING_NOTIFICATION_ID,

    shouldShow: () => {
      const state = getState()
      const { shouldPrompt } = appRatingStateSelector(state)
      return shouldPrompt
    },

    createNotification: (): InAppNotification => {
      // Create a minimal notification - the actual UI is rendered by AppRatingModalRenderer
      return new Notification({
        id: APP_RATING_NOTIFICATION_ID,
        metadata: new Metadata({
          owner: 'local',
          business: 'app_rating',
        }),
        content: new Content({
          style: ContentStyle.MODAL,
          title: '', // Title handled by AppRatingModal component
          version: 0,
          buttons: [], // Buttons handled by AppRatingModal component
          // Required: notifications must have a DISMISS action to be valid
          onDismissClick: new OnClick({
            onClick: [OnClickAction.DISMISS],
          }),
        }),
      })
    },

    onAcknowledge: () => {
      // Update Redux to mark that the user has been prompted
      // This is also done in AppRatingModal's useEffect, but we include it here
      // for consistency with the trigger pattern
      dispatch(setAppRating({}))
    },
  }
}

/**
 * Type guard to check if a notification is the app rating notification.
 * Used by NotificationContainer to route to the correct renderer.
 */
export function isAppRatingNotification(notification: InAppNotification): boolean {
  return notification.id === APP_RATING_NOTIFICATION_ID
}
