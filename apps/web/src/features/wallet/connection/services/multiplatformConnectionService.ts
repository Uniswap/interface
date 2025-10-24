import { getWalletRequiresSeparatePrompt } from 'components/WalletModal/PendingWalletConnectionModal/state'
import { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { sleep } from 'utilities/src/time/timing'

type MultiPlatformConnectWalletServiceContext = {
  platformServices: Record<Platform, ConnectionService>
  /** Callback to trigger once one platform is connected. */
  onCompletedPlatform?: (platform: Platform) => void
  onRejectSVMConnection: (walletId: string) => void
}

const MULTIPLATFORM_CONNECTION_ORDER = [Platform.EVM, Platform.SVM] as const

export function createMultiPlatformConnectionService(ctx: MultiPlatformConnectWalletServiceContext): ConnectionService {
  return {
    async connect(params) {
      let connectedAtLeastOnePlatform = false

      for (const platform of MULTIPLATFORM_CONNECTION_ORDER) {
        // Skip if the wallet does not have a connector for this platform
        if (!params.wallet.connectorIds[platform]) {
          continue
        }

        const result = await ctx.platformServices[platform].connect(params)
        if (result.connected) {
          connectedAtLeastOnePlatform = true
          ctx.onCompletedPlatform?.(platform)
        } else {
          if (platform === Platform.SVM) {
            ctx.onRejectSVMConnection(params.wallet.id)
          }
        }

        // Wallets that require separate prompts can struggle to update state properly without delays between connections
        if (getWalletRequiresSeparatePrompt(params.wallet.id)) {
          await sleep(10)
        }
      }

      return { connected: connectedAtLeastOnePlatform }
    },
  }
}
