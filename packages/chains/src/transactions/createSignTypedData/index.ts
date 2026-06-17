import { type EthersSignTypedDataParams, prepareEthersSignTypedData, sendEthersSignTypedData } from './ethers'
import {
  type ViemSignTypedDataParams,
  adaptEthersSignerToWalletClient,
  prepareViemSignTypedData,
  sendViemSignTypedData,
} from './viem'

/**
 * Pure ethers path, equivalent to the legacy flow.
 */
async function ethersSignTypedData({
  signer,
  domain,
  types,
  value,
  method = 'eth_signTypedData_v4',
  onFallback,
}: EthersSignTypedDataParams): Promise<string> {
  const prepared = await prepareEthersSignTypedData({ signer, domain, types, value })
  return sendEthersSignTypedData({ signer, prepared, method, onFallback })
}

/**
 * Pure viem path. Caller already holds a viem
 * `WalletClient` and passes viem-typed params.
 */
async function viemSignTypedData({
  walletClient,
  domain,
  types,
  value,
  method = 'eth_signTypedData_v4',
  onFallback,
  resolveName,
}: ViemSignTypedDataParams): Promise<string> {
  const prepared = await prepareViemSignTypedData({ walletClient, domain, types, value, resolveName })
  return sendViemSignTypedData({ walletClient, prepared, method, onFallback })
}

/**
 * Mixed path. Caller still holds an ethers `JsonRpcSigner` (because the wagmi
 * bridge hasn't been removed) but the viem-enabled flag is on. The ethers
 * signer is adapted into a viem `WalletClient` at the boundary.
 */
async function viemSignTypedDataWithEthersSigner({
  signer,
  domain,
  types,
  value,
  method = 'eth_signTypedData_v4',
  onFallback,
}: EthersSignTypedDataParams): Promise<string> {
  const walletClient = await adaptEthersSignerToWalletClient(signer)
  const prepared = await prepareViemSignTypedData({
    walletClient,
    domain,
    // Structurally compatible: ethers `TypedDataField` and viem
    // `TypedDataParameter` share the same `{ name, type }` shape.
    types,
    value,
    resolveName: (name) => signer.provider.resolveName(name) as Promise<string>,
  })
  return sendViemSignTypedData({ walletClient, prepared, method, onFallback })
}

/**
 * Chains-level signing surface. Callers pass either an
 * all-ethers params object or an all-viem params object.
 * The discriminator is the `signer` / `walletClient` field.
 */
export type SignTypedData = (params: EthersSignTypedDataParams | ViemSignTypedDataParams) => Promise<string>

/**
 * Three runtime cases:
 *
 *  - case 1: ethers params + `getViemEnabled()` false → ethers impl
 *  - case 2: ethers params + `getViemEnabled()` true → viem hashing/payload
 *    pipeline dispatched through the ethers signer's RPC transport. We don't
 *    want to rely on ethers internals to create a new viem client so we mix.
 *  - case 3: viem params (any flag) → viem impl
 */
export function createSignTypedData(ctx: { getViemEnabled: () => boolean }): SignTypedData {
  return (params) => {
    if ('walletClient' in params) {
      return viemSignTypedData(params)
    }
    if (ctx.getViemEnabled()) {
      return viemSignTypedDataWithEthersSigner(params)
    }
    return ethersSignTypedData(params)
  }
}
