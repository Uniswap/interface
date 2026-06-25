import { useMutation } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import {
  createNewEmbeddedWallet,
  signInWithPasskey as signInWithPasskeyAPI,
  signMessageWithPasskey,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { isUnsupportedPasskeyCreationError } from 'uniswap/src/features/passkey/unsupportedPasskeyError'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useClaimUnitag } from 'uniswap/src/features/unitags/hooks/useClaimUnitag'
import { isUnitagRateLimitError } from 'uniswap/src/features/unitags/utils'
import { logger } from 'utilities/src/logger/logger'
import { useWagmiConnectorWithId } from '~/components/WalletModal/useWagmiConnectorWithId'
import { walletTypeToAmplitudeWalletType } from '~/connection/walletConnect'
import { useOnCompleteEmbeddedWalletLogin } from '~/hooks/useOnCompleteEmbeddedWalletLogin'
import { setOpenModal } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { isIFramed } from '~/utils/isIFramed'

interface SignInWithPasskeyOptions {
  createNewWallet?: boolean
  unitag?: string
  onSuccess?: () => Promise<void> | void
  onError?: (error: Error) => void
}

type SignInWithPasskeyResult = {
  walletAddress: string
  walletId: string
  exported?: boolean
  isRateLimited?: boolean
}

/**
 * Signs in to or creates an embedded wallet via passkey, then runs the post-login sequence.
 *
 * If the user picks a unitag during creation and the claim hits a per-IP / per-device /
 * per-address limit, the speedbump modal is opened and the login step is deferred to
 * the speedbump's Continue button (see `UnitagRateLimitSpeedbumpModal`).
 */
export function useSignInWithPasskey({
  createNewWallet = false,
  unitag,
  onSuccess,
  onError,
}: SignInWithPasskeyOptions = {}) {
  const { walletId: existingWalletId, setWalletId } = useEmbeddedWalletState()
  const connector = useWagmiConnectorWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, {
    shouldThrow: true,
  })
  const claimUnitag = useClaimUnitag()
  const dispatch = useDispatch()
  const completeLogin = useOnCompleteEmbeddedWalletLogin()

  const {
    mutate: signInWithPasskey,
    mutateAsync: signInWithPasskeyAsync,
    ...rest
  } = useMutation<SignInWithPasskeyResult>({
    mutationFn: async (): Promise<SignInWithPasskeyResult> => {
      // We do not support EW passkeys in iframes to prevent clickjacking
      // If a user is embedded in an iframe, they will be frame busted and redirected to the web app
      if (isIFramed(true)) {
        throw new Error('Passkeys are not supported in iframes')
      }

      if (createNewWallet) {
        const walletData = await createNewEmbeddedWallet(unitag ?? '')
        if (!walletData) {
          throw new Error(`Failed to create wallet for passkey`)
        }

        let isRateLimited = false
        if (unitag) {
          const unitagResult = await claimUnitag({
            claim: {
              address: walletData.address,
              username: unitag,
            },
            context: {
              source: 'onboarding',
              hasENSAddress: false,
            },
            signMessage: async (message) => {
              const signedMessage = await signMessageWithPasskey(message, walletData.walletId)
              return signedMessage || ''
            },
          })

          if (unitagResult.errorCode !== undefined && isUnitagRateLimitError(unitagResult.errorCode)) {
            isRateLimited = true
          }
        }

        return {
          walletAddress: walletData.address,
          walletId: walletData.walletId,
          isRateLimited,
        }
      } else {
        const signInResponse = await signInWithPasskeyAPI(existingWalletId ?? undefined, {
          onWalletSignInFailureWithWalletId: () => setWalletId(null),
        })
        if (!signInResponse || !signInResponse.walletAddress || !signInResponse.walletId) {
          throw new Error(`Failed to sign in with passkey`)
        }

        return {
          walletAddress: signInResponse.walletAddress,
          walletId: signInResponse.walletId,
          exported: signInResponse.exported,
        }
      }
    },
    onSuccess: async ({ walletAddress, walletId, exported, isRateLimited }) => {
      await onSuccess?.()
      if (isRateLimited) {
        dispatch(
          setOpenModal({
            name: ModalName.UnitagRateLimitSpeedbump,
            initialState: { walletAddress, walletId, exported },
          }),
        )
        return
      }
      await completeLogin({ walletAddress, walletId, exported, isCreate: createNewWallet })
    },
    onError: (error: Error) => {
      if (createNewWallet) {
        logger.error(error, { tags: { file: 'useSignInWithPasskey', function: 'onError' } })
        // Unsupported OS/browser: show the modal pointing the user to the mobile app (INFRA-2166).
        if (isUnsupportedPasskeyCreationError(error)) {
          dispatch(setOpenModal({ name: ModalName.UnsupportedBrowser }))
        }
      } else {
        logger.error(error, {
          tags: { file: 'useSignInWithPasskey', function: 'onError' },
          extra: { wallet_name: connector.name, wallet_type: walletTypeToAmplitudeWalletType(connector.type) },
        })
      }
      onError?.(error)
    },
  })

  return { signInWithPasskey, signInWithPasskeyAsync, ...rest }
}
