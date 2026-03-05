import {
  Background,
  Content,
  Notification,
  NotificationVersion,
  OnClick,
} from '@uniswap/client-notification-service/dist/uniswap/notificationservice/v1/api_pb'
import { BackgroundType, ContentStyle, type InAppNotification, OnClickAction, SharedQueryClient } from '@universe/api'
import type { MobileState } from 'src/app/mobileReducer'
import { BannerId, UNITAG_NAV_PREFIX } from 'src/notification-service/data-sources/banners/types'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { UNITAG_SUFFIX_NO_LEADING_DOT } from 'uniswap/src/features/unitags/constants'
import i18n from 'uniswap/src/i18n'
import { UnitagScreens } from 'uniswap/src/types/screens/mobile'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Check if Unitag claim prompt should be shown.
 */
export async function checkUnitagClaim(getState: () => MobileState): Promise<InAppNotification | null> {
  const state = getState()
  const activeAccount = state.wallet.accounts[state.wallet.activeAccountAddress ?? '']

  if (!activeAccount || activeAccount.type !== AccountType.SignerMnemonic) {
    return null
  }

  // Check if any account has a unitag by reading from React Query cache
  // Unitags are fetched via API and cached, not stored in Redux
  const accounts = Object.values(state.wallet.accounts) as Array<{ address?: string }>
  const hasAnyUnitag = accounts.some((account) => {
    if (!account.address) {
      return false
    }
    // Normalize the address the same way useUnitagsAddressQuery does
    // This ensures we match the exact query key format used when caching
    const validatedAddress = getValidAddress({ address: account.address, platform: Platform.EVM })
    if (!validatedAddress) {
      return false
    }

    // Read from React Query cache using the same query key as useUnitagsAddressQuery
    const queryKey = [ReactQueryCacheKey.UnitagsApi, 'address', { address: validatedAddress }]
    const cachedUnitag = SharedQueryClient.getQueryData<{ username?: string }>(queryKey)

    return !!cachedUnitag?.username
  })

  if (hasAnyUnitag) {
    return null
  }

  // Note: We can't check canClaimUnitag here since it requires an async query
  // The notification will be shown and processor will handle dismissal if already claimed
  return createUnitagClaimBanner()
}

/**
 * Create Unitag claim banner notification
 */
function createUnitagClaimBanner(): InAppNotification {
  // Mobile navigation: navigate to UnitagStack > ClaimUnitag with entryPoint
  const unitagClaimLink = `${UNITAG_NAV_PREFIX}${UnitagScreens.ClaimUnitag}`

  return new Notification({
    id: BannerId.UnitagClaim,
    content: new Content({
      version: NotificationVersion.V0,
      style: ContentStyle.LOWER_LEFT_BANNER,
      title: i18n.t('onboarding.home.intro.unitag.title', { unitagDomain: UNITAG_SUFFIX_NO_LEADING_DOT }),
      subtitle: i18n.t('onboarding.home.intro.unitag.description'),
      background: new Background({
        backgroundType: BackgroundType.UNSPECIFIED,
        backgroundOnClick: new OnClick({
          onClick: [OnClickAction.EXTERNAL_LINK, OnClickAction.DISMISS, OnClickAction.ACK],
          onClickLink: unitagClaimLink,
        }),
      }),
      onDismissClick: new OnClick({
        onClick: [OnClickAction.DISMISS, OnClickAction.ACK],
      }),
      buttons: [],
      iconLink: 'custom:person-$accent1',
      // Encode cardType in extra field for IntroCard rendering
      extra: JSON.stringify({ cardType: 'dismissible', graphicType: 'icon' }),
    }),
  })
}
