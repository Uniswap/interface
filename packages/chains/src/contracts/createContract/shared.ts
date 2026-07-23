import type { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import type { JsonRpcSigner } from '@ethersproject/providers'
import type { Abi, Account, Address, Chain, GetContractReturnType, PublicClient, Transport, WalletClient } from 'viem'

/**
 * Engine-agnostic contract handle. Mirrors viem's `getContract` shape so
 * call sites have a single, viem-native surface: `read.X([...])`,
 * `write.X([...])`, `simulate.X([...])`.
 */
export type ChainContract<TAbi extends Abi> = GetContractReturnType<
  TAbi,
  { public: PublicClient; wallet: WalletClient<Transport, Chain, Account> },
  Address
>

/**
 * Mirrors viem's contract-write calling convention: the first parameter
 * is the args array when present, otherwise it is the options object.
 */
export function getWriteParameters(parameters: readonly unknown[]): {
  args: readonly unknown[]
  options: Record<string, unknown>
} {
  const hasArgs = Array.isArray(parameters[0])
  return {
    args: hasArgs ? (parameters[0] as readonly unknown[]) : [],
    options: ((hasArgs ? parameters[1] : parameters[0]) ?? {}) as Record<string, unknown>,
  }
}

// Discriminated on `signer`: `signerAddress` is required when a signer
// is supplied so we can build a viem WalletClient synchronously.
export type EthersChainContractParams<TAbi extends Abi> = {
  address: Address
  abi: TAbi
  // We always have a provider, either just the provider or
  // a signer that contains a provider. Signer required
  // for write, so we get read/write, not just read.
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
