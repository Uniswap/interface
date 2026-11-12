import {
  type CompleteEmbeddedWalletLoginInput,
  useOnCompleteEmbeddedWalletLogin as useOnCompleteEmbeddedWalletLoginCore,
} from '@universe/embedded-wallet'
import { isMobileWeb } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useEvent } from 'utilities/src/react/hooks'
import { walletTypeToAmplitudeWalletType } from '~/connection/walletConnect'
import {
  shouldStayAfterConnect,
  useRedirectAfterConnect,
  useRedirectAfterConnectStore,
} from '~/features/wallet/hooks/useRedirectAfterConnect'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'
import { setOpenModal } from '~/state/application/reducer'
import { updateIsEmbeddedWalletBackedUp } from '~/state/user/reducer'

/**
 * Web wiring for the shared post-login sequence: redux backup flag, reconnect
 * modal, and the account drawer policy. The sequence itself lives in
 * `@universe/embedded-wallet`.
 */
export function useOnCompleteEmbeddedWalletLogin(): (input: CompleteEmbeddedWalletLoginInput) => Promise<void> {
  const dispatch = useDispatch()
  const accountDrawer = useAccountDrawer()
  const navigate = useNavigate()
  const isNewUserUxEnabled = useFeatureFlag(FeatureFlags.NewUserUx)
  const redirectAfterConnect = useRedirectAfterConnect()
  const clearRedirectAfterConnect = useRedirectAfterConnectStore((state) => state.clear)

  return useOnCompleteEmbeddedWalletLoginCore({
    getAmplitudeWalletType: walletTypeToAmplitudeWalletType,
    onBackupStateChanged: useEvent((isEmbeddedWalletBackedUp: boolean) =>
      dispatch(updateIsEmbeddedWalletBackedUp({ isEmbeddedWalletBackedUp })),
    ),
    onNeedsRecoveryRotation: useEvent(() => dispatch(setOpenModal({ name: ModalName.ReconnectBackupLogin }))),
    // On mobile web the mini portfolio should not be shown after login (close also resets
    // the drawer's embedded login view state). On desktop it auto-opens after creation.
    onLoginFinished: useEvent(({ isCreate }: { isCreate: boolean }) => {
      // A new wallet is known to be $0, so it skips the balance check the connect redirect waits on.
      if (isCreate && isNewUserUxEnabled && !shouldStayAfterConnect(window.location.pathname)) {
        // Landing may already have requested a connect redirect for this wallet; this one replaces it.
        clearRedirectAfterConnect()
        accountDrawer.close()
        // Creating on Portfolio already shows the unfunded view; navigating again would push a duplicate entry.
        if (window.location.pathname !== '/portfolio') {
          sendAnalyticsEvent(InterfaceEventName.UnfundedRedirectToPortfolio, { source: 'create' })
          navigate('/portfolio')
        }
        return
      }
      // Passkey sign-in starts from several surfaces that bypass connectWallet, so request the check here too.
      if (!isCreate) {
        redirectAfterConnect()
      }
      if (isMobileWeb) {
        accountDrawer.close()
      } else if (isCreate) {
        accountDrawer.open()
      }
    }),
  })
}
