import {
  Background,
  Content,
  Notification,
  NotificationVersion,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { BannerId, MOBILE_NAV_PREFIX } from 'src/notification-service/data-sources/banners/types'
import {
  BRIDGED_ASSETS_CARD_BANNER,
  BRIDGED_ASSETS_V2_CARD_BANNER_DARK,
  BRIDGED_ASSETS_V2_CARD_BANNER_LIGHT,
} from 'ui/src/assets'
import i18n from 'uniswap/src/i18n'

/**
 * Check if Bridged Assets V2 banner should be shown based on feature flag.
 * The processor will filter based on tracked state.
 */
export async function checkBridgedAssetsV2Banner(isDarkMode: boolean): Promise<InAppNotification | null> {
  const isEnabled = getFeatureFlag(FeatureFlags.BridgedAssetsBannerV2)

  if (!isEnabled) {
    return null
  }

  return createBridgedAssetsV2Banner(isDarkMode)
}

/**
 * Create Bridged Assets V2 banner notification
 */
function createBridgedAssetsV2Banner(isDarkMode: boolean): InAppNotification {
  // Bridge to Unichain: pre-fill OUTPUT with Unichain native token, open INPUT selector for user to pick source
  const swapLink = `${MOBILE_NAV_PREFIX}swap?outputChain=unichain&selectingField=input`

  return new Notification({
    id: BannerId.BridgedAssetsV2,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.bridgedAssets.title'),
      subtitle: i18n.t('onboarding.home.intro.bridgedAssets.description.v2'),
      background: new Background({
        backgroundType: BackgroundType.IMAGE,
        link: isDarkMode ? BRIDGED_ASSETS_V2_CARD_BANNER_DARK : BRIDGED_ASSETS_V2_CARD_BANNER_LIGHT,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: swapLink,
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

/**
 * Check if Bridged Assets V1 banner should be shown based on feature flag.
 * The processor will filter based on tracked state.
 */
export async function checkBridgedAssetsBanner(): Promise<InAppNotification | null> {
  const isEnabled = getFeatureFlag(FeatureFlags.BridgedAssetsBanner)

  if (!isEnabled) {
    return null
  }

  return createBridgedAssetsBanner()
}

/**
 * Create Bridged Assets V1 banner notification
 */
function createBridgedAssetsBanner(): InAppNotification {
  // Bridge to Unichain: pre-fill OUTPUT with Unichain native token, open INPUT selector for user to pick source
  const swapLink = `${MOBILE_NAV_PREFIX}swap?outputChain=unichain&selectingField=input`

  return new Notification({
    id: BannerId.BridgedAssets,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.bridgedAssets.title'),
      subtitle: i18n.t('onboarding.home.intro.bridgedAssets.description'),
      background: new Background({
        backgroundType: BackgroundType.IMAGE,
        link: BRIDGED_ASSETS_CARD_BANNER,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: swapLink,
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
