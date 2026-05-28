import {
  Background,
  Button,
  Content,
  Notification,
  NotificationVersion,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { DynamicConfigs, ForceUpgradeConfigKey, type ForceUpgradeStatus, getDynamicConfigValue } from '@universe/gating'
import { createIntervalNotificationDataSource, type NotificationDataSource } from '@universe/notifications'
import { UNISWAP_LOGO } from 'ui/src/assets'
import i18n from 'uniswap/src/i18n'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { MOBILE_APP_STORE_LINK } from 'wallet/src/constants/urls'

// Using 'local:' prefix to indicate these are client-only notifications
// This prevents the API tracker from sending AckNotification calls to the backend
enum ForceUpgradeNotificationId {
  Required = 'local:force_upgrade_required_modal',
  Recommended = 'local:force_upgrade_recommended_modal',
}

interface CreateForceUpgradeNotificationDataSourceContext {
  pollIntervalMs?: number
}

/**
 * Creates a notification data source specifically for force upgrade prompts.
 *
 * This data source:
 * - Polls Statsig for force upgrade status on a configurable interval
 * - Emits a modal notification when upgrade is required or recommended
 * - Handles the "required" vs "recommended" distinction via different notification IDs
 *
 * The notification displays a modal with:
 * - Update button: Opens the app store (iOS App Store or Google Play)
 * - Backup button (required only): Navigates to seed phrase settings
 * - Dismiss capability for recommended upgrades only
 *
 * Migration path:
 * This local data source can be replaced by a backend-controlled data source in the future.
 * The notification shape and rendering will remain the same - only the source changes.
 */
export function createForceUpgradeNotificationDataSource(
  ctx: CreateForceUpgradeNotificationDataSourceContext,
): NotificationDataSource {
  const { pollIntervalMs = 30 * ONE_SECOND_MS } = ctx // Poll every 30 seconds

  const getForceUpgradeStatus = (): ForceUpgradeStatus => {
    const status = getDynamicConfigValue({
      config: DynamicConfigs.ForceUpgrade,
      key: ForceUpgradeConfigKey.Status,
      defaultValue: 'not-required' as ForceUpgradeStatus,
    })

    // `getDynamicConfigValue` is untyped; validate to avoid unsafe returns.
    return isForceUpgradeStatus(status) ? status : 'not-required'
  }

  const dataSource: NotificationDataSource = createIntervalNotificationDataSource({
    pollIntervalMs,
    source: 'force_upgrade',
    logFileTag: 'createForceUpgradeNotificationDataSource',
    getNotifications: async () => {
      const status = getForceUpgradeStatus()
      if (status === 'not-required') {
        return []
      }
      return [createForceUpgradeNotification(status)]
    },
  })

  return dataSource
}

function isForceUpgradeStatus(value: unknown): value is ForceUpgradeStatus {
  return value === 'recommended' || value === 'required' || value === 'not-required'
}

function createForceUpgradeNotification(status: ForceUpgradeStatus): InAppNotification {
  const isRequired = status === 'required'
  const notificationId = isRequired ? ForceUpgradeNotificationId.Required : ForceUpgradeNotificationId.Recommended
  const updateButtonActions = isRequired
    ? [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS]
    : [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK]

  // Only the Update button is configured here - the Backup button is handled
  // internally by ForceUpgradeNotification component which shows seed phrase inline
  const buttons: Button[] = [
    new Button({
      text: i18n.t('forceUpgrade.action.confirm'),
      isPrimary: true,
      onClick: new OnClick({
        // Required: no ACK (persists until app updated). Recommended: ACK to dismiss permanently
        onClick: updateButtonActions,
        onClickLink: MOBILE_APP_STORE_LINK,
      }),
    }),
  ]

  return new Notification({
    id: notificationId,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.MODAL,
      title: isRequired ? i18n.t('forceUpgrade.title') : i18n.t('forceUpgrade.title.recommendedStatus'),
      subtitle: i18n.t('forceUpgrade.description.wallet'),
      background: new Background({
        backgroundType: BackgroundType.UNSPECIFIED,
      }),
      // Required upgrades: no dismiss button. Recommended: dismissible with ACK
      onDismissClick: isRequired
        ? undefined
        : new OnClick({
            onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
          }),
      buttons,
      iconLink: UNISWAP_LOGO,
      extra: JSON.stringify({
        cardType: isRequired ? 'required' : 'dismissible',
        isForceUpgrade: true,
      }),
    }),
  })
}
