import {
  Background,
  Content,
  Notification,
  NotificationVersion,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction } from '@universe/api'
import type { MobileState } from 'src/app/mobileReducer'
import { BannerId, MOBILE_NAV_PREFIX } from 'src/notification-service/data-sources/banners/types'
import { AccountType } from 'uniswap/src/features/accounts/types'
import i18n from 'uniswap/src/i18n'
import { hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'

/**
 * Check if recovery backup reminder should be shown.
 */
export async function checkRecoveryBackup(getState: () => MobileState): Promise<InAppNotification | null> {
  const state = getState()
  const activeAccount = state.wallet.accounts[state.wallet.activeAccountAddress ?? '']

  if (!activeAccount || activeAccount.type !== AccountType.SignerMnemonic) {
    return null
  }

  const hasBackup = hasExternalBackup(activeAccount)
  if (hasBackup) {
    return null
  }

  return createRecoveryBackupBanner()
}

/**
 * Create recovery backup banner notification
 */
function createRecoveryBackupBanner(): InAppNotification {
  // Mobile navigation: navigate to "Choose your backup method" screen
  const backupLink = `${MOBILE_NAV_PREFIX}backup`

  return new Notification({
    id: BannerId.RecoveryBackup,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.backup.title'),
      subtitle: i18n.t('onboarding.home.intro.backup.description.mobile'),
      background: new Background({
        backgroundType: BackgroundType.UNSPECIFIED,
        backgroundOnClick: new OnClick({
          // No ACK here - required notifications should reappear until the user completes the backup
          // The notification will stop showing once hasExternalBackup() returns true
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS],
          onClickLink: backupLink,
        }),
      }),
      // No onDismissClick - required cards cannot be dismissed
      buttons: [],
      iconLink: 'custom:shield-check-$accent1',
      // Encode cardType in extra field for IntroCard rendering
      extra: JSON.stringify({ cardType: 'required', graphicType: 'icon' }),
    }),
  })
}
