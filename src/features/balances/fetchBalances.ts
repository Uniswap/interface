import { providerManager } from 'src/chains/ProviderManager'
import { SupportedChainId } from 'src/constants/chains'
import { logger } from 'src/utils/logger'

export async function fetchBalances(address: string) {
  logger.debug('Fetching balances for:', address)
  // TODO move this elsewhere
  const provider = await providerManager.createProvider(SupportedChainId.GOERLI)
  const balance = await provider.getBalance(address)
  logger.debug('Balance:', balance.toString())
  return balance
}
