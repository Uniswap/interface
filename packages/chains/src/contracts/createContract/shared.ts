import type { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import type { JsonRpcSigner } from '@ethersproject/providers'
import type { Abi, Address, GetContractReturnType, PublicClient, WalletClient } from 'viem'

/**
 * Engine-agnostic contract handle. Mirrors viem's `getContract` shape so
 * call sites have a single, viem-native surface: `read.X([...])`,
 * `write.X([...])`, `simulate.X([...])`.
 */
export type ChainContract<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  { public: PublicClient; wallet: WalletClient },
  Address
>

// Discriminated on `signer`: `signerAddress` is required when a signer
// is supplied so we can build a viem WalletClient synchronously.
export type EthersChainContractParams<TAbi extends Abi> = {
  address: Address
  abi: TAbi
  provider: JsonRpcProvider | Web3Provider
} & ({ signer?: undefined; signerAddress?: undefined } | { signer: JsonRpcSigner; signerAddress: Address })

export type ViemChainContractParams<TAbi extends Abi> = {
  address: Address
  abi: TAbi
  publicClient: PublicClient
  // Required for `.write` at runtime but we
  // don't enforce it in the type system
  walletClient?: WalletClient
}

export type CreateContractParams<TAbi extends Abi> = EthersChainContractParams<TAbi> | ViemChainContractParams<TAbi>
