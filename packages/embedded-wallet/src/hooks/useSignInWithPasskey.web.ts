import { useMutation } from '@tanstack/react-query'
import {
  createNewEmbeddedWallet,
  signInWithPasskey as signInWithPasskeyAPI,
} from '@universe/embedded-wallet/src/features/passkey/embeddedWallet'
import { signMessageWithPasskey } from '@universe/embedded-wallet/src/features/passkey/signing'
import { isUnsupportedPasskeyCreationError } from '@universe/embedded-wallet/src/features/passkey/unsupportedPasskeyError'
import type {
  SignInWithPasskeyDeps,
  SignInWithPasskeyHandle,
  SignInWithPasskeyOptions,
  SignInWithPasskeyResult,
} from '@universe/embedded-wallet/src/hooks/types'
import { useEmbeddedWalletState } from '@universe/embedded-wallet/src/state/embeddedWalletStore'
import { useClaimUnitag } from 'uniswap/src/features/unitags/hooks/useClaimUnitag'
import { isUnitagRateLimitError } from 'uniswap/src/features/unitags/utils'
import { logger } from 'utilities/src/logger/logger'

/**
 * Signs in to or creates an embedded wallet via passkey, then runs the post-login sequence.
 *
 * If the user picks a unitag during creation and the claim hits a per-IP / per-device /
 * per-address limit, `onRateLimited` fires and the login step is deferred to the app
 * (web: the speedbump modal's Continue button).
 */
export function useSignInWithPasskey({
  createNewWallet = false,
  unitag,
  unitagSource,
  onSuccess,
  onError,
  deps,
}: SignInWithPasskeyOptions & { deps: SignInWithPasskeyDeps }): SignInWithPasskeyHandle {
  const { walletId: existingWalletId, setWalletId } = useEmbeddedWalletState()
  const claimUnitag = useClaimUnitag()

  const {
    mutate: signInWithPasskey,
    mutateAsync: signInWithPasskeyAsync,
    ...rest
  } = useMutation<SignInWithPasskeyResult>({
    mutationFn: async (): Promise<SignInWithPasskeyResult> => {
      // We do not support EW passkeys in iframes to prevent clickjacking
      // If a user is embedded in an iframe, they will be frame busted and redirected to the web app
      if (deps.isIFramed()) {
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
        deps.onRateLimited({ walletAddress, walletId, exported })
        return
      }
      await deps.completeLogin({ walletAddress, walletId, exported, isCreate: createNewWallet, unitagSource })
    },
    onError: (error: Error) => {
      if (createNewWallet) {
        logger.error(error, { tags: { file: 'useSignInWithPasskey', function: 'onError' } })
        // Unsupported OS/browser: show the modal pointing the user to the mobile app (INFRA-2166).
        if (isUnsupportedPasskeyCreationError(error)) {
          deps.onUnsupportedPasskeyCreation()
        }
      } else {
        const { name, amplitudeType } = deps.getConnectorMeta()
        logger.error(error, {
          tags: { file: 'useSignInWithPasskey', function: 'onError' },
          extra: { wallet_name: name, wallet_type: amplitudeType },
        })
      }
      onError?.(error)
    },
  })

  return { signInWithPasskey, signInWithPasskeyAsync, ...rest }
}
