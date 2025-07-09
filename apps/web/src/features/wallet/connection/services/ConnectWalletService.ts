import type { CustomConnectorId } from 'features/wallet/connection/connectors/custom'
import type {
  CustomWalletConnectorMeta,
  SolanaWalletConnectorMeta,
  WagmiWalletConnectorMeta,
  WalletConnectorMeta,
} from 'features/wallet/connection/types/WalletConnectorMeta'

export interface ConnectWalletService {
  connect(params: { walletConnector: WalletConnectorMeta }): Promise<void>
}

interface CreateConnectWalletServiceContext {
  connectSolanaWallet: (connector: SolanaWalletConnectorMeta) => Promise<void>
  connectWagmiWallet: (connector: WagmiWalletConnectorMeta) => Promise<void>
  connectCustomWalletsMap: Record<CustomConnectorId, (connector: CustomWalletConnectorMeta) => Promise<void>>
}

export function createConnectWalletService(ctx: CreateConnectWalletServiceContext): ConnectWalletService {
  const { connectSolanaWallet, connectWagmiWallet, connectCustomWalletsMap } = ctx

  return {
    connect: async (params: { walletConnector: WalletConnectorMeta }) => {
      const { customConnectorId, wagmiConnectorId, solanaWalletName } = params.walletConnector
      if (customConnectorId) {
        const connectCustomWallet = connectCustomWalletsMap[customConnectorId]
        await connectCustomWallet({ ...params.walletConnector, customConnectorId })
      }

      if (wagmiConnectorId) {
        await connectWagmiWallet({ ...params.walletConnector, wagmiConnectorId })
      }

      if (solanaWalletName) {
        await connectSolanaWallet({ ...params.walletConnector, solanaWalletName })
      }
    },
  }
}
