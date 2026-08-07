import {
  type CompleteEmbeddedWalletLoginInput,
  useOnCompleteEmbeddedWalletLogin as useOnCompleteEmbeddedWalletLoginCore,
} from '@universe/embedded-wallet'
import { isMobileWeb } from '@universe/environment'
import { useDispatch } from 'react-redux'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { walletTypeToAmplitudeWalletType } from '~/connection/walletConnect'
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

  return useOnCompleteEmbeddedWalletLoginCore({
    getAmplitudeWalletType: walletTypeToAmplitudeWalletType,
    onBackupStateChanged: useEvent((isEmbeddedWalletBackedUp: boolean) =>
      dispatch(updateIsEmbeddedWalletBackedUp({ isEmbeddedWalletBackedUp })),
    ),
    onNeedsRecoveryRotation: useEvent(() => dispatch(setOpenModal({ name: ModalName.ReconnectBackupLogin }))),
    // On mobile web the mini portfolio should not be shown after login (close also resets
    // the drawer's embedded login view state). On desktop it auto-opens after creation.
    onLoginFinished: useEvent(({ isCreate }: { isCreate: boolean }) => {
      if (isMobileWeb) {
        accountDrawer.close()
      } else if (isCreate) {
        accountDrawer.open()
      }
    }),
  })
}
