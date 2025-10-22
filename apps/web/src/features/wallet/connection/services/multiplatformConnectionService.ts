import { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

type MultiPlatformConnectWalletServiceContext = {
  platformServices: Record<Platform, ConnectionService>
  /** Callback to trigger once one platform is connected. */
  onCompletedPlatform?: (platform: Platform) => void
}

const MULTIPLATFORM_CONNECTION_ORDER = [Platform.EVM, Platform.SVM] as const

export function createMultiPlatformConnectionService(ctx: MultiPlatformConnectWalletServiceContext): ConnectionService {
  return {
    async connect(params) {
      let connectedAtLeastOnePlatform = false

      for (const platform of MULTIPLATFORM_CONNECTION_ORDER) {
        const result = await ctx.platformServices[platform].connect(params)
        if (result.connected) {
          connectedAtLeastOnePlatform = true
          ctx.onCompletedPlatform?.(platform)
        }
      }

      return { connected: connectedAtLeastOnePlatform }
    },
  }
}
