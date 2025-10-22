import { PERMIT2_ADDRESS, permit2Address } from '@uniswap/permit2-sdk'
import { Contract, providers } from 'ethers/lib/ethers'
import PERMIT2_ABI from 'uniswap/src/abis/permit2.json'
import { Permit2 } from 'uniswap/src/abis/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

/**
 * Factory function to create a Permit2 contract instance
 * Use this when you need a contract for read operations or transaction building
 *
 * @returns Permit2 contract instance without signer
 */
export function createPermit2Contract(): Permit2 {
  // Permit2 has the same address on all chains
  return new Contract(PERMIT2_ADDRESS, PERMIT2_ABI) as Permit2
}

interface CreatePermit2ContractOptions {
  chainId: UniverseChainId
  provider: providers.Web3Provider | providers.JsonRpcProvider
  signerAddress: string
}

/**
 * Creates a Permit2 contract instance for a specific chain with a signer
 * Some legacy code uses chain-specific addresses
 *
 * @param options - Configuration object
 * @param options.chainId - Chain ID
 * @param options.provider - Provider with signer
 * @param options.signerAddress - Specific signer address to use (prevents using wrong account)
 * @returns Permit2 contract instance with signer
 */
export function createPermit2ContractForChain({
  chainId,
  provider,
  signerAddress,
}: CreatePermit2ContractOptions): Permit2 {
  const address = permit2Address(chainId)
  // Use the specific signer for the provided address
  const signer = provider.getSigner(signerAddress)
  return new Contract(address, PERMIT2_ABI, signer) as Permit2
}
