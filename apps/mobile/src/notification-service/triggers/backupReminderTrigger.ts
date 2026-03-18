import {
  Content,
  Metadata,
  Notification,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { type TriggerCondition } from '@universe/notifications/src/notification-data-source/implementations/createLocalTriggerDataSource'
import { type MobileState } from 'src/app/mobileReducer'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import { selectBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/selectors'
import { setBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/slice'
import { hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'
import { selectActiveAccount } from 'wallet/src/features/wallet/selectors'

/**
 * Minimum portfolio value in USD to show the backup reminder
 */
const MIN_PORTFOLIO_VALUE_FOR_BACKUP_REMINDER = 100

/**
 * Cooldown period between backup reminders (24 hours)
 */
const BACKUP_REMINDER_COOLDOWN_MS = ONE_DAY_MS

/**
 * Unique ID for the backup reminder notification.
 * Uses 'local:' prefix to distinguish from backend-generated notifications.
 */
export const BACKUP_REMINDER_NOTIFICATION_ID = 'local:backup_reminder_modal'

/**
 * Context required to create the backup reminder trigger.
 */
interface CreateBackupReminderTriggerContext {
  /** Function to get the current Redux state */
  getState: () => MobileState
  /** Redux dispatch function */
  dispatch: (action: ReturnType<typeof setBackupReminderLastSeenTs>) => void
  /** Function to get current portfolio value in USD */
  getPortfolioValue: () => Promise<number>
}

/**
 * Creates a trigger condition for the backup reminder modal.
 *
 * The trigger will show the modal when:
 * - User has a signer account (not view-only)
 * - User has no external backups (Cloud or Manual)
 * - 24+ hours have passed since last reminder
 * - Portfolio value is >= $100 USD
 */
export function createBackupReminderTrigger(ctx: CreateBackupReminderTriggerContext): TriggerCondition {
  const { getState, dispatch, getPortfolioValue } = ctx

  return {
    id: BACKUP_REMINDER_NOTIFICATION_ID,

    shouldShow: async (): Promise<boolean> => {
      const state = getState()

      // Check Redux-based conditions first (cheap)
      const activeAccount = selectActiveAccount(state)
      if (!activeAccount) {
        return false
      }

      // Must be a signer account (not view-only)
      if (activeAccount.type !== AccountType.SignerMnemonic) {
        return false
      }

      // Must not have external backups
      if (hasExternalBackup(activeAccount)) {
        return false
      }

      // Check 24-hour cooldown
      const lastSeenTs = selectBackupReminderLastSeenTs(state)
      const now = Date.now()
      const timeSinceLastSeen = lastSeenTs ? now - lastSeenTs : Infinity
      if (timeSinceLastSeen < BACKUP_REMINDER_COOLDOWN_MS) {
        return false
      }

      // Finally, check portfolio value (async)
      try {
        const portfolioValue = await getPortfolioValue()
        return portfolioValue >= MIN_PORTFOLIO_VALUE_FOR_BACKUP_REMINDER
      } catch {
        // If we can't get portfolio value, don't show the modal
        return false
      }
    },

    createNotification: (): InAppNotification => {
      // Create a minimal notification - the actual UI is rendered by BackupReminderModalRenderer
      return new Notification({
        id: BACKUP_REMINDER_NOTIFICATION_ID,
        metadata: new Metadata({
          owner: 'local',
          business: 'backup_reminder',
        }),
        content: new Content({
          style: ContentStyle.MODAL,
          title: '', // Title handled by BackupReminderModal component
          version: 0,
          buttons: [], // Buttons handled by BackupReminderModal component
          // Required: notifications must have a DISMISS action to be valid
          onDismissClick: new OnClick({
            onClick: [OnClickAction.DISMISS],
          }),
        }),
      })
    },

    onAcknowledge: (): void => {
      // Update Redux to mark the last seen timestamp
      dispatch(setBackupReminderLastSeenTs(Date.now()))
    },
  }
}

/**
 * Type guard to check if a notification is the backup reminder notification.
 * Used by NotificationContainer to route to the correct renderer.
 */
export function isBackupReminderNotification(notification: InAppNotification): boolean {
  return notification.id === BACKUP_REMINDER_NOTIFICATION_ID
}
