import type { CustomConnectorId } from 'features/wallet/connection/connectors/custom'
import { ignoreExpectedConnectionErrors } from 'features/wallet/connection/connectors/utils'
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

  async function handleConnection<T extends WalletConnectorMeta>(
    connectFn: (connector: T) => Promise<void>,
    connector: T,
  ) {
    try {
      await connectFn(connector)
    } catch (error) {
      if (ignoreExpectedConnectionErrors(error)) {
        return
      }
      throw error
    }
  }

  return {
    connect: async (params: { walletConnector: WalletConnectorMeta }) => {
      const { customConnectorId, wagmi, solana } = params.walletConnector
      if (customConnectorId) {
        const connectCustomWallet = connectCustomWalletsMap[customConnectorId]
        await handleConnection(connectCustomWallet, { ...params.walletConnector, customConnectorId })
      }

      if (wagmi?.id) {
        await handleConnection(connectWagmiWallet, { ...params.walletConnector, wagmi })
      }

      if (solana?.walletName) {
        await handleConnection(connectSolanaWallet, { ...params.walletConnector, solana })
      }
    },
  }
}
