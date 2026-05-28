import type { BlockaidScanJsonRpcRequest } from '@universe/api'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'

interface SignatureRequestData {
  chainId: UniverseChainId
  account: string
  method: BlockaidScanJsonRpcRequest['data']['method']
  params: unknown[]
  dappUrl: string
}

/**
 * Builds a Blockaid scan request for JSON-RPC requests
 * Supports signature requests (personal_sign, eth_signTypedData, etc.) and wallet_sendCalls
 * @param request JSON-RPC request data from dapp request
 * @returns Blockaid scan JSON-RPC request
 */
export function buildBlockaidScanJsonRpcRequest(request: SignatureRequestData): BlockaidScanJsonRpcRequest {
  const { chainId, account, method, params, dappUrl } = request

  return {
    chain: chainId.toString(),
    account_address: account,
    metadata: {
      domain: dappUrl,
    },
    data: {
      method,
      params,
    },
    options: ['validation', 'simulation'],
  }
}
