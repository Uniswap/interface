import {
  DelegationRepository,
  DelegationService,
  createDelegationService,
} from 'uniswap/src/features/smartWallet/delegation/delegation'
import { ensure0xHex } from 'uniswap/src/utils/hex'
import { getLogger } from 'utilities/src/logger/logger'
import { getProviderSync } from 'wallet/src/features/wallet/context'

const delegationRepository: DelegationRepository = {
  getWalletBytecode: async (input: { address: string; chainId: number }) => {
    const provider = getProviderSync(input.chainId)
    const bytecode = await provider.getCode(input.address)
    return ensure0xHex(bytecode)
  },
}

export const getDelegationService = (ctx?: {
  onDelegationDetected?: (input: { chainId: number; address: string }) => void
}): DelegationService => {
  return createDelegationService({
    logger: getLogger(),
    delegationRepository,
    onDelegationDetected: ctx?.onDelegationDetected,
  })
}
