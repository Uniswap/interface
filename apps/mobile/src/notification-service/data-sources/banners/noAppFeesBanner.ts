import {
  Background,
  Content,
  Notification,
  NotificationVersion,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { BannerId } from 'src/notification-service/data-sources/banners/types'
import {
  NO_FEES_ICON,
  NO_UNISWAP_INTERFACE_FEES_BANNER_DARK,
  NO_UNISWAP_INTERFACE_FEES_BANNER_LIGHT,
} from 'ui/src/assets'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import i18n from 'uniswap/src/i18n'

/**
 * Check if No App Fees banner should be shown based on feature flag.
 * The processor will filter based on tracked state.onNavigate
 */
export async function checkNoAppFeesBanner(isDarkMode: boolean): Promise<InAppNotification | null> {
  const isEnabled = getFeatureFlag(FeatureFlags.NoUniswapInterfaceFees)

  if (!isEnabled) {
    return null
  }

  return createNoAppFeesBanner(isDarkMode)
}

/**
 * Create No App Fees banner notification
 */
function createNoAppFeesBanner(isDarkMode: boolean): InAppNotification {
  return new Notification({
    id: BannerId.NoAppFees,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('notification.noAppFees.title'),
      subtitle: i18n.t('notification.noAppFees.subtitle'),
      iconLink: NO_FEES_ICON,
      background: new Background({
        backgroundType: BackgroundType.IMAGE,
        link: isDarkMode ? NO_UNISWAP_INTERFACE_FEES_BANNER_DARK : NO_UNISWAP_INTERFACE_FEES_BANNER_LIGHT,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: uniswapUrls.helpArticleUrls.swapFeeInfo,
        }),
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [],
      extra: JSON.stringify({ cardType: 'dismissible', graphicType: 'gradient' }),
    }),
  })
}
