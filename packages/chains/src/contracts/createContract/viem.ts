import type { JsonRpcProvider, JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { ensure0xHex } from '@universe/encoding'
import {
  type Abi,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
  createPublicClient,
  createWalletClient,
  custom,
  getContract as viemGetContract,
} from 'viem'
import {
  type ChainContract,
  type EthersChainContractParams,
  type ViemChainContractParams,
  getWriteParameters,
} from './shared'

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
    // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid
    account: ensure0xHex(address.toLowerCase()),
    transport: custom({
      async request({ method, params }) {
        // oxlint-disable-next-line typescript/no-unsafe-return
        return signer.provider.send(method, params ?? [])
      },
    }),
  })
}

type ViemWriteFn = (args: readonly unknown[], options: Record<string, unknown>) => Promise<Hash>

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
  const contract = createViemContract({ address, abi, publicClient, walletClient })
  // Anything but a write then
  if (!walletClient) {
    return contract
  }
  // The bridged walletClient carries no `chain`, and viem refuses to
  // send a write with an undefined chain (ChainNotFoundError) unless told
  // `chain: null`. matching ethers behavior, so pin `chain: null` on
  // every write unless the caller explicitly overrides it.
  const viemWrite = (contract as unknown as { write: Record<string, ViemWriteFn> }).write
  const write = new Proxy(
    {},
    {
      get(_target, fnName: string) {
        return (...parameters: readonly unknown[]) => {
          const { args, options } = getWriteParameters(parameters)
          return viemWrite[fnName]?.(args, { chain: null, ...options })
        }
      },
    },
  )

  // Same widening cast as `createViemContract` — the runtime surface matches.
  return { ...contract, write } as unknown as ChainContract<TAbi>
}
