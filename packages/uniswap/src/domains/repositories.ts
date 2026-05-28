import { checkWalletDelegation } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import { createTradingApiDelegationRepository } from 'uniswap/src/features/smartWallet/delegation/createTradingApiDelegationRepository'
import type { DelegationRepository } from 'uniswap/src/features/smartWallet/delegation/delegationRepository'
import { getLogger } from 'utilities/src/logger/logger'

export function getDelegationRepository(): DelegationRepository {
  return createTradingApiDelegationRepository({
    tradingApiClient: {
      checkWalletDelegation,
    },
    logger: getLogger(),
  })
}
