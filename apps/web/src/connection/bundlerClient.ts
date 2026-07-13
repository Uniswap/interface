import { createFetchClient, getEntryGatewayUrl, provideSessionService } from '@universe/api'
import { getIsSessionServiceEnabled } from '@universe/gating'
import { BASE_UNISWAP_HEADERS } from 'uniswap/src/data/apiClients/createUniswapFetchClient'
import { entryPoint08Address, type RpcUserOperation } from 'viem/account-abstraction'

/**
 * Fetch client for the ERC-4337 bundler RPC at EntryGateway (`/rpc/<chainId>`).
 * Wire shape mirrors the wallet-package mnemonic UserOp signer. Used by the
 * embedded-wallet `wallet_sendCalls` sponsored dispatch to submit signed
 * UserOperations to the bundler.
 */
export const bundlerFetchClient = createFetchClient({
  getBaseUrl: getEntryGatewayUrl,
  getHeaders: () => BASE_UNISWAP_HEADERS,
  getSessionService: () => provideSessionService({ getBaseUrl: getEntryGatewayUrl, getIsSessionServiceEnabled }),
  defaultOptions: { credentials: 'include' },
})

// Monotonic JSON-RPC request id so concurrent in-flight calls can't collide on
// id (matches the counter convention in `packages/chains/src/rpc`).
let nextRpcId = 1

/**
 * Submit a signed PackedUserOperation to the EntryGateway bundler.
 * Wire shape mirrors the wallet-package UserOp signer's `sendUserOp`.
 */
export async function sendUserOperationToBundler(
  signedUserOp: RpcUserOperation<'0.8'>,
  chainId: number,
): Promise<string> {
  const json = await bundlerFetchClient.post<{
    result?: string
    error?: { code: number; message: string }
  }>(`/rpc/${chainId}`, {
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: nextRpcId++,
      method: 'eth_sendUserOperation',
      params: [signedUserOp, entryPoint08Address],
    }),
  })
  if (json.error) {
    throw new Error(`Bundler RPC error ${json.error.code}: ${json.error.message}`)
  }
  if (!json.result) {
    throw new Error('Bundler returned empty result')
  }
  return json.result
}
