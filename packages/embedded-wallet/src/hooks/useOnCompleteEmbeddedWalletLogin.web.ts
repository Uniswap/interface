import { hasActiveNeckKey } from '@universe/embedded-wallet/src/features/passkey/deviceSession'
import { listAuthenticators } from '@universe/embedded-wallet/src/features/passkey/embeddedWallet'
import type {
  CompleteEmbeddedWalletLoginDeps,
  CompleteEmbeddedWalletLoginInput,
} from '@universe/embedded-wallet/src/hooks/types'
import { useEmbeddedWalletState } from '@universe/embedded-wallet/src/state/embeddedWalletStore'
import { connect } from '@wagmi/core'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useConfig } from 'wagmi'

/**
 * Runs the post-mutation login sequence for an embedded wallet:
 * persists the wallet to the embedded-wallet store, marks it connected,
 * triggers wagmi connect (via the app's wagmi context config), and fires
 * the appropriate analytics event.
 */
export function useOnCompleteEmbeddedWalletLogin(
  deps: CompleteEmbeddedWalletLoginDeps,
): (input: CompleteEmbeddedWalletLoginInput) => Promise<void> {
  const { setEmbeddedWalletState } = useEmbeddedWalletState()
  const config = useConfig()

  return useEvent(
    async ({ walletAddress, walletId, exported, isCreate, unitagSource }: CompleteEmbeddedWalletLoginInput) => {
      const connector = config.connectors.find((c) => c.id === CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID)
      if (!connector) {
        throw new Error('Embedded wallet connector is not registered in the wagmi config')
      }
      deps.onBackupStateChanged(exported ?? false)
      setEmbeddedWalletState({ walletAddress, walletId, isConnected: true })
      await connect(config, { connector })
      if (isCreate) {
        sendAnalyticsEvent(InterfaceEventName.EmbeddedWalletCreated, { unitag_source: unitagSource })
      } else {
        sendAnalyticsEvent(InterfaceEventName.WalletConnected, {
          result: WalletConnectionResult.Succeeded,
          wallet_name: connector.name,
          wallet_type: deps.getAmplitudeWalletType(connector.type),
          wallet_address: walletAddress,
        })
        // Prompt legacy (v1) users to reconnect. Gate on a cached NECK so reading the recovery methods
        // never forces a WalletSignIn/passkey challenge (matches the Add-a-backup-login card); without
        // one, the Settings "Action required" entry still surfaces it.
        if (hasActiveNeckKey(walletId)) {
          try {
            const { recoveryMethods } = await listAuthenticators(walletId)
            if (recoveryMethods.some((method) => method.shouldRotate)) {
              deps.onNeedsRecoveryRotation()
            }
          } catch (error) {
            logger.error(error, { tags: { file: 'useOnCompleteEmbeddedWalletLogin', function: 'checkNeedsRotation' } })
          }
        }
      }
      deps.onLoginFinished({ isCreate })
    },
  )
}
