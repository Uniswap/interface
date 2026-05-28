import { viemClients } from 'uniswap/src/features/providers/viemClients'
import { EmbeddedWalletProvider } from '~/connection/EmbeddedWalletProvider'

export const embeddedWalletProvider = new EmbeddedWalletProvider({
  getViemClient: (chainId) => viemClients.getViemClient(chainId),
})
