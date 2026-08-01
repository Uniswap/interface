import { isMobileWeb } from '@universe/environment'
import { connect } from '@wagmi/core'
import { useDispatch } from 'react-redux'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { hasActiveNeckKey } from 'uniswap/src/features/passkey/deviceSession'
import { listAuthenticators } from 'uniswap/src/features/passkey/embeddedWallet'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { useWagmiConnectorWithId } from '~/components/WalletModal/useWagmiConnectorWithId'
import { wagmiConfig } from '~/connection/wagmiConfig'
import { walletTypeToAmplitudeWalletType } from '~/connection/walletConnect'
import { setOpenModal } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { updateIsEmbeddedWalletBackedUp } from '~/state/user/reducer'

type CompleteEmbeddedWalletLoginInput = {
  walletAddress: string
  walletId: string
  exported?: boolean
  isCreate: boolean
}

/**
 * Runs the post-mutation login sequence for an embedded wallet:
 * persists the wallet to the embedded-wallet store, marks it connected,
 * triggers wagmi connect, and fires the appropriate analytics event.
 *
 * Shared between `useSignInWithPasskey` (normal flow) and the unitag
 * rate-limit speedbump's Continue button.
 */
export function useOnCompleteEmbeddedWalletLogin(): (input: CompleteEmbeddedWalletLoginInput) => Promise<void> {
  const { setEmbeddedWalletState } = useEmbeddedWalletState()
  const connector = useWagmiConnectorWithId(CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID, {
    shouldThrow: true,
  })
  const dispatch = useDispatch()
  const accountDrawer = useAccountDrawer()

  return useEvent(async ({ walletAddress, walletId, exported, isCreate }: CompleteEmbeddedWalletLoginInput) => {
    dispatch(updateIsEmbeddedWalletBackedUp({ isEmbeddedWalletBackedUp: exported ?? false }))
    setEmbeddedWalletState({ walletAddress, walletId, isConnected: true })
    await connect(wagmiConfig, { connector })
    if (isCreate) {
      sendAnalyticsEvent(InterfaceEventName.EmbeddedWalletCreated)
    } else {
      sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
        result: WalletConnectionResult.Succeeded,
        wallet_name: connector.name,
        wallet_type: walletTypeToAmplitudeWalletType(connector.type),
        wallet_address: walletAddress,
      })
      // Prompt legacy (v1) users to reconnect. Gate on a cached NECK so reading the recovery methods
      // never forces a WalletSignIn/passkey challenge (matches the Add-a-backup-login card); without
      // one, the Settings "Action required" entry still surfaces it.
      if (hasActiveNeckKey(walletId)) {
        try {
          const { recoveryMethods } = await listAuthenticators(walletId)
          if (recoveryMethods.some((method) => method.shouldRotate)) {
            dispatch(setOpenModal({ name: ModalName.ReconnectBackupLogin }))
          }
        } catch (error) {
          logger.error(error, { tags: { file: 'useOnCompleteEmbeddedWalletLogin', function: 'checkNeedsRotation' } })
        }
      }
    }
    // On mobile web the mini portfolio should not be shown after login (close also resets
    // the drawer's embedded login view state). On desktop it auto-opens after creation.
    if (isMobileWeb) {
      accountDrawer.close()
    } else if (isCreate) {
      accountDrawer.open()
    }
  })
}
