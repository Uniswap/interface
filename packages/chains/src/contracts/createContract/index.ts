import type { Abi } from 'viem'
import { createEthersContract } from './ethers'
import type { ChainContract, CreateContractParams } from './shared'
import { createViemContract, createViemContractFromEthersParams } from './viem'

export type CreateContract = <TAbi extends Abi>(params: CreateContractParams<TAbi>) => ChainContract<TAbi>

/**
 * Three runtime cases:
 *
 *  - viem-shaped params -> viem impl
 *  - ethers-shaped params + viem FF on -> bridged into viem
 *  - ethers-shaped params + viem FF off -> ethers impl
 *
 * The signer adapter takes the address as a param so
 * the seam never needs to await `signer.getAddress()`.
 */
export function createContract(ctx: { getViemEnabled: () => boolean }): CreateContract {
  return (params) => {
    if ('publicClient' in params) {
      return createViemContract(params)
    }
    if (ctx.getViemEnabled()) {
      return createViemContractFromEthersParams(params)
    }
    return createEthersContract(params)
  }
}
