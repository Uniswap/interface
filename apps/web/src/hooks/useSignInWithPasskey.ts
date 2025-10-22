import { connect } from '@wagmi/core'
import { useWagmiConnectorWithId } from 'components/WalletModal/useWagmiConnectorWithId'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import { usePasskeyAuthWithHelpModal } from 'hooks/usePasskeyAuthWithHelpModal'
import { useDispatch } from 'react-redux'
import { useEmbeddedWalletState } from 'state/embeddedWallet/store'
import { updateIsEmbeddedWalletBackedUp } from 'state/user/reducer'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import {
  createNewEmbeddedWallet,
  signInWithPasskey as signInWithPasskeyAPI,
  signMessagesWithPasskey,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { useClaimUnitag } from 'uniswap/src/features/unitags/hooks/useClaimUnitag'
import { logger } from 'utilities/src/logger/logger'
import { isIFramed } from 'utils/isIFramed'

interface SignInWithPasskeyOptions {
  createNewWallet?: boolean
  unitag?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Hook that provides functionality to sign in with a passkey or create a new embedded wallet.
 * Upon successful sign-in, updates the embedded wallet state by:
 * - Setting the wallet address
 * - Setting isConnected to true
 * - Connecting the wallet using the embedded wallet connector
 *
 * @param {Object} options - Configuration options for the sign-in process
 * @param {boolean} [options.createNewWallet=false] - If true, creates a new embedded wallet instead of signing in with existing passkey
 * @param {() => void} [options.onSuccess] - Optional callback function to execute after successful sign-in
 * @param {(error: Error) => void} [options.onError] - Optional callback function to handle any errors during sign-in
 * @returns {() => Promise<void>} Async function that initiates the sign-in process
 */
export function useSignInWithPasskey({
  createNewWallet = false,
  unitag,
  onSuccess,
  onError,
}: SignInWithPasskeyOptions = {}) {
  const { setIsConnected, setWalletAddress } = useEmbeddedWalletState()
  const connector = useWagmiConnectorWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, {
    shouldThrow: true,
  })
  const claimUnitag = useClaimUnitag()
  const dispatch = useDispatch()

  const {
    mutate: signInWithPasskey,
    mutateAsync: signInWithPasskeyAsync,
    ...rest
  } = usePasskeyAuthWithHelpModal<{
    walletAddress: string
    exported?: boolean
  }>(
    async (): Promise<{ walletAddress: string; exported?: boolean }> => {
      // We do not support EW passkeys in iframes to prevent clickjacking
      // If a user is embedded in an iframe, they will be frame busted and redirected to the web app
      if (isIFramed(true)) {
        throw new Error('Passkeys are not supported in iframes')
      }

      if (createNewWallet) {
        const walletAddress = await createNewEmbeddedWallet(unitag ?? '')
        if (!walletAddress) {
          throw new Error(`Failed to create wallet for passkey`)
        }

        if (unitag) {
          const unitagResult = await claimUnitag({
            claim: {
              address: walletAddress,
              username: unitag,
            },
            context: {
              source: 'onboarding',
              hasENSAddress: false,
            },
            signMessage: async (message) => {
              const messages = await signMessagesWithPasskey([message])
              return messages?.[0] || ''
            },
          })

          if (unitagResult.claimError) {
            // TODO(WEB-7294): retry unitag flow
          }
        }

        return { walletAddress }
      } else {
        const signInResponse = await signInWithPasskeyAPI()
        if (!signInResponse) {
          throw new Error(`Failed to sign in with passkey`)
        }

        return signInResponse
      }
    },
    {
      onSuccess: ({ walletAddress, exported }) => {
        dispatch(updateIsEmbeddedWalletBackedUp({ isEmbeddedWalletBackedUp: exported ?? false }))
        setWalletAddress(walletAddress)
        setIsConnected(true)
        connect(wagmiConfig, { connector })
        if (createNewWallet) {
          sendAnalyticsEvent(InterfaceEventName.EmbeddedWalletCreated)
        } else {
          sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
            result: WalletConnectionResult.Succeeded,
            wallet_name: connector.name,
            wallet_type: walletTypeToAmplitudeWalletType(connector.type),
            wallet_address: walletAddress,
          })
        }
        onSuccess?.()
      },
      onError: (error: Error) => {
        if (createNewWallet) {
          logger.error(error, { tags: { file: 'useSignInWithPasskey', function: 'onError' } })
        } else {
          logger.error(error, {
            tags: { file: 'useSignInWithPasskey', function: 'onError' },
            extra: { wallet_name: connector.name, wallet_type: walletTypeToAmplitudeWalletType(connector.type) },
          })
        }
        onError?.(error)
      },
    },
  )

  return { signInWithPasskey, signInWithPasskeyAsync, ...rest }
}
