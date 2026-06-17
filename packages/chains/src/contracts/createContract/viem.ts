import type { JsonRpcProvider, JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { ensure0xHex } from '@universe/encoding'
import {
  type Abi,
  type Address,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  custom,
  getContract as viemGetContract,
} from 'viem'
import type { ChainContract, EthersChainContractParams, ViemChainContractParams } from './shared'

/**
 * Delegates straight to `viem.getContract`
 */
export function createViemContract<TAbi extends Abi>(params: ViemChainContractParams<TAbi>): ChainContract<TAbi> {
  const { address, abi, publicClient, walletClient } = params
  const client = walletClient ? { public: publicClient, wallet: walletClient } : { public: publicClient }
  // The runtime shape matches ChainContract; the cast widens the
  // narrower viem return type (which depends on whether a wallet was
  // passed). We promise the call surface always has .read / .write /
  // .simulate, regardless of which clients the caller actually has.
  // Without a walletClient, calls to write throw at runtime.
  return viemGetContract({ address, abi, client }) as unknown as ChainContract<TAbi>
}

/**
 * Wraps an ethers provider in a viem `custom` transport. All viem RPC
 * calls forward through the ethers JSON-RPC pipeline so we reuse the
 * provider's existing auth headers / batching / retry policy.
 */
function adaptEthersProviderToPublicClient(provider: JsonRpcProvider | Web3Provider): PublicClient {
  return createPublicClient({
    transport: custom({
      async request({ method, params }) {
        // oxlint-disable-next-line typescript/no-unsafe-return
        return provider.send(method, params ?? [])
      },
    }),
  })
}

/**
 * Wraps an ethers signer in a viem `WalletClient`.
 * Address passed in so the adapter stays sync.
 */
function adaptEthersSignerToWalletClient(signer: JsonRpcSigner, address: Address): WalletClient {
  return createWalletClient({
    account: ensure0xHex(address.toLowerCase()),
    transport: custom({
      async request({ method, params }) {
        // oxlint-disable-next-line typescript/no-unsafe-return
        return signer.provider.send(method, params ?? [])
      },
    }),
  })
}

/**
 * Caller has ethers `provider`/`signer` we want
 * to adapt. Bridge each at the transport layer.
 */
export function createViemContractFromEthersParams<TAbi extends Abi>(
  params: EthersChainContractParams<TAbi>,
): ChainContract<TAbi> {
  const { address, abi, provider, signer, signerAddress } = params
  const publicClient = adaptEthersProviderToPublicClient(provider)
  const walletClient = signer && signerAddress ? adaptEthersSignerToWalletClient(signer, signerAddress) : undefined
  return createViemContract({ address, abi, publicClient, walletClient })
}
