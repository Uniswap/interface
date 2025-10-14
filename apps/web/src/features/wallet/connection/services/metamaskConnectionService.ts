import { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { sleep } from 'utilities/src/time/timing'

type MMConnectWalletServiceContext = {
  platformServices: Record<Platform, ConnectionService>
  onCompletedPlatform: (platform: Platform) => void
  onSvmRejected: () => void
}

const MULTIPLATFORM_CONNECTION_ORDER = [Platform.EVM, Platform.SVM] as const

// TODO(SWAP-657): Remove this once MM fixes their dual VM bug
export function createMetamaskConnectionService(ctx: MMConnectWalletServiceContext): ConnectionService {
  return {
    async connect(params) {
      let connectedAtLeastOnePlatform = false
      const rejected = {
        [Platform.EVM]: false,
        [Platform.SVM]: false,
      }

      for (const platform of MULTIPLATFORM_CONNECTION_ORDER) {
        const result = await ctx.platformServices[platform].connect(params)

        // Skip if the wallet does not have a connector for this platform (happens if e.g. solana flag is off)
        if (params.wallet.connectorIds[platform] === undefined) {
          continue
        }

        if (result.connected) {
          connectedAtLeastOnePlatform = true
          ctx.onCompletedPlatform(platform)
        } else {
          rejected[platform] = true
        }
      }

      if (rejected.svm && rejected.evm) {
        return { connected: false }
      }

      // Retry once if svm connection is rejected to handle MM dual VM bug
      if (rejected.svm) {
        connectedAtLeastOnePlatform = false
        ctx.onSvmRejected()

        // MM requires brief delay between connection attempts to reset internal state
        await sleep(400)
        const backupEvmAttemptResult = await ctx.platformServices[Platform.EVM].connect(params)
        if (backupEvmAttemptResult.connected) {
          connectedAtLeastOnePlatform = true
        }
      }

      return { connected: connectedAtLeastOnePlatform }
    },
  }
}
