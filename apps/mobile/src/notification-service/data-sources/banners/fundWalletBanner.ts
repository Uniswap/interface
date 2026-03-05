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
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import i18n from 'uniswap/src/i18n'
import { selectHasBalanceOrActivityForAddress } from 'wallet/src/features/wallet/selectors'

/**
 * Check if Fund Wallet banner should be shown.
 * Shows when:
 * - Active account is a signer account (not view-only)
 * - Wallet has no balance or activity (empty wallet state)
 */
export async function checkFundWalletBanner(getState: () => MobileState): Promise<InAppNotification | null> {
  const state = getState()
  const activeAddress = state.wallet.activeAccountAddress
  if (!activeAddress) {
    return null
  }

  const activeAccount = state.wallet.accounts[activeAddress]
  if (!activeAccount || activeAccount.type !== AccountType.SignerMnemonic) {
    return null
  }

  // Check if wallet has balance or activity - if it does, don't show the fund wallet card
  const hasBalanceOrActivity = selectHasBalanceOrActivityForAddress(state, activeAddress)
  if (hasBalanceOrActivity) {
    return null
  }

  return createFundWalletBanner()
}

/**
 * Create Fund Wallet banner notification
 */
function createFundWalletBanner(): InAppNotification {
  const fundWalletLink = `${MOBILE_NAV_PREFIX}modal/${ModalName.FundWallet}`

  return new Notification({
    id: BannerId.FundWallet,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.fund.title'),
      subtitle: i18n.t('onboarding.home.intro.fund.description'),
      background: new Background({
        backgroundType: BackgroundType.UNSPECIFIED,
        backgroundOnClick: new OnClick({
          // No ACK here - required notifications should reappear until the user funds their wallet
          // The notification will stop showing once hasBalanceOrActivity becomes true
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS],
          onClickLink: fundWalletLink,
        }),
      }),
      // No onDismissClick - required cards cannot be dismissed
      buttons: [],
      iconLink: 'custom:coin-$accent1',
      // Encode cardType in extra field for IntroCard rendering
      extra: JSON.stringify({ cardType: 'required', graphicType: 'icon' }),
    }),
  })
}
