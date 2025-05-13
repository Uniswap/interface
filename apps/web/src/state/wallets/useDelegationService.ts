import { getPublicClient } from '@wagmi/core'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { useMemo } from 'react'
import { useUpdateDelegatedState } from 'state/wallets/hooks'
import {
  DelegationRepository,
  DelegationService,
  createDelegationService,
} from 'uniswap/src/features/smartWallet/delegation/delegation'
import { isAddress } from 'utilities/src/addresses'
import { getLogger } from 'utilities/src/logger/logger'

export function useDelegationService(): DelegationService {
  const updateDelegatedState = useUpdateDelegatedState()
  return useMemo(() => {
    return createDelegationService({
      logger: getLogger(),
      delegationRepository: createDelegationRepository(),
      onDelegationDetected: (payload) => {
        // update redux state
        updateDelegatedState({ chainId: String(payload.chainId), address: payload.address })
      },
    })
  }, [updateDelegatedState])
}

const createDelegationRepository = (): DelegationRepository => {
  return {
    // checks the bytecode of the wallet (if a contract is deployed)
    getWalletBytecode: async (input: { address: string; chainId: number }): Promise<string> => {
      if (!isAddress(input.address)) {
        throw new Error('Invalid address')
      }

      // get the public client for the chain passed in
      const publicClient = getPublicClient(wagmiConfig, { chainId: input.chainId })

      if (!publicClient) {
        throw new Error('No public client set')
      }

      const result = await publicClient.getCode({ address: input.address as `0x${string}` })
      return result ?? '0x'
    },
  }
}
