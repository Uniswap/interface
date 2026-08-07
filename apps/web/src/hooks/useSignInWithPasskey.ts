import {
  type SignInWithPasskeyOptions,
  useSignInWithPasskey as useSignInWithPasskeyCore,
} from '@universe/embedded-wallet'
import { useDispatch } from 'react-redux'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'
import { useWagmiConnectorWithId } from '~/components/WalletModal/useWagmiConnectorWithId'
import { walletTypeToAmplitudeWalletType } from '~/connection/walletConnect'
import { useOnCompleteEmbeddedWalletLogin } from '~/hooks/useOnCompleteEmbeddedWalletLogin'
import { setOpenModal } from '~/state/application/reducer'
import { isIFramed } from '~/utils/isIFramed'

/**
 * Web wiring for the shared passkey sign-in flow: speedbump and
 * unsupported-browser modals, connector analytics labels, and the
 * post-login sequence. The flow itself lives in `@universe/embedded-wallet`.
 */
export function useSignInWithPasskey(options: SignInWithPasskeyOptions = {}) {
  const dispatch = useDispatch()
  const connector = useWagmiConnectorWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, {
    shouldThrow: true,
  })
  const completeLogin = useOnCompleteEmbeddedWalletLogin()

  return useSignInWithPasskeyCore({
    ...options,
    deps: {
      completeLogin,
      onRateLimited: useEvent(({ walletAddress, walletId, exported }) =>
        dispatch(
          setOpenModal({
            name: ModalName.UnitagRateLimitSpeedbump,
            initialState: { walletAddress, walletId, exported },
          }),
        ),
      ),
      onUnsupportedPasskeyCreation: useEvent(() => dispatch(setOpenModal({ name: ModalName.UnsupportedBrowser }))),
      getConnectorMeta: useEvent(() => ({
        name: connector.name,
        amplitudeType: walletTypeToAmplitudeWalletType(connector.type),
      })),
      isIFramed: () => isIFramed(true),
    },
  })
}
