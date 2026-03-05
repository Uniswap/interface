import {
  Background,
  Content,
  Notification,
  NotificationVersion,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { checkNotifications, type PermissionStatus } from 'react-native-permissions'
import { BannerId } from 'src/notification-service/data-sources/banners/types'
import { PUSH_NOTIFICATIONS_CARD_BANNER } from 'ui/src/assets'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import i18n from 'uniswap/src/i18n'

async function getPushPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await checkNotifications()
  return status
}

/**
 * Check if Push Notifications banner should be shown.
 * Shows when:
 * - NotificationOnboardingCard feature flag is enabled
 * - Push notifications are NOT already granted
 */
export async function checkPushNotificationsBanner(): Promise<InAppNotification | null> {
  const isEnabled = getFeatureFlag(FeatureFlags.NotificationOnboardingCard)

  if (!isEnabled) {
    return null
  }

  const permissionStatus = await getPushPermissionStatus()

  // Only show if notifications are not granted
  if (permissionStatus === 'granted') {
    return null
  }

  return createPushNotificationsBanner()
}

/**
 * Create Push Notifications banner notification
 */
function createPushNotificationsBanner(): InAppNotification {
  // Mobile navigation: open the notifications OS settings modal
  const notificationsLink = `mobile://modal/${ModalName.NotificationsOSSettings}`

  return new Notification({
    id: BannerId.PushNotifications,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.pushNotifications.title'),
      subtitle: i18n.t('onboarding.home.intro.pushNotifications.description'),
      background: new Background({
        backgroundType: BackgroundType.IMAGE,
        link: PUSH_NOTIFICATIONS_CARD_BANNER,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: notificationsLink,
        }),
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [],
      extra: JSON.stringify({ cardType: 'dismissible', graphicType: 'image' }),
    }),
  })
}
